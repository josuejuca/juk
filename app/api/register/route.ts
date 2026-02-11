import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { Prisma } from "@prisma/client";

type RegisterBody = {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
};

function dicebearUrl(seed: string): string {
  const safeSeed = seed.trim() || "user";
  const encoded = encodeURIComponent(safeSeed);
  return `https://ui-avatars.com/api/?name=${encoded}&background=random&color=fff&size=500`;
}

function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = body.name?.trim() || undefined;
  const email = body.email?.trim().toLowerCase() || "";
  const username = body.username?.trim() || undefined;
  const password = body.password || "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  if (username && username.length < 3) {
    return NextResponse.json(
      { error: "O usuário deve ter pelo menos 3 caracteres." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  const imageSeed = name ?? username ?? email.split("@")[0] ?? "user";
  const image = dicebearUrl(imageSeed);

  // Requisito: contas criadas fora redes sociais usam UUID como id.
  const id = crypto.randomUUID();

  for (let attempt = 0; attempt < 3; attempt++) {
    const apiKey = generateApiKey();

    try {
      const user = await prisma.user.create({
        data: {
          id,
          name,
          email,
          username,
          passwordHash,
          apiKey,
          image,
        },
        select: { id: true },
      });

      return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
    } catch (error: unknown) {
      // Prisma unique constraint violation
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          const targets = (error.meta?.target ?? []) as string[];

          if (targets.includes("api_key") || targets.includes("apiKey")) {
            // colisão improvável, tenta novamente
            continue;
          }

          if (targets.includes("email")) {
            return NextResponse.json(
              { error: "E-mail já cadastrado." },
              { status: 409 }
            );
          }

          if (targets.includes("usuario") || targets.includes("username")) {
            return NextResponse.json(
              { error: "Usuário já cadastrado." },
              { status: 409 }
            );
          }

          return NextResponse.json(
            { error: "Dados já cadastrados." },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        { error: "Não foi possível criar a conta." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: "Não foi possível gerar uma API key." },
    { status: 500 }
  );
}
