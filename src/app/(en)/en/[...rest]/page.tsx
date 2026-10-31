import { notFound } from "next/navigation";

/** Catch-all so unknown URLs render the branded, localised 404 page. */
export default function CatchAll() {
  notFound();
}
