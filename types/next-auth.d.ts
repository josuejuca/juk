import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      plan?: string;
      planStatus?: string;
      role?: string;
      apiKey?: string;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
    plan?: string;
    planStatus?: string;
    role?: string;
    apiKey?: string;
  }
}
