import {Poppins} from "next/font/google";
import localFont from "next/font/local";

export const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-poppins",
});

export const author = localFont({
    src: [
        {
            path: "./author/Author-Variable.ttf",
            style: "normal",
        },
        {
            path: "./author/Author-VariableItalic.ttf",
            style: "italic",
        },
    ],
    variable: "--font-author",
});

export const geistMono = localFont({
    src: "./geist/GeistMonoVF.woff",
    variable: "--font-geist-mono",
});
