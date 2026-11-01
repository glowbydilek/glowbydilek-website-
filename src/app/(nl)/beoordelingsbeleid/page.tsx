import { legalRoute } from "@/views/LegalRoute";

const r = legalRoute("nl", "reviews");
export const generateMetadata = r.generateMetadata;
export default r.Page;
