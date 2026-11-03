import { legalRoute } from "@/views/LegalRoute";

const r = legalRoute("tr", "cancellation");
export const generateMetadata = r.generateMetadata;
export default r.Page;
