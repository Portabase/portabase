import {channelPolicyRoutes} from "@/lib/api-v1/routes/channel-policies";

const routes = channelPolicyRoutes("notification", "database");

export const GET = routes.get;
export const PUT = routes.put;
