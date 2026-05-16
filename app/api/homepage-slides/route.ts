import { getPublicHomepageSlides } from '@/lib/homepage-slide-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const slides = await getPublicHomepageSlides()

  return Response.json(slides)
}
