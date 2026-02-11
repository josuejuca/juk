import type { Metadata } from "next";

import AuthPasswordClient from "./AuthPasswordClient";

export const metadata: Metadata = {
  title: "Definir nova senha",
};

export default function Page() {
  return <AuthPasswordClient />;
}
