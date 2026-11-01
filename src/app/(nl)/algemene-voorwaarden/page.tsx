import { legalRoute } from "@/views/LegalRoute";

const r = legalRoute("nl", "terms");
export const generateMetadata = r.generateMetadata;
export default r.Page;
