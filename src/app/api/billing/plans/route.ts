import { NextResponse } from "next/server";
import { getActivePlans } from "@/config/plans";

export async function GET() {
  try {
    const plans = getActivePlans();
    return NextResponse.json({
      success: true,
      plans,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erro ao listar planos comerciais." },
      { status: 500 }
    );
  }
}
