import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfileTool from "./tools/get-profile";
import listTasksTool from "./tools/list-tasks";
import listMySubmissionsTool from "./tools/list-my-submissions";
import listTransactionsTool from "./tools/list-transactions";
import listCoursesTool from "./tools/list-courses";
import listNotificationsTool from "./tools/list-notifications";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "entrevault-mcp",
  title: "EntreVault",
  version: "0.1.0",
  instructions:
    "Tools for EntreVault, a content creation & marketing learning platform where users earn USDT by completing tasks. Callers act as the signed-in user: read their profile and wallet balance, browse open tasks and remaining slots, review their own task submissions and transactions, list courses, and read notifications.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getProfileTool,
    listTasksTool,
    listMySubmissionsTool,
    listTransactionsTool,
    listCoursesTool,
    listNotificationsTool,
  ],
});
