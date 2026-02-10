import { NextRequest, NextResponse } from "next/server";
import { getJukLinkById, JukApiError } from "@/lib/juk";

function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof JukApiError) return error.status;

  if (typeof error !== "object" || error === null) return undefined;
  if (!("status" in error)) return undefined;

  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ link_id: string }> }
) {
  const { link_id } = await params;

  try {
    const data = await getJukLinkById(link_id);
    return NextResponse.json(data);
  } catch (error) {
    const status = getErrorStatus(error);
    if (status === 404) {
      return NextResponse.json({ detail: "Link não encontrado." }, { status: 404 });
    }

    return NextResponse.json(
      { detail: "Erro ao consultar a API." },
      { status: typeof status === "number" ? status : 500 }
    );
  }
}
