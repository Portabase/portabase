import {channelPolicyRoutes} from "@/lib/api-v1/routes/channel-policies";

const routes = channelPolicyRoutes("storage", "project");

export const GET = routes.get;
export const PUT = routes.put;
