import { createClient } from "@/lib/supabase/server";
import { normalizeCPF, normalizePhone } from "@/utils/validators";

export interface AsaasCustomerPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
}

export interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
  dateCreated?: string;
}

export interface AsaasServiceResult {
  success: boolean;
  customerId: string | null;
  error?: string;
  alreadyExisted?: boolean;
}

export class AsaasService {
  private static readonly DEFAULT_TIMEOUT_MS = 15000;

  private static getApiBaseUrl(): string {
    const env = process.env.ASAAS_ENVIRONMENT || "production";
    if (env === "sandbox") {
      return "https://sandbox.asaas.com/api/v3";
    }
    return "https://api.asaas.com/v3";
  }

  private static getApiKey(): string | null {
    return process.env.ASAAS_API_KEY || null;
  }

  /**
   * Internal helper to make secure calls to the ASAAS REST API.
   * Features:
   * - Strict timeout via AbortController (prevents hung requests).
   * - Granular HTTP error code handling (400, 401, 404, 429, 500+).
   * - Headers and credentials are NEVER exposed to the client or log outputs.
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null; status?: number; isTimeout?: boolean }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { data: null, error: "ASAAS_API_KEY não configurada no servidor." };
    }

    const url = `${this.getApiBaseUrl()}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          access_token: apiKey,
          ...(options.headers || {}),
        },
      });

      clearTimeout(timeoutId);

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        let errorDesc: string;

        switch (response.status) {
          case 400:
            errorDesc =
              responseBody?.errors?.[0]?.description ||
              "Requisição inválida enviada ao ASAAS. Verifique os dados fornecidos.";
            break;
          case 401:
            errorDesc = "Falha de autenticação com o gateway de pagamentos ASAAS.";
            break;
          case 404:
            errorDesc =
              responseBody?.errors?.[0]?.description ||
              "Recurso não encontrado no ASAAS.";
            break;
          case 429:
            errorDesc = "Limite de requisições excedido no ASAAS (HTTP 429). Tente novamente em instantes.";
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorDesc = "Instabilidade temporária nos servidores do ASAAS. Tente novamente mais tarde.";
            break;
          default:
            errorDesc =
              responseBody?.errors?.[0]?.description ||
              `Erro retornado pelo ASAAS (HTTP ${response.status}).`;
        }

        return { data: null, error: errorDesc, status: response.status };
      }

      return { data: responseBody as T, error: null, status: response.status };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === "AbortError") {
        return {
          data: null,
          error: "Tempo limite de comunicação com o ASAAS esgotado (timeout). Tente novamente.",
          isTimeout: true,
        };
      }

      const message = err instanceof Error ? err.message : "Falha na comunicação com o ASAAS.";
      return { data: null, error: message };
    }
  }

  /**
   * Creates or retrieves the ASAAS customer for an authenticated user.
   * Idempotent: checks for existing asaas_customer_id or queries ASAAS by CPF before creating.
   */
  static async getOrCreateCustomer(targetUserId?: string): Promise<AsaasServiceResult> {
    try {
      const supabase = await createClient();

      // 1. Verify authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return { success: false, customerId: null, error: "Usuário não autenticado." };
      }

      const authenticatedUserId = userData.user.id;

      // 2. Strict multi-tenant check: user cannot query or create for another user
      if (targetUserId && targetUserId !== authenticatedUserId) {
        return { success: false, customerId: null, error: "Acesso não autorizado para outro usuário." };
      }

      const userId = authenticatedUserId;

      // 3. Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, document, phone, is_profile_complete, asaas_customer_id")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        return { success: false, customerId: null, error: "Perfil de usuário não encontrado." };
      }

      // 4. Verify that profile is marked as complete and has required data
      if (!profile.is_profile_complete || !profile.full_name || !profile.document) {
        return {
          success: false,
          customerId: null,
          error: "Perfil incompleto. Conclua o cadastro antes de vincular ao gateway de pagamentos.",
        };
      }

      // 5. If user already has an asaas_customer_id, return it immediately (Idempotent)
      if (profile.asaas_customer_id) {
        return {
          success: true,
          customerId: profile.asaas_customer_id,
          alreadyExisted: true,
        };
      }

      const normalizedCpf = normalizeCPF(profile.document);
      const normalizedPhone = profile.phone ? normalizePhone(profile.phone) : undefined;

      // 6. Check if customer already exists in ASAAS by CPF/email to avoid duplicates
      const searchRes = await this.request<{ data: AsaasCustomerResponse[] }>(
        `/customers?cpfCnpj=${encodeURIComponent(normalizedCpf)}`
      );

      if (searchRes.data && searchRes.data.data && searchRes.data.data.length > 0) {
        const existingCustomer = searchRes.data.data[0];

        // Save retrieved ASAAS customer ID to profile
        await supabase
          .from("profiles")
          .update({ asaas_customer_id: existingCustomer.id })
          .eq("id", userId);

        return {
          success: true,
          customerId: existingCustomer.id,
          alreadyExisted: true,
        };
      }

