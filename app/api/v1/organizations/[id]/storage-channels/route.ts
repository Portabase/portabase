import {organizationChannelRoutes} from "@/lib/api-v1/routes/channels";

const routes = organizationChannelRoutes("storage");

export const GET = routes.list;
export const POST = routes.create;
