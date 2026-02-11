import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import GitHub from "next-auth/providers/github";
import crypto from "node:crypto";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

function dicebearUrl(seed: string): string {
  const safeSeed = seed.trim() || "user";
  const encoded = encodeURIComponent(safeSeed);
  return `https://api.dicebear.com/7.x/lorelei/png?seed=${encoded}`;
}

function generateApiKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  cookies: {
    // When switching session strategy, old cookies can become undecodable.
    // Using a new cookie name avoids JWTSessionError without requiring manual cookie clearing.
    sessionToken: {
      name: "juk.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  events: {
    async createUser({ user }) {
      const seed = user.name ?? user.email ?? "user";
      const image = user.image ?? dicebearUrl(seed);

      const current = await prisma.user.findUnique({
        where: { id: user.id },
        select: { apiKey: true, image: true },
      });

      if (current?.apiKey && current.image) return;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              apiKey: current?.apiKey ?? generateApiKey(),
              image: current?.image ?? image,
            },
          });
          return;
        } catch (error: unknown) {
          const maybe = error as { code?: string };
          if (maybe?.code === "P2002") continue;
          return;
        }
      }
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID ?? "",
      clientSecret: process.env.AUTH_FACEBOOK_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credenciais",
      credentials: {
        identifier: { label: "E-mail ou usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const identifier = (credentials?.identifier as string | undefined)
          ?.trim();
        const password = credentials?.password as string | undefined;
        if (!identifier || !password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }],
          },
        });
        if (!user?.passwordHash) return null;

        const isValidPassword = await compare(password, user.passwordHash);
        if (!isValidPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username ?? undefined,
          plan: user.plan ?? undefined,
          planStatus: user.planStatus ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, "user" is available.
      if (user?.id) {
        token.sub = user.id;

        // Fetch extra fields once, so they are available in any server/page.
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            username: true,
            plan: true,
            planStatus: true,
            role: true,
            apiKey: true,
          },
        });

        token.username = dbUser?.username ?? undefined;
        token.plan = dbUser?.plan ?? undefined;
        token.planStatus = dbUser?.planStatus ?? undefined;
        token.role = dbUser?.role ?? "user";
        token.apiKey = dbUser?.apiKey ?? undefined;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) ?? session.user.id;
        session.user.username = (token.username as string | undefined) ?? undefined;
        session.user.plan = (token.plan as string | undefined) ?? undefined;
        session.user.planStatus = (token.planStatus as string | undefined) ?? undefined;
        session.user.role = (token.role as string | undefined) ?? "user";
        session.user.apiKey = (token.apiKey as string | undefined) ?? undefined;
      }
      return session;
    },
  },
});
