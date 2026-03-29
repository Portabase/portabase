import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {NextResponse} from "next/server";
import {eventEmitter} from "@/features/shared/event";
import {logger} from "@/lib/logger";

const log = logger.child({module: "api/events"});

export async function GET(request: Request) {

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({error: "Unauthorized"}, {status: 403});
    }

    return new Response(
        new ReadableStream({
            start(controller) {
                log.info("Stream started");
                const handleModification = (data: any) => {
                    log.info({data: data},"Modification event triggered");
                    controller.enqueue(`event: modification\n`);
                    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
                };

                eventEmitter.on('modification', handleModification);

                request.signal.addEventListener('abort', () => {
                    log.info("Client disconnected");
                    controller.close();
                    eventEmitter.off('modification', handleModification);
                });
            },
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        }
    );
}