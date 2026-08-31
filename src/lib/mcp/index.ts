import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfileTool from "./tools/get-profile";
import listCoursesTool from "./tools/list-courses";
import listNotificationsTool from "./tools/list-notifications";
import listSessionsTool from "./tools/list-sessions";
import listMyEnrollmentsTool from "./tools/list-my-enrollments";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "entrevault-mcp",
  title: "EntreVault",
  version: "0.2.0",
  instructions:
    "Tools for EntreVault, a live learning platform teaching practical technology skills. Callers act as the signed-in user: read their profile, browse published courses, see their enrollments, upcoming live classes and notifications.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getProfileTool,
    listCoursesTool,
    listMyEnrollmentsTool,
    listSessionsTool,
    listNotificationsTool,
  ],
});
