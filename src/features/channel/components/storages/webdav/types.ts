import type {RcloneHeader} from "@/features/channel/components/storages/rclone/config";

export type WebDavConfig = {
    url: string;
    username?: string;
    password?: string;
    bearerToken?: string;
    remotePath?: string;
    headers?: RcloneHeader[];
};
