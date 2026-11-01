import type { NextRequest } from "next/server";
import { handleForm } from "@/lib/forms/handler";
import { validateContact } from "@/lib/forms/validation";
import { contactCustomerMail, contactOwnerMail } from "@/lib/mail/templates";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { inquiries } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(req: NextRequest) {
  return handleForm(req, {
    kind: "contact",
    validate: validateContact,
    // Copy in the Ajanda inbox (Berichten), in addition to the owner email.
    store: async (d) => {
      if (!databaseConfigured()) return;
      await getDb().insert(inquiries).values({ name: d.name, email: d.email, phone: d.phone ?? null, topic: d.topic, message: d.message, locale: d.locale, consentAt: new Date() });
    },
    signature: (d) => `${d.topic}|${d.message.toLowerCase().replace(/\s+/g, " ")}`,
    ownerMail: contactOwnerMail,
    customerMail: contactCustomerMail,
  });
}