      // 7. Create new customer in ASAAS
      const customerPayload: AsaasCustomerPayload = {
        name: profile.full_name.trim(),
        email: profile.email.trim().toLowerCase(),
        cpfCnpj: normalizedCpf,
        mobilePhone: normalizedPhone || undefined,
      };

      const createRes = await this.request<AsaasCustomerResponse>("/customers", {
        method: "POST",
        body: JSON.stringify(customerPayload),
      });

      if (createRes.error || !createRes.data?.id) {
        return {
          success: false,
          customerId: null,
          error: createRes.error || "Falha ao registrar cliente no ASAAS.",
        };
      }

      const asaasCustomerId = createRes.data.id;

      // 8. Persist the new asaas_customer_id in Supabase profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ asaas_customer_id: asaasCustomerId })
        .eq("id", userId);

      if (updateError) {
        return {
          success: false,
          customerId: asaasCustomerId,
          error: "Cliente criado no ASAAS, mas houve falha ao salvar identificador no perfil.",
        };
      }

      return {
        success: true,
        customerId: asaasCustomerId,
        alreadyExisted: false,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao processar cliente ASAAS.";
      return { success: false, customerId: null, error: message };
    }
  }

  /**
   * Creates a recurring subscription in ASAAS via POST /v3/subscriptions.
   */
  static async createSubscription(
    payload: import("@/types/billing").AsaasSubscriptionPayload
  ): Promise<{
    data: import("@/types/billing").AsaasSubscriptionResponse | null;
    error: string | null;
    status?: number;
    isTimeout?: boolean;
  }> {
    try {
      return await this.request<import("@/types/billing").AsaasSubscriptionResponse>("/subscriptions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar assinatura no ASAAS.";
      return { data: null, error: message };
    }
  }

  /**
   * Retrieves a single subscription by ID via GET /v3/subscriptions/{id}.
   */
  static async getSubscription(
    subscriptionId: string
  ): Promise<{
    data: import("@/types/billing").AsaasSubscriptionResponse | null;
    error: string | null;
    status?: number;
  }> {
    try {
      return await this.request<import("@/types/billing").AsaasSubscriptionResponse>(
        `/subscriptions/${subscriptionId}`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao consultar assinatura no ASAAS.";
      return { data: null, error: message };
    }
  }

  /**
   * Lists subscriptions for a specific customer or query via GET /v3/subscriptions.
   */
  static async listSubscriptions(
    params: { customer?: string; externalReference?: string }
  ): Promise<{
    data: { data: import("@/types/billing").AsaasSubscriptionResponse[] } | null;
    error: string | null;
    status?: number;
  }> {
    try {
      const queryParts: string[] = [];
      if (params.customer) queryParts.push(`customer=${encodeURIComponent(params.customer)}`);
      if (params.externalReference) queryParts.push(`externalReference=${encodeURIComponent(params.externalReference)}`);
      const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

      return await this.request<{ data: import("@/types/billing").AsaasSubscriptionResponse[] }>(
        `/subscriptions${query}`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao listar assinaturas no ASAAS.";
      return { data: null, error: message };
    }
  }

  /**
   * Retrieves payments associated with a subscription via GET /v3/subscriptions/{id}/payments.
   */
  static async getSubscriptionPayments(
    subscriptionId: string
  ): Promise<{ data: { data: import("@/types/billing").AsaasPaymentItem[] } | null; error: string | null; status?: number }> {
    try {
      return await this.request<{ data: import("@/types/billing").AsaasPaymentItem[] }>(
        `/subscriptions/${subscriptionId}/payments`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao consultar pagamentos da assinatura.";
      return { data: null, error: message };
    }
  }

  /**
   * Cancels a recurring subscription in ASAAS via DELETE /v3/subscriptions/{id}.
   */
  static async cancelSubscription(
    subscriptionId: string
  ): Promise<{ data: { deleted: boolean; id: string } | null; error: string | null; status?: number }> {
    try {
      return await this.request<{ deleted: boolean; id: string }>(
        `/subscriptions/${subscriptionId}`,
        {
          method: "DELETE",
        }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao cancelar assinatura no ASAAS.";
      return { data: null, error: message };
    }
  }

  /**
   * Updates a recurring subscription in ASAAS via PUT /v3/subscriptions/{id}.
   */
  static async updateSubscription(
    subscriptionId: string,
    payload: import("@/types/billing").AsaasUpdateSubscriptionPayload
  ): Promise<{ data: import("@/types/billing").AsaasSubscriptionResponse | null; error: string | null; status?: number }> {
    try {
      return await this.request<import("@/types/billing").AsaasSubscriptionResponse>(
        `/subscriptions/${subscriptionId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar assinatura no ASAAS.";
      return { data: null, error: message };
    }
  }
}
