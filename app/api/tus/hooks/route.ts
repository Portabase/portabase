import {NextResponse} from "next/server";
import fs from "fs";
import path from "path";


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const event = body.Event
        const headers = event.HTTPRequest.Header
        const uploadLength = headers["X-File-Size"]?.[0];
        const uploadOffset = headers["Upload-Offset"]?.[0];
        const status = headers["X-Status"]?.[0];

        console.log(`Upload ID : ${event.Upload.ID} (${uploadOffset}/${uploadLength})`);

        if (status === "success") {
            if (
                body.Type === "post-receive" &&
                event.Upload.SizeIsDeferred === false &&
                event.Upload.Offset === event.Upload.Size
            ) {
                const id = event.Upload.ID;
                const fileName = headers["X-File-Name"]?.[0];
                const filePath = headers["X-File-Path"]?.[0];

                if (!filePath) {
                    return NextResponse.json({error: "Missing X-File-Path"}, {status: 500});
                }


                const uploadDir = path.join(process.cwd(), "/private/uploads/");

                const oldFilePath = path.join(uploadDir, "tmp", id);
                const newFilePath = path.join(uploadDir, filePath);

                fs.mkdirSync(path.dirname(newFilePath), {recursive: true});

                let retries = 10;
                while (!fs.existsSync(oldFilePath)) {
                    if (retries-- === 0) {
                        return NextResponse.json({error: `Upload file not found: ${oldFilePath}`}, {status: 500});
                    }
                    await new Promise(r => setTimeout(r, 200));
                }

                fs.renameSync(oldFilePath, newFilePath);

                const infoFilePath = `${oldFilePath}.info`;
                if (fs.existsSync(infoFilePath)) {
                    fs.unlinkSync(infoFilePath);
                }

                const metadataHeaderB64 = headers["Upload-Metadata"]?.[0];

                if (metadataHeaderB64) {
                    const metadataHeader = Buffer.from(metadataHeaderB64, "base64").toString("utf-8");
                    if (metadataHeader) {
                        const tomlContent = metadataHeader
                            .split(",")
                            .map((pair) => {
                                const [key, value] = pair.split(" ");
                                const escapedValue = value.replace(/"/g, '\\"');
                                return `${key} = "${escapedValue}"`;
                            })
                            .join("\n");
                        const metaFilePath = `${newFilePath}.meta`;
                        fs.writeFileSync(metaFilePath, tomlContent, "utf-8");
                    }
                }
            }
        }
        return NextResponse.json({});
    } catch (error) {
        console.error("Hook error:", error);
        return NextResponse.json({error: "Internal server error"}, {status: 500});
    }
}