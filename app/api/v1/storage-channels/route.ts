import {globalChannelRoutes} from "@/lib/api-v1/routes/channels";

const routes = globalChannelRoutes("storage");

export const GET = routes.list;
export const POST = routes.create;
