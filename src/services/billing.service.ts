import { createClient } from "@/lib/supabase/server";
import type { Subscription, SubscriptionAccessInfo, SubscriptionStatus, PlanCode } from "@/types/billing";

export class BillingService {
  /**
   * Default trial duration in days. Configurable via environment variable.
   * Defaults to 14 days if not explicitly configured.
   */
  static getTrialDurationDays(): number {
    const configuredDays = process.env.BILLING_TRIAL_DAYS;
    if (configuredDays && !isNaN(Number(configuredDays))) {
      return Number(configuredDays);
    }
    return 14;
  }

  /**
   * Maps an ASAAS subscription status to QEVIA's internal SubscriptionStatus.
   */
  static mapAsaasStatus(asaasStatus: string | null | undefined): SubscriptionStatus {
    switch (asaasStatus?.toUpperCase()) {
      case "ACTIVE":
        return "ACTIVE";
      case "EXPIRED":
        return "EXPIRED";
      case "INACTIVE":
      case "CANCELLED":
        return "CANCELLED";
      case "OVERDUE":
        return "OVERDUE";
      case "PENDING":
        return "PENDING_PAYMENT";
      default:
        return "TRIAL";
    }
  }

  /**
   * Retrieves the current subscription for the authenticated user.
   * If the user has no subscription record, initializes a default TRIAL subscription.
   */
  static async getOrCreateUserSubscription(targetUserId?: string): Promise<{
    subscription: Subscription | null;
    error: string | null;
  }> {
    try {
      const supabase = await createClient();

      // 1. Verify authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return { subscription: null, error: "Usuário não autenticado." };
      }

      const authenticatedUserId = userData.user.id;

      // 2. Strict multi-tenant verification
      if (targetUserId && targetUserId !== authenticatedUserId) {
        return { subscription: null, error: "Acesso não autorizado para outro usuário." };
      }

      const userId = authenticatedUserId;

      // 3. Fetch existing subscription
      const { data: existingSub, error: fetchError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) {
        return { subscription: null, error: fetchError.message };
      }

      if (existingSub) {
        return {
          subscription: {
            id: existingSub.id,
            userId: existingSub.user_id,
            asaasCustomerId: existingSub.asaas_customer_id,
            asaasSubscriptionId: existingSub.asaas_subscription_id,
            plan: existingSub.plan,
            status: existingSub.status,
            trialStartAt: existingSub.trial_start_at,
            trialEndAt: existingSub.trial_end_at,
            currentPeriodStart: existingSub.current_period_start,
            currentPeriodEnd: existingSub.current_period_end,
            cancelledAt: existingSub.cancelled_at,
            createdAt: existingSub.created_at,
            updatedAt: existingSub.updated_at,
          },
          error: null,
        };
      }

      // 4. If none exists, query profile to get asaas_customer_id if available
      const { data: profile } = await supabase
        .from("profiles")
        .select("asaas_customer_id")
        .eq("id", userId)
        .maybeSingle();

      // 5. Initialize default TRIAL subscription
      const now = new Date();
      const trialDays = this.getTrialDurationDays();
      const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

      const { data: newSub, error: insertError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          asaas_customer_id: profile?.asaas_customer_id || null,
          plan: "FREE_TRIAL",
          status: "TRIAL",
          trial_start_at: now.toISOString(),
          trial_end_at: trialEnd.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: trialEnd.toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        return { subscription: null, error: insertError.message };
      }

      return {
        subscription: {
          id: newSub.id,
          userId: newSub.user_id,
          asaasCustomerId: newSub.asaas_customer_id,
          asaasSubscriptionId: newSub.asaas_subscription_id,
          plan: newSub.plan,
          status: newSub.status,
          trialStartAt: newSub.trial_start_at,
          trialEndAt: newSub.trial_end_at,
          currentPeriodStart: newSub.current_period_start,
          currentPeriodEnd: newSub.current_period_end,
          cancelledAt: newSub.cancelled_at,
          createdAt: newSub.created_at,
          updatedAt: newSub.updated_at,
        },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao carregar assinatura.";
      return { subscription: null, error: message };
    }
  }

