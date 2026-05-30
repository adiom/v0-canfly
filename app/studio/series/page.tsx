import { SeriesPageClient } from '@/components/studio/series-page-client'
import { getAllSeries } from '@/lib/actions/studio'

export default async function SeriesPage() {
  const series = await getAllSeries()
  return <SeriesPageClient series={series} />
}
