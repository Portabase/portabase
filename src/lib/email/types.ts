"use server";


export type Payload = {
    to: string;
    from?: string;
    subject: string;
    html: any;
};

export type Server = {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
};

