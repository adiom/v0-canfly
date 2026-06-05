export type ReleaseStatus = 'draft' | 'published' | 'archived'
export type EditionStatus = 'draft' | 'published' | 'archived'
export type EditionFormat = 'book' | 'comic' | 'audiobook' | 'audiorelease' | 'album' | 'magazine'
export type MediaType = 'trailer' | 'podcast' | 'review' | 'other'
export type CollaboratorRole = 'owner' | 'editor' | 'viewer'
export type ChapterStatus = 'draft' | 'published'
export type ReleaseCharacterRole = 'main' | 'supporting' | 'cameo'
export type CommentStatus = 'pending' | 'approved' | 'spam'
export type HeroStyle = 'full' | 'centered' | 'minimal'
export type HeroOverlay = 'dark' | 'gradient' | 'none'
export type ReleaseLayout = 'wide' | 'narrow' | 'sidebar'

export interface ReleaseDesignConfig {
  accent_color?: string
  bg_color?: string
  text_color?: string
  hero_style?: HeroStyle
  hero_overlay?: HeroOverlay
  layout?: ReleaseLayout
  show_toc?: boolean
  show_characters?: boolean
  show_series?: boolean
}

export interface ReleaseAuthor {
  name: string
  role: string
}

export interface Release {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image: string | null
  genre: string | null
  release_date: string | null
  isbn: string | null
  authors: ReleaseAuthor[]
  annotation: string | null
  editor_notes: string | null
  view_count: number
  status: ReleaseStatus
  design_config: ReleaseDesignConfig
  created_at: string
  updated_at: string
}

export interface Series {
  id: string
  title: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Edition {
  id: string
  release_id: string
  format: EditionFormat
  platform: string | null
  external_url: string | null
  slug: string
  status: EditionStatus
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: string
  edition_id: string
  title: string
  content: string | null
  chapter_index: number
  status: ChapterStatus
  word_count: number
  view_count: number
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface ReleaseSeries {
  release_id: string
  series_id: string
  phase_number: number | null
}

export interface ReleaseCharacter {
  release_id: string
  character_id: string
  role: ReleaseCharacterRole
}

export interface Comment {
  id: string
  release_id: string
  user_id: string
  content: string
  status: CommentStatus
  created_at: string
}

export interface ReleaseMedia {
  id: string
  release_id: string
  type: MediaType
  title: string
  url: string
  description: string | null
  created_at: string
}

export interface ReadingProgress {
  id: string
  edition_id: string
  chapter_id: string
  user_id: string | null
  session_id: string | null
  progress_percent: number
  last_read_at: string
}

export interface ReleaseCollaborator {
  release_id: string
  user_id: string
  role: CollaboratorRole
}

export interface Bookmark {
  id: string
  chapter_id: string
  user_id: string
  note: string | null
  created_at: string
}

export interface ChapterVersion {
  id: string
  chapter_id: string
  content: string
  version_number: number
  created_at: string
}
