import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'retired',
    message: 'Этот endpoint отправился на пенсию и теперь пьёт чай в беседке. Книги переехали в /release/ вселенной canfly.',
    suggestion: '/api/releases',
  })
}

export async function POST() {
  return NextResponse.json({
    status: 'retired',
    message: 'Этот endpoint ушёл в прошлое вместе с бумажными каталогами.',
    suggestion: '/api/releases',
  })
}