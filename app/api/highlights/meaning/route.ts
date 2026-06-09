import { streamText } from 'ai'

export async function POST(req: Request) {
  const { text } = await req.json() as { text: string }
  if (!text?.trim()) {
    return Response.json({ error: 'text required' }, { status: 400 })
  }

  const result = streamText({
    model: 'openai/gpt-4o-mini' as Parameters<typeof streamText>[0]['model'],
    prompt: `Раскрой глубинный смысл следующего отрывка: что за ним скрывается, какие символы и образы используются, какие литературные приёмы, возможные отсылки к философии или культуре. Пиши живо и интересно, 3–4 предложения.\n\n«${text.slice(0, 600)}»`,
    maxOutputTokens: 350,
  })

  return result.toTextStreamResponse()
}