  /**
   * Computes access permissions and remaining days based on subscription state.
   */
  static getAccessInfo(subscription: Subscription | null): SubscriptionAccessInfo {
    if (!subscription) {
      return {
        hasAccess: false,
        status: "EXPIRED",
        isTrial: false,
        plan: "NONE",
      };
    }

    const now = new Date();

    if (subscription.status === "ACTIVE") {
      return {
        hasAccess: true,
        status: "ACTIVE",
        isTrial: false,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
      };
    }

    if (subscription.status === "TRIAL") {
      const trialEnd = subscription.trialEndAt ? new Date(subscription.trialEndAt) : null;
      const isStillValid = trialEnd ? trialEnd.getTime() > now.getTime() : false;
      const daysRemaining = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

      return {
        hasAccess: isStillValid,
        status: isStillValid ? "TRIAL" : "EXPIRED",
        isTrial: true,
        daysRemainingInTrial: daysRemaining,
        plan: subscription.plan,
        currentPeriodEnd: subscription.trialEndAt,
      };
    }

    if (subscription.status === "PENDING_PAYMENT") {
      // In grace period or waiting for first confirmation
      return {
        hasAccess: true,
        status: "PENDING_PAYMENT",
        isTrial: false,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
      };
    }

    if (subscription.status === "OVERDUE") {
      return {
        hasAccess: false,
        status: "OVERDUE",
        isTrial: false,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
      };
    }

    if (subscription.status === "CANCELLED") {
      // Check if current period has not ended yet
      const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
      const hasRemainingTime = periodEnd ? periodEnd.getTime() > now.getTime() : false;

      return {
        hasAccess: hasRemainingTime,
        status: "CANCELLED",
        isTrial: false,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
      };
    }

    return {
      hasAccess: false,
      status: "EXPIRED",
      isTrial: false,
      plan: subscription.plan,
    };
  }

  /**
   * Processes the checkout and creation of a PRO subscription for the authenticated user.
   * Resolves plan strictly from PLANS_CATALOG on the server.
   */
  static async createCheckoutSubscription(dto: import("@/types/billing").CheckoutSubscriptionDTO): Promise<import("@/types/billing").CheckoutResult> {
    try {
      const { getPlanByCode } = await import("@/config/plans");
      const { AsaasService } = await import("@/services/asaas.service");
      const supabase = await createClient();

      // 1. Verify authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return { success: false, error: "Usuário não autenticado." };
      }

      const userId = userData.user.id;

      // 2. Validate plan selection on server side
      const selectedPlan = getPlanByCode(dto.planCode);
      if (!selectedPlan) {
        return { success: false, error: "Plano informado é inválido." };
      }

      if (selectedPlan.code === "FREE") {
        return { success: false, error: "O plano Gratuito não requer contratação ou cobrança." };
      }

      // 3. Verify user profile completion
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, document, phone, is_profile_complete, asaas_customer_id")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        return { success: false, error: "Perfil não encontrado." };
      }

      if (!profile.is_profile_complete || !profile.document || !profile.phone || !profile.full_name) {
        return { success: false, error: "Conclua o cadastro antes de prosseguir com a assinatura." };
      }

      // 4. Ensure customer exists in ASAAS
      let asaasCustomerId = profile.asaas_customer_id;
      if (!asaasCustomerId) {
        const customerResult = await AsaasService.getOrCreateCustomer();
        if (!customerResult.success || !customerResult.customerId) {
          return { success: false, error: customerResult.error || "Não foi possível vincular o cliente no ASAAS." };
        }
        asaasCustomerId = customerResult.customerId;
      }

