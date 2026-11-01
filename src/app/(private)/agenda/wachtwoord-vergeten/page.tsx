import type { Metadata } from "next";
import { ForgotPage } from "@/components/private/auth/pages";

export const metadata: Metadata = { title: "Wachtwoord vergeten" };

export default function Page() {
  return <ForgotPage area="agenda" />;
}
