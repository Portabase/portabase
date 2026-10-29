import {organizationChannelRoutes} from "@/lib/api-v1/routes/channels";

const routes = organizationChannelRoutes("storage");

export const GET = routes.get;
export const PATCH = routes.patch;
export const DELETE = routes.remove;
