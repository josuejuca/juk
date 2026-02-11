import type { Metadata } from "next";

import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function Page() {
  return <RegisterClient />;
}
