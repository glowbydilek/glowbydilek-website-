import { legalRoute } from "@/views/LegalRoute";

const r = legalRoute("en", "cookies");
export const generateMetadata = r.generateMetadata;
export default r.Page;
