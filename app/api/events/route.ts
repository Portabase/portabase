import {EventEmitter} from 'events';
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {NextResponse} from "next/server";

export const eventEmitter = new EventEmitter();

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
                console.log('Stream started');
                const handleModification = (data: any) => {
                    console.log('Modification event triggered:', data);
                    controller.enqueue(`event: modification\n`);
                    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
                };

                eventEmitter.on('modification', handleModification);

                // Handle client disconnect
                request.signal.addEventListener('abort', () => {
                    console.log('Client disconnected');
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