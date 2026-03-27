import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const characterSlug = searchParams.get('character')
    
    const supabase = await createClient()
    
    let query = supabase
      .from('character_posts')
      .select(`
        id,
        content,
        post_type,
        image_url,
        created_at,
        character:characters(id, name, slug, avatar)
      `)
      .order('created_at', { ascending: false })
    
    if (characterSlug) {
      query = query.eq('characters.slug', characterSlug)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return Response.json(data || [])
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
