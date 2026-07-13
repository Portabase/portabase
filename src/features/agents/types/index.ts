import {EDbmsSchema} from "@/db/schema/types";

export type databaseAgent = {
    name: string;
    dbms: EDbmsSchema;
    generatedId: string;
    pingStatus: boolean;
};

export type Body = {
    version: string;
    databases: databaseAgent[];
};
