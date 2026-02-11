import type { Metadata } from "next";

import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

export default function Page() {
  return <ForgotPasswordClient />;
}
