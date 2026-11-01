import { legalRoute } from "@/views/LegalRoute";

const r = legalRoute("en", "terms");
export const generateMetadata = r.generateMetadata;
export default r.Page;
