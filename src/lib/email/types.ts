"use server";


type Payload = {
    to: string;
    from?: string;
    subject: string;
    html: any;
};

type Server = {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
};

