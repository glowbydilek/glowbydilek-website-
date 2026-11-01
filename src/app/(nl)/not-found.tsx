import { ensureContent } from "@/lib/cms/store";
import { NotFoundPage } from "@/views/NotFoundPage";

export default async function NotFound() {
  await ensureContent();
  return <NotFoundPage locale="nl" />;
}
