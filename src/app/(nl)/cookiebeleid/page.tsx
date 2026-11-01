import { legalRoute } from "@/views/LegalRoute";

const r = legalRoute("nl", "cookies");
export const generateMetadata = r.generateMetadata;
export default r.Page;
