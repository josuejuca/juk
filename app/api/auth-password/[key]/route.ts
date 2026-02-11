import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

type ResetPasswordBody = {
  password?: unknown;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  if (!key || typeof key !== "string") {
    return NextResponse.json(
      { ok: false, message: "Link inválido." },
      { status: 400 }
    );
  }

  let body: ResetPasswordBody;
  try {
    body = (await request.json()) as ResetPasswordBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, message: "A senha deve ter pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  const now = new Date();

  const user = await prisma.user.findFirst({
    where: {
      resetToken: key,
      resetTokenExpiresAt: { gt: now },
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Link inválido ou expirado." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null,
    },
    select: { id: true },
  });

  return NextResponse.json({
    ok: true,
    message: "Senha atualizada com sucesso.",
  });
}
