export interface LyricLine {
  text: string
  time?: number
}

export interface ChapterLyrics {
  format: 'synced' | 'plain'
  lines: LyricLine[]
}

const LRC_TAG_RE = /^\[(\d{1,3}):(\d{2})(?:[.:](\d{2,3}))?\]/

function parseTimestamp(min: string, sec: string, ms?: string): number {
  const minutes = parseInt(min, 10)
  const seconds = parseInt(sec, 10)
  const millis = ms ? parseInt(ms.padEnd(3, '0'), 10) : 0
  return minutes * 60 + seconds + millis / 1000
}

export function parseLrc(raw: string): ChapterLyrics {
  const rawLines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const parsed: LyricLine[] = []

  let hasTimestamps = false

  for (const line of rawLines) {
    const timestamps: number[] = []
    let remainder = line

    while (remainder.startsWith('[')) {
      const match = remainder.match(LRC_TAG_RE)
      if (match) {
        timestamps.push(parseTimestamp(match[1], match[2], match[3]))
        remainder = remainder.slice(match[0].length)
        hasTimestamps = true
      } else {
        const end = remainder.indexOf(']')
        if (end !== -1) {
          remainder = remainder.slice(end + 1)
        } else {
          break
        }
      }
    }

    const text = remainder.trim()
    if (!text) continue

    if (timestamps.length > 0) {
      for (const ts of timestamps) {
        parsed.push({ text, time: ts })
      }
    } else {
      parsed.push({ text })
    }
  }

  if (hasTimestamps && parsed.some(l => l.time !== undefined)) {
    parsed.sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
    return { format: 'synced', lines: parsed }
  }

  return { format: 'plain', lines: parsed }
}

export function serializeLrc(lyrics: ChapterLyrics): string {
  if (lyrics.format === 'plain') {
    return lyrics.lines.map(l => l.text).join('\n')
  }

  return lyrics.lines.map(l => {
    if (l.time !== undefined) {
      const totalMs = Math.round(l.time * 1000)
      const min = Math.floor(totalMs / 60000)
      const sec = Math.floor((totalMs % 60000) / 1000)
      const ms = totalMs % 1000
      const msStr = ms < 100 ? `0${ms}` : `${ms}`
      return `[${min}:${sec.toString().padStart(2, '0')}.${msStr}] ${l.text}`
    }
    return l.text
  }).join('\n')
}

export function findActiveLine(lines: LyricLine[], currentTime: number): number {
  if (!lines.some(l => l.time !== undefined)) return -1

  let active = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time !== undefined && lines[i].time! <= currentTime) {
      active = i
    } else if (lines[i].time !== undefined && lines[i].time! > currentTime) {
      break
    }
  }
  return active
}
