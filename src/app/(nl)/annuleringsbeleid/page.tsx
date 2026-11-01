import { legalRoute } from "@/views/LegalRoute";

const r = legalRoute("nl", "cancellation");
export const generateMetadata = r.generateMetadata;
export default r.Page;
