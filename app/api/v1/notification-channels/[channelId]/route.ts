import {globalChannelRoutes} from "@/lib/api-v1/routes/channels";

const routes = globalChannelRoutes("notification");

export const GET = routes.get;
export const PATCH = routes.patch;
export const DELETE = routes.remove;
