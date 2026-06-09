import { streamText } from 'ai'

const MODES: Record<string, string> = {
  'другой-финал': 'Перепиши сцену так, чтобы она закончилась иначе — неожиданно и интересно',
  'другая-эпоха': 'Перепиши этот отрывок, перенеся действие в другую историческую эпоху — сохрани суть, но измени антураж',
  'другой-стиль': 'Перепиши этот отрывок в совершенно другом литературном стиле — например, как детектив, магический реализм или абсурдизм',
}

export async function POST(req: Request) {
  const { text, mode } = await req.json() as { text: string; mode: string }
  if (!text?.trim() || !mode) {
    return Response.json({ error: 'text and mode required' }, { status: 400 })
  }

  const instruction = MODES[mode] ?? MODES['другой-стиль']

  const result = streamText({
    model: 'openai/gpt-4o-mini' as Parameters<typeof streamText>[0]['model'],
    prompt: `${instruction}. Пиши увлекательно, не объясняй своих действий — просто напиши переработанный текст (3–6 предложений).\n\nИсходный отрывок:\n«${text.slice(0, 600)}»`,
    maxOutputTokens: 400,
  })

  return result.toTextStreamResponse()
}