      // 5. Prevent duplicate active PRO subscriptions
      const { data: currentSub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (currentSub && (currentSub.status === "ACTIVE" || currentSub.status === "PENDING_PAYMENT") && currentSub.plan === selectedPlan.code) {
        return {
          success: true,
          subscriptionId: currentSub.id,
          asaasSubscriptionId: currentSub.asaas_subscription_id || undefined,
          status: currentSub.status,
          plan: selectedPlan.code,
        };
      }

      // 6. Build ASAAS subscription payload
      // Cycle: MONTHLY or YEARLY
      const cycle: import("@/types/billing").AsaasSubscriptionCycle = selectedPlan.interval === "YEARLY" ? "YEARLY" : "MONTHLY";
      
      // Next due date: today in YYYY-MM-DD format
      const today = new Date();
      const nextDueDate = today.toISOString().split("T")[0];

      const billingType: import("@/types/billing").AsaasBillingType = dto.billingType || "UNDEFINED";

      const subscriptionPayload: import("@/types/billing").AsaasSubscriptionPayload = {
        customer: asaasCustomerId,
        billingType,
        value: selectedPlan.price,
        nextDueDate,
        cycle,
        description: `Assinatura QEVIA ${selectedPlan.name}`,
        externalReference: userId,
      };

      // 7. Create recurring subscription in ASAAS
      let asaasRes = await AsaasService.createSubscription(subscriptionPayload);

      // Timeout / uncertainty guard: If createSubscription timed out, check if it was actually created on ASAAS
      if (asaasRes.isTimeout || (asaasRes.error && !asaasRes.data?.id)) {
        const verifyRes = await AsaasService.listSubscriptions({
          customer: asaasCustomerId,
          externalReference: userId,
        });

        if (verifyRes.data?.data && verifyRes.data.data.length > 0) {
          const matchedSub = verifyRes.data.data.find(
            (s) => s.value === selectedPlan.price && s.cycle === cycle && s.status !== "INACTIVE" && s.status !== "CANCELLED"
          ) || verifyRes.data.data[0];

          if (matchedSub?.id) {
            asaasRes = { data: matchedSub, error: null };
          }
        }
      }

      if (asaasRes.error || !asaasRes.data?.id) {
        return {
          success: false,
          error: asaasRes.error || "Falha ao gerar assinatura no gateway de pagamento.",
        };
      }

      const asaasSub = asaasRes.data;
      const initialStatus = this.mapAsaasStatus(asaasSub.status);

      // Period dates
      const periodStart = today.toISOString();
      const periodDurationMonths = selectedPlan.interval === "YEARLY" ? 12 : 1;
      const periodEnd = new Date(today);
      periodEnd.setMonth(periodEnd.getMonth() + periodDurationMonths);

      // 8. Persist or update subscription in public.subscriptions
      const upsertData: import("@/lib/supabase/types").Database["public"]["Tables"]["subscriptions"]["Insert"] = {
        user_id: userId,
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: asaasSub.id,
        plan: selectedPlan.code,
        status: initialStatus,
        current_period_start: periodStart,
        current_period_end: periodEnd.toISOString(),
      };

      const { data: savedSub, error: dbError } = await supabase
        .from("subscriptions")
        .upsert(upsertData, { onConflict: "user_id" })
        .select()
        .single();

      if (dbError) {
        return {
          success: false,
          error: "Assinatura criada no ASAAS, mas ocorreu erro ao salvar na base.",
        };
      }

      // 9. Fetch payment URL/invoice URL if available
      let paymentUrl: string | null = null;
      try {
        const paymentsRes = await AsaasService.getSubscriptionPayments(asaasSub.id);
        if (paymentsRes.data?.data && paymentsRes.data.data.length > 0) {
          const firstPayment = paymentsRes.data.data[0];
          paymentUrl = firstPayment.invoiceUrl || firstPayment.bankSlipUrl || null;
        }
      } catch {
        // Non-fatal, paymentUrl remains null
      }

      return {
        success: true,
        subscriptionId: savedSub.id,
        asaasSubscriptionId: asaasSub.id,
        status: savedSub.status,
        plan: selectedPlan.code,
        paymentUrl,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado no checkout.";
      return { success: false, error: message };
    }
  }

