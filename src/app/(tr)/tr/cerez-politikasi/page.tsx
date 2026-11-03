import { legalRoute } from "@/views/LegalRoute";

const r = legalRoute("tr", "cookies");
export const generateMetadata = r.generateMetadata;
export default r.Page;
