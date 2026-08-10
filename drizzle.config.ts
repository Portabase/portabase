import { defineConfig } from "drizzle-kit";

import dotenv from "dotenv";

dotenv.config({
    quiet: true,
    path: ".env",
});

export default defineConfig({
    out: "./src/db/migrations",
    schema: ["./src/db/schema", "./src/db/schema/types.ts"],
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
