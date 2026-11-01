import { legalRoute } from "@/views/LegalRoute";

const r = legalRoute("en", "cancellation");
export const generateMetadata = r.generateMetadata;
export default r.Page;
