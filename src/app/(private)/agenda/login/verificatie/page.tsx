import type { Metadata } from "next";
import { MfaPage } from "@/components/private/auth/pages";

export const metadata: Metadata = { title: "Tweestapsverificatie" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <MfaPage area="agenda" searchParams={searchParams} />;
}
