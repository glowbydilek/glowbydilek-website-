import { legalRoute } from "@/views/LegalRoute";

const r = legalRoute("tr", "terms");
export const generateMetadata = r.generateMetadata;
export default r.Page;
