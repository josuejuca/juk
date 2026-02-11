import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const emailRaw = url.searchParams.get("email");
  const usernameRaw = url.searchParams.get("username");

  const email = emailRaw?.trim().toLowerCase() ?? "";
  const username = usernameRaw?.trim() ?? "";

  if (!email && !username) {
    return NextResponse.json(
      { ok: false, message: "Informe email ou username." },
      { status: 400 }
    );
  }

  const [emailUser, usernameUser] = await Promise.all([
    email && email.includes("@")
      ? prisma.user.findUnique({ where: { email }, select: { id: true } })
      : Promise.resolve(null),
    username.length >= 3
      ? prisma.user.findUnique({ where: { username }, select: { id: true } })
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    ok: true,
    emailAvailable: email ? !emailUser : undefined,
    usernameAvailable: username ? !usernameUser : undefined,
  });
}
