import { legalRoute } from "@/views/LegalRoute";

const r = legalRoute("en", "reviews");
export const generateMetadata = r.generateMetadata;
export default r.Page;
