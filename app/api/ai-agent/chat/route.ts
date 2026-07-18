import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type ChatRequest = { messages?: ChatMessage[]; context?: string };

const PERSONA =
  'You are OmniMind, a concise, helpful personal assistant. Answer using the ' +
  "user's connected-app data provided below when it is relevant. Always format your reply in " +
  'GitHub-flavored Markdown (use headings, bullet or numbered lists, tables, code blocks, bold, and ' +
  'links where helpful). Be brief and skimmable. If the answer is not in the provided data, say so ' +
  'and suggest connecting the relevant app on the Integrations page.';

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      'AI agent unavailable. Set GEMINI_API_KEY to enable it.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const { messages, context } = (await request
    .json()
    .catch(() => ({}))) as ChatRequest;
  if (!messages?.length)
    return new Response('No messages provided.', { status: 400 });

  const contents = messages.map((message) => ({
    role: message.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: message.content }],
  }));
  const systemInstruction = context
    ? `${PERSONA}\n\n--- CONNECTED APP DATA ---\n${context}`
    : PERSONA;

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const result = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.4,
            maxOutputTokens: 1400,
          },
        });
        for await (const chunk of result) {
          if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
        }
      } catch (error) {
        console.error('[ai-agent/chat] gemini error', error);
        controller.enqueue(
          encoder.encode(
            '\n\n_Sorry — the assistant hit an error. Please try again._'
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
