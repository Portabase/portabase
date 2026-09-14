export type SftpConfig = {
    host: string;
    port?: number;
    username: string;
    password?: string;
    privateKey?: string;
    remotePath?: string;
};
