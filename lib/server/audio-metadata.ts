import { put } from '@vercel/blob'
import { parseWebStream, selectCover } from 'music-metadata'

export interface ParsedAudioMetadata {
  title?: string
  artist?: string
  album?: string
  year?: number
  trackNo?: number
  genre?: string
  codec?: string
  container?: string
  bitrate?: number
  sampleRate?: number
  lossless?: boolean
}

export interface ParsedAudioResult {
  durationSeconds: number | null
  metadata: ParsedAudioMetadata
  coverUrl: string | null
}

export async function parseAudioBlobMetadata(args: {
  url: string
  pathname: string
  contentType: string | null
  size: number | null
  chapterId: string
}) {
  const response = await fetch(args.url)
  if (!response.ok || !response.body) {
    throw new Error('Не удалось прочитать загруженный аудиофайл')
  }

  const metadata = await parseWebStream(
    response.body,
    {
      mimeType: args.contentType ?? response.headers.get('content-type') ?? undefined,
      size: args.size ?? undefined,
      path: args.pathname,
    },
    { duration: true, skipCovers: false },
  )

  const common = metadata.common
  const format = metadata.format
  const cover = selectCover(common.picture)
  let coverUrl: string | null = null

  if (cover?.data?.byteLength && cover.format) {
    const extension = cover.format.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    const blob = await put(
      `audio/covers/${args.chapterId}/cover.${extension}`,
      new Blob([cover.data], { type: cover.format }),
      { access: 'public', addRandomSuffix: true, token: process.env.BLOB_READ_WRITE_TOKEN },
    )
    coverUrl = blob.url
  }

  return {
    durationSeconds: format.duration ? Math.round(format.duration) : null,
    metadata: {
      title: common.title,
      artist: common.artist,
      album: common.album,
      year: common.year,
      trackNo: common.track.no ?? undefined,
      genre: common.genre?.[0],
      codec: format.codec,
      container: format.container,
      bitrate: format.bitrate,
      sampleRate: format.sampleRate,
      lossless: format.lossless,
    },
    coverUrl,
  } satisfies ParsedAudioResult
}
