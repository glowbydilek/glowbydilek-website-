import { legalRoute } from "@/views/LegalRoute";

const r = legalRoute("tr", "reviews");
export const generateMetadata = r.generateMetadata;
export default r.Page;
