import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Autenticação",
    template: "%s | quadraimob",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
