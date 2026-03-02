import {z} from "zod";

export const GotifyChannelConfigSchema = z.object({
    gotifyServerUrl: z.string().url("Must be a valid URL"),
    gotifyAppToken: z.string().min(1, "App token is required"),
});
