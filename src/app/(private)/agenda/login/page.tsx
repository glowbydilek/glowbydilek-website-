import type { Metadata } from "next";
import { LoginPage } from "@/components/private/auth/pages";

// The login page carries the agenda's app manifest too, so phone, tablet and
// laptop can install the Agenda straight from here (scope /agenda).
export const metadata: Metadata = {
  title: "Inloggen",
  manifest: "/agenda/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Agenda", statusBarStyle: "default" },
  icons: { icon: "/brand/agenda-icon.svg", apple: "/brand/agenda-apple-icon.png" },
};

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <LoginPage area="agenda" searchParams={searchParams} />;
}
