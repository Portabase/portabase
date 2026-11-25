export type FtpConfig = {
    host: string;
    port?: number;
    username: string;
    password: string;
    remotePath?: string;
    ftpsMode?: "none" | "explicit" | "implicit";
};
