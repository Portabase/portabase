export type SmbConfig = {
    host: string;
    port?: number;
    share: string;
    username: string;
    password: string;
    remotePath?: string;
};
