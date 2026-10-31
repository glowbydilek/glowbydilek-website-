import type { NextRequest } from "next/server";
import { handleForm } from "@/lib/forms/handler";
import { validateContact } from "@/lib/forms/validation";
import { contactCustomerMail, contactOwnerMail } from "@/lib/mail/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(req: NextRequest) {
  return handleForm(req, {
    kind: "contact",
    validate: validateContact,
    ownerMail: contactOwnerMail,
    customerMail: contactCustomerMail,
  });
}