  /**
   * Validates the authenticity of an incoming ASAAS webhook request.
   * Compares the 'asaas-access-token' header against ASAAS_WEBHOOK_ACCESS_TOKEN or ASAAS_API_KEY.
   */
  static validateWebhookToken(receivedToken: string | null | undefined): boolean {
    if (!receivedToken || typeof receivedToken !== "string") {
      return false;
    }
    const configuredToken = process.env.ASAAS_WEBHOOK_ACCESS_TOKEN || process.env.ASAAS_API_KEY;
    if (!configuredToken) {
      return false;
    }
    return receivedToken.trim() === configuredToken.trim();
  }

  /**
   * Process incoming ASAAS webhook events idempotently.
   * Updates public.subscriptions and logs to public.webhook_events.
   */
  static async processAsaasWebhook(
    payload: import("@/types/billing").AsaasWebhookPayload,
    customClient?: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>
  ): Promise<import("@/types/billing").WebhookProcessResult> {
    if (!payload || !payload.event) {
      return { success: false, error: "Payload do webhook malformado ou evento ausente." };
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = customClient || createAdminClient();

    // 1. Generate or extract unique event identifier
    const eventId =
      payload.id ||
      (payload.payment
        ? `${payload.event}_${payload.payment.id}_${payload.payment.status || payload.payment.dueDate || ""}`
        : `${payload.event}_${payload.subscription?.id || "sub"}_${payload.dateCreated || ""}`);

    const eventType = payload.event;

    try {
      // 2. Idempotency Check: check if event already recorded and processed
      const { data: existingEvent, error: checkError } = await supabase
        .from("webhook_events")
        .select("id, processed, processed_at")
        .eq("provider", "ASAAS")
        .eq("event_id", eventId)
        .maybeSingle();

      if (!checkError && existingEvent?.processed) {
        return {
          success: true,
          duplicate: true,
          eventId,
          eventType,
          message: "Evento já processado anteriormente.",
        };
      }

      // Record event initially if not existing
      if (!existingEvent) {
        await supabase.from("webhook_events").insert({
          event_id: eventId,
          event_type: eventType,
          provider: "ASAAS",
          processed: false,
          payload: payload as unknown as import("@/lib/supabase/types").Json,
        });
      }

      // 3. Locate target subscription
      const asaasSubId = payload.payment?.subscription || payload.subscription?.id;
      const asaasCustId = payload.payment?.customer || payload.subscription?.customer;
      const externalRef = payload.payment?.externalReference || payload.subscription?.externalReference;

      let subQuery = supabase.from("subscriptions").select("*");

      if (externalRef) {
        subQuery = subQuery.eq("user_id", externalRef);
      } else if (asaasSubId) {
        subQuery = subQuery.eq("asaas_subscription_id", asaasSubId);
      } else if (asaasCustId) {
        subQuery = subQuery.eq("asaas_customer_id", asaasCustId);
      } else {
        await supabase
          .from("webhook_events")
          .update({
            error_message: "Não foi possível extrair identificadores (user_id, subscription_id ou customer_id) do evento.",
          })
          .eq("provider", "ASAAS")
          .eq("event_id", eventId);

        return {
          success: false,
          eventId,
          eventType,
          error: "Identificador de assinatura ou usuário não encontrado no payload.",
        };
      }

      const { data: currentSub, error: subError } = await subQuery.maybeSingle();

      if (subError || !currentSub) {
        await supabase
          .from("webhook_events")
          .update({
            error_message: `Assinatura não localizada no banco para os identificadores fornecidos. SubId: ${asaasSubId}, CustId: ${asaasCustId}, Ref: ${externalRef}`,
          })
          .eq("provider", "ASAAS")
          .eq("event_id", eventId);

        return {
          success: false,
          eventId,
          eventType,
          error: "Assinatura correspondente não encontrada no QEVIA.",
        };
      }

      // 4. Determine state transition based on official ASAAS event
      const updates: Partial<{
        status: SubscriptionStatus;
        current_period_start: string | null;
        current_period_end: string | null;
        cancelled_at: string | null;
        asaas_subscription_id: string | null;
      }> = {};

      let newStatus: SubscriptionStatus = currentSub.status as SubscriptionStatus;

      switch (eventType) {
        case "PAYMENT_CONFIRMED":
        case "PAYMENT_RECEIVED": {
          newStatus = "ACTIVE";
          updates.status = "ACTIVE";
          updates.cancelled_at = null;

          const paymentDate =
            payload.payment?.clientPaymentDate ||
            payload.payment?.confirmedDate ||
            new Date().toISOString();
          updates.current_period_start = paymentDate;

          if (payload.subscription?.nextDueDate) {
            updates.current_period_end = new Date(payload.subscription.nextDueDate).toISOString();
          } else if (payload.payment?.dueDate) {
            const dueDate = new Date(payload.payment.dueDate);
            const cycleDays = currentSub.plan === "PRO_YEARLY" ? 365 : 30;
            dueDate.setDate(dueDate.getDate() + cycleDays);
            updates.current_period_end = dueDate.toISOString();
          } else {
            const periodEnd = new Date();
            const cycleDays = currentSub.plan === "PRO_YEARLY" ? 365 : 30;
            periodEnd.setDate(periodEnd.getDate() + cycleDays);
            updates.current_period_end = periodEnd.toISOString();
          }
          break;
        }

        case "PAYMENT_OVERDUE": {
          // Out-of-Order Guard: If subscription is currently ACTIVE and has a period start
          // subsequent to or matching the overdue invoice's due date, do not downgrade to OVERDUE.
          const overdueDueDate = payload.payment?.dueDate ? new Date(payload.payment.dueDate).getTime() : null;
          const currentPeriodStartTime = currentSub.current_period_start
            ? new Date(currentSub.current_period_start).getTime()
            : null;

          if (
            currentSub.status === "ACTIVE" &&
            overdueDueDate &&
            currentPeriodStartTime &&
            currentPeriodStartTime >= overdueDueDate
          ) {
            // Obsolete out-of-order overdue event; keep ACTIVE state
            break;
          }

          newStatus = "OVERDUE";
          updates.status = "OVERDUE";
          break;
        }

        case "PAYMENT_REFUNDED":
        case "PAYMENT_CHARGEBACK_REQUESTED":
        case "PAYMENT_CHARGEBACK_DISPUTE": {
          newStatus = "CANCELLED";
          updates.status = "CANCELLED";
          updates.cancelled_at = new Date().toISOString();
          // Revoke active period immediately upon refund or chargeback dispute
          updates.current_period_end = new Date().toISOString();
          break;
        }

        case "SUBSCRIPTION_DELETED":
        case "SUBSCRIPTION_INACTIVATED": {
          newStatus = "CANCELLED";
          updates.status = "CANCELLED";
          updates.cancelled_at = new Date().toISOString();
          // Note: preserves current_period_end so customer retains paid access until period expiration
          break;
        }

        case "SUBSCRIPTION_CREATED":
        case "SUBSCRIPTION_UPDATED": {
          if (asaasSubId && !currentSub.asaas_subscription_id) {
            updates.asaas_subscription_id = asaasSubId;
          }
          if (payload.subscription?.status?.toUpperCase() === "ACTIVE") {
            newStatus = "ACTIVE";
            updates.status = "ACTIVE";
          } else if (currentSub.status === "TRIAL") {
            // keep trial
          } else if (currentSub.status !== "ACTIVE") {
            newStatus = "PENDING_PAYMENT";
            updates.status = "PENDING_PAYMENT";
          }
          break;
        }

        default:
          break;
      }

      // 5. Update subscription record if changes needed
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update(updates)
          .eq("id", currentSub.id);

        if (updateError) {
          throw new Error(`Falha ao atualizar assinatura: ${updateError.message}`);
        }
      }

      // 6. Mark webhook event as processed
      await supabase
        .from("webhook_events")
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("provider", "ASAAS")
        .eq("event_id", eventId);

      return {
        success: true,
        duplicate: false,
        eventId,
        eventType,
        userId: currentSub.user_id,
        subscriptionId: currentSub.id,
        newStatus,
        message: "Evento processado com sucesso.",
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido ao processar webhook.";
      await supabase
        .from("webhook_events")
        .update({
          error_message: errorMsg,
        })
        .eq("provider", "ASAAS")
        .eq("event_id", eventId);

      return {
        success: false,
        eventId,
        eventType,
        error: errorMsg,
      };
    }
  }

  /**
   * Retrieves sanitized invoice history for the authenticated user's active/past ASAAS subscription.
   */
  static async getInvoicesHistory(targetUserId?: string): Promise<{
    invoices: import("@/types/billing").BillingInvoice[];
    error: string | null;
  }> {
    try {
      const supabase = await createClient();

      // 1. Verify authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return { invoices: [], error: "Usuário não autenticado." };
      }

      const authenticatedUserId = userData.user.id;

      // 2. Strict multi-tenant verification
      if (targetUserId && targetUserId !== authenticatedUserId) {
        return { invoices: [], error: "Acesso não autorizado para outro usuário." };
      }

      // 3. Fetch user's subscription record
      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("asaas_subscription_id")
        .eq("user_id", authenticatedUserId)
        .maybeSingle();

      if (subError || !subData || !subData.asaas_subscription_id) {
        return { invoices: [], error: null };
      }

      // 4. Query ASAAS payments
      const { AsaasService } = await import("@/services/asaas.service");
      const paymentsRes = await AsaasService.getSubscriptionPayments(subData.asaas_subscription_id);

      if (paymentsRes.error || !paymentsRes.data?.data) {
        return { invoices: [], error: paymentsRes.error || "Falha ao consultar cobranças no ASAAS." };
      }

      // 5. Sanitize and sort invoices
      const invoices: import("@/types/billing").BillingInvoice[] = paymentsRes.data.data
        .filter((item) => !item.deleted)
        .map((item) => ({
          id: item.id,
          status: item.status,
          value: item.value,
          dueDate: item.dueDate,
          paymentDate: item.clientPaymentDate || item.paymentDate || item.confirmedDate || null,
          billingType: item.billingType || "UNDEFINED",
          invoiceUrl: item.invoiceUrl || null,
          bankSlipUrl: item.bankSlipUrl || null,
          transactionReceiptUrl: item.transactionReceiptUrl || null,
        }))
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

      return { invoices, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao carregar histórico de faturas.";
      return { invoices: [], error: message };
    }
  }

  /**
   * Safely cancels the authenticated user's recurring subscription.
   * Preserves current_period_end so the customer retains paid access until period expiration.
   */
  static async cancelSubscription(targetUserId?: string): Promise<import("@/types/billing").CancelSubscriptionResult> {
    try {
      const supabase = await createClient();

      // 1. Verify authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return { success: false, error: "Usuário não autenticado." };
      }

      const authenticatedUserId = userData.user.id;

      // 2. Strict multi-tenant verification
      if (targetUserId && targetUserId !== authenticatedUserId) {
        return { success: false, error: "Acesso não autorizado para outro usuário." };
      }

      // 3. Locate user's subscription
      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", authenticatedUserId)
        .maybeSingle();

      if (subError || !subData) {
        return { success: false, error: "Assinatura não encontrada." };
      }

      // 4. Idempotency Check: if already CANCELLED
      if (subData.status === "CANCELLED") {
        return {
          success: true,
          alreadyCancelled: true,
          status: "CANCELLED",
          cancelledAt: subData.cancelled_at,
          accessUntil: subData.current_period_end || subData.trial_end_at,
          message: "Assinatura já se encontra cancelada.",
        };
      }

      // 5. If no ASAAS subscription ID exists (e.g. TRIAL/FREE)
      if (!subData.asaas_subscription_id) {
        const cancelledAt = new Date().toISOString();
        await supabase
          .from("subscriptions")
          .update({
            status: "CANCELLED",
            cancelled_at: cancelledAt,
          })
          .eq("id", subData.id);

        return {
          success: true,
          alreadyCancelled: false,
          status: "CANCELLED",
          cancelledAt,
          accessUntil: subData.current_period_end || subData.trial_end_at,
          message: "Assinatura cancelada com sucesso.",
        };
      }

      // 6. Cancel subscription in ASAAS
      const { AsaasService } = await import("@/services/asaas.service");
      const cancelRes = await AsaasService.cancelSubscription(subData.asaas_subscription_id);

      if (cancelRes.error) {
        return { success: false, error: cancelRes.error };
      }

      // 7. Update subscription record in Supabase preserving current_period_end
      const cancelledAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "CANCELLED",
          cancelled_at: cancelledAt,
        })
        .eq("id", subData.id);

