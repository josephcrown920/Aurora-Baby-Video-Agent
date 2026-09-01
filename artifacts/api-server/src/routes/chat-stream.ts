import { streamText } from "ai";

/**
 * Aurora streaming contract for the API artifact.
 *
 * The route intentionally uses the Web Streams API so the frontend receives
 * model output incrementally instead of waiting for the complete response.
 * Wire `createStreamingChatHandler` into the host's POST /api/chat route.
 */
export function createStreamingChatHandler({
  model,
  system,
}: {
  model: Parameters<typeof streamText>[0]["model"];
  system: string;
}) {
  return async function handleChat(request: Request) {
    const body = (await request.json()) as {
      messages?: Parameters<typeof streamText>[0]["messages"];
    };

    if (!Array.isArray(body.messages)) {
      return new Response("Messages are required", { status: 400 });
    }

    const result = streamText({
      model,
      system,
      messages: body.messages,
    });

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  };
}
