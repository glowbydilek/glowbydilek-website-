import type { Metadata } from "next";
import { LoginPage } from "@/components/private/auth/pages";

export const metadata: Metadata = { title: "Inloggen" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <LoginPage area="ajanda" searchParams={searchParams} />;
}
