import type { Metadata } from "next";
import { ResetPage } from "@/components/private/auth/pages";

export const metadata: Metadata = { title: "Nieuw wachtwoord" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ResetPage area="agenda" searchParams={searchParams} />;
}
