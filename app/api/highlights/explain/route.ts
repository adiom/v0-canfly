import { streamText } from 'ai'

export async function POST(req: Request) {
  const { text } = await req.json() as { text: string }
  if (!text?.trim()) {
    return Response.json({ error: 'text required' }, { status: 400 })
  }

  const result = streamText({
    model: 'openai/gpt-4o-mini' as Parameters<typeof streamText>[0]['model'],
    prompt: `Объясни следующий отрывок из книги простым и понятным языком — без потери смысла, красиво и кратко (2–3 предложения). Не говори "этот отрывок о...", просто объясни напрямую.\n\n«${text.slice(0, 600)}»`,
    maxOutputTokens: 300,
  })

  return result.toTextStreamResponse()
}