      if (updateError) {
        return { success: false, error: "Assinatura cancelada no gateway, mas ocorreu erro ao atualizar o registro local." };
      }

      return {
        success: true,
        alreadyCancelled: false,
        status: "CANCELLED",
        cancelledAt,
        accessUntil: subData.current_period_end || subData.trial_end_at,
        message: "Assinatura cancelada com sucesso. Seu acesso continuará ativo até o fim do período vigente.",
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao cancelar assinatura.";
      return { success: false, error: message };
    }
  }

  /**
   * Reactivates a CANCELLED subscription that is still within its active paid period.
   */
  static async reactivateSubscription(targetUserId?: string): Promise<import("@/types/billing").ReactivateSubscriptionResult> {
    try {
      const supabase = await createClient();

      // 1. Verify authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return { success: false, error: "Usuário não autenticado." };
      }

      const authenticatedUserId = userData.user.id;

      // 2. Strict multi-tenant verification
      if (targetUserId && targetUserId !== authenticatedUserId) {
        return { success: false, error: "Acesso não autorizado para outro usuário." };
      }

      // 3. Locate user's subscription
      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", authenticatedUserId)
        .maybeSingle();

      if (subError || !subData) {
        return { success: false, error: "Assinatura não encontrada." };
      }

      // 4. Idempotency Check: if already ACTIVE
      if (subData.status === "ACTIVE") {
        return {
          success: true,
          alreadyActive: true,
          status: "ACTIVE",
          currentPeriodEnd: subData.current_period_end,
          message: "A assinatura já se encontra ativa.",
        };
      }

      // 5. Must be in CANCELLED status to reactivate
      if (subData.status !== "CANCELLED") {
        return {
          success: false,
          error: "Apenas assinaturas canceladas e ainda dentro do período de vigência podem ser reativadas.",
        };
      }

      // 6. Check if current period has expired
      const periodEnd = subData.current_period_end ? new Date(subData.current_period_end) : null;
      if (!periodEnd || periodEnd.getTime() <= Date.now()) {
        return {
          success: false,
          expired: true,
          error: "O período de vigência da sua assinatura anterior já expirou. Por favor, realize uma nova contratação.",
        };
      }

      const nextDueDate = periodEnd.toISOString().split("T")[0];
      let asaasSubscriptionId = subData.asaas_subscription_id;

      // 7. Reactivate on ASAAS
      if (asaasSubscriptionId) {
        const { AsaasService } = await import("@/services/asaas.service");
        const updateRes = await AsaasService.updateSubscription(asaasSubscriptionId, {
          status: "ACTIVE",
          nextDueDate,
        });

        if (updateRes.error) {
          // If update on deleted ASAAS sub fails, recreate recurring sub on ASAAS with nextDueDate
          const { getPlanByCode } = await import("@/config/plans");
          const planDef = getPlanByCode(subData.plan as PlanCode);
          if (planDef && subData.asaas_customer_id) {
            const createRes = await AsaasService.createSubscription({
              customer: subData.asaas_customer_id,
              billingType: "UNDEFINED",
              value: planDef.price,
              nextDueDate,
              cycle: planDef.interval as "MONTHLY" | "YEARLY",
              description: `QEVIA - Gestão Financeira (${planDef.name})`,
              externalReference: authenticatedUserId,
            });

            if (!createRes.error && createRes.data?.id) {
              asaasSubscriptionId = createRes.data.id;
            } else {
              return {
                success: false,
                error: updateRes.error || "Falha ao reativar assinatura no gateway.",
              };
            }
          } else {
            return { success: false, error: updateRes.error };
          }
        }
      }

      // 8. Update Supabase record
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "ACTIVE",
          cancelled_at: null,
          asaas_subscription_id: asaasSubscriptionId,
        })
        .eq("id", subData.id);

      if (updateError) {
        return {
          success: false,
          error: "Assinatura reativada no gateway, mas ocorreu falha ao salvar registro local.",
        };
      }

      return {
        success: true,
        alreadyActive: false,
        status: "ACTIVE",
        currentPeriodEnd: subData.current_period_end,
        message: "Assinatura reativada com sucesso! As renovações automáticas foram restabelecidas.",
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao reativar assinatura.";
      return { success: false, error: message };
    }
  }

  /**
   * Changes the plan/cycle between PRO_MONTHLY and PRO_YEARLY without duplicate charging.
   * New price is charged starting from the next renewal date.
   */
  static async changePlan(
    dto: import("@/types/billing").ChangePlanDTO,
    targetUserId?: string
  ): Promise<import("@/types/billing").ChangePlanResult> {
    try {
      const supabase = await createClient();

      // 1. Verify authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return { success: false, error: "Usuário não autenticado." };
      }

      const authenticatedUserId = userData.user.id;

      // 2. Strict multi-tenant verification
      if (targetUserId && targetUserId !== authenticatedUserId) {
        return { success: false, error: "Acesso não autorizado para outro usuário." };
      }

      // 3. Validate plan selection on server side
      const { getPlanByCode } = await import("@/config/plans");
      if (!dto.planCode || (dto.planCode !== "PRO_MONTHLY" && dto.planCode !== "PRO_YEARLY")) {
        return { success: false, error: "Plano inválido para alteração. Escolha entre PRO Mensal ou PRO Anual." };
      }

      const targetPlan = getPlanByCode(dto.planCode);
      if (!targetPlan || targetPlan.code === "FREE") {
        return { success: false, error: "Não é permitido alterar para o plano gratuito através deste fluxo." };
      }

      // 4. Locate user's subscription
      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", authenticatedUserId)
        .maybeSingle();

      if (subError || !subData) {
        return { success: false, error: "Assinatura não encontrada." };
      }

      // 5. Idempotency Check: if already on the selected plan
      if (subData.plan === dto.planCode) {
        return {
          success: true,
          alreadyCurrent: true,
          previousPlan: subData.plan,
          newPlan: dto.planCode,
          effectiveDate: subData.current_period_end,
          message: `Você já está cadastrado no plano ${targetPlan.name}.`,
        };
      }

      // 6. Update on ASAAS if has asaas_subscription_id
      if (subData.asaas_subscription_id) {
        const { AsaasService } = await import("@/services/asaas.service");
        const updateRes = await AsaasService.updateSubscription(subData.asaas_subscription_id, {
          value: targetPlan.price,
          cycle: targetPlan.interval as "MONTHLY" | "YEARLY",
          description: `QEVIA - Gestão Financeira (${targetPlan.name})`,
          updatePendingPayments: false,
        });

        if (updateRes.error) {
          return { success: false, error: updateRes.error || "Falha ao alterar ciclo no gateway ASAAS." };
        }
      }

      // 7. Update Supabase record
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan: dto.planCode,
        })
        .eq("id", subData.id);

      if (updateError) {
        return {
          success: false,
          error: "Plano alterado no gateway, mas ocorreu erro ao atualizar registro local.",
        };
      }

      const formattedDate = subData.current_period_end
        ? new Date(subData.current_period_end).toLocaleDateString("pt-BR")
        : "a próxima renovação";

      return {
        success: true,
        alreadyCurrent: false,
        previousPlan: subData.plan,
        newPlan: dto.planCode,
        effectiveDate: subData.current_period_end,
        message: `Plano alterado para ${targetPlan.name} com sucesso! O novo valor de R$ ${targetPlan.price.toFixed(2).replace(".", ",")} será cobrado a partir de ${formattedDate}.`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao alterar plano.";
      return { success: false, error: message };
    }
  }
}
