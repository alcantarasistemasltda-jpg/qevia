import { NextResponse } from "next/server";
import { AsaasService } from "@/services/asaas.service";

export async function POST() {
  try {
    const result = await AsaasService.getOrCreateCustomer();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Não foi possível sincronizar o cliente ASAAS." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      customerId: result.customerId,
      alreadyExisted: result.alreadyExisted,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erro interno no servidor ao processar cliente ASAAS." },
      { status: 500 }
    );
  }
}
