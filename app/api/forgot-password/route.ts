import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";

type ForgotPasswordBody = {
  email?: unknown;
};

export async function POST(request: Request) {
  let body: ForgotPasswordBody;

  try {
    body = (await request.json()) as ForgotPasswordBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, message: "Informe um e-mail válido." },
      { status: 400 }
    );
  }
  
  const HOST = process.env.AUTH_URL ?? "https://react-imogo.juk.re";

  // Avoid account enumeration: always respond with OK.
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiresAt },
        select: { id: true },
      });

      const reset_link = `${HOST}/nova-senha/${resetToken}`;

      const payload = {
        email,
        reset_link,
        logo_url: "https://juca.eu.org/img/logos/jukre_color.png",
        site_name: "jukre",
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        await fetch("https://smtp.josuejuca.com/auth/auth_password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch {
        // Ignore SMTP failures; keep response consistent.
      } finally {
        clearTimeout(timeout);
      }
    }
  } catch {
    // Intentionally ignore DB errors to keep response consistent.
  }

  return NextResponse.json({
    ok: true,
    message:
      "Se existir uma conta com esse e-mail, você receberá instruções para redefinir sua senha.",
  });
}
