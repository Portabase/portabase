import {NextResponse} from "next/server";
import fs from "fs";
import path from "path";


//
// export async function POST(request: Request) {
//     try {
//         const body = await request.json();
//         console.log("tusd hook payload:", body);
//
//         return NextResponse.json({
//             "Upload-Defer-Length": true,
//             "Upload-Metadata": "name somefilename",
//         });
//     } catch (error) {
//         console.error("Error in POST handler:", error);
//         return NextResponse.json(
//             { error: "Internal server error" },
//             { status: 500 }
//         );
//     }
// }

// export async function POST(request: Request) {
//     try {
//         const body = await request.json();
//         console.log("TUSD hook payload:", body);
//
//         // Pre-create hook: must return Upload-Defer-Length or Upload-Length
//         if (body.event === "pre-create") {
//             return NextResponse.json({
//                 "Upload-Defer-Length": true,           // defer the upload length
//                 "Upload-Metadata": "name somefilename" // optional metadata
//             });
//         }
//
//         // Post-receive hook: handle finished uploads
//         if (body.event === "post-receive") {
//             console.log(`Upload finished: ${body.id}, size: ${body.upload_length}`);
//             // process the file, AES encryption, move, etc.
//         }
//
//         return NextResponse.json({ ok: true }); // safe fallback for other events
//     } catch (error) {
//         console.error("Hook error:", error);
//         return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//     }
// }

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("TUSD hook payload:", body);
        const event = body.Event
        const headers = event.HTTPRequest.Header

        // if (body.event === "pre-create") {
        //     return NextResponse.json({
        //         "Upload-Defer-Length": true
        //     });
        // }
        console.log("TUSD hook payload:", body.Type);
        console.log("TUSD hook payload:", headers);

        if (
            body.Type === "post-receive" &&
            event.Upload.SizeIsDeferred === false &&
            event.Upload.Offset === event.Upload.Size
        ) {
            const id = event.Upload.ID;
            // const extensionFile = headers["X-Extension"]?.[0] ?? ".bin";
            const extensionFile = ".enc";
            const filePath = path.join(process.cwd(), "/private/uploads/backups/");

            fs.renameSync(
                `${filePath}${id}`,
                `${filePath}${id}${extensionFile}`
            );

        }



        // if (body.Type === "post-receive"){
        //     // const id = event.Upload.ID
        //     // const extensionFile = headers["X-Extension"]?.[0] ?? ".bin";
        //     // const extensionFile = ".enc";
        //     // const filePath = path.join(process.cwd(), "/private/uploads/backups/");
        //     //
        //     // fs.renameSync(
        //     //     `${filePath}${id}`,
        //     //     `${filePath}${id}${extensionFile}`
        //     // );
        // }

        // Post-receive hook: handle finished uploads
        if (body.event === "post-receive") {



            console.log(`Upload finished: ${body.id}, size: ${body.upload_length}`);
            // process the file, AES encryption, move, etc.

            const id = body.id;
            const ext = body.upload.metaData?.extension ?? ".bin";
            console.log(body)
            console.log("Upload finished: ", id);
            console.log("Ext: ", ext);

            // fs.renameSync(
            //     `/data/uploads/backups/${id}`,
            //     `/data/uploads/backups/${id}${ext}`
            // );

        }


        return NextResponse.json({}); // no Upload-Defer-Length
    } catch (error) {
        console.error("Hook error:", error);
        return NextResponse.json({error: "Internal server error"}, {status: 500});
    }
}