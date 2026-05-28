export type BookType = 'comic' | 'book' | 'audiobook';

export interface BookChapter {
  title: string;
  content: string;
}
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
export type HomepageSlideTheme = 'atelier' | 'night-city' | 'pvz' | 'volga' | 'dreams';

export interface Book {
  id: string;
  title: string;
  slug: string;
  type: BookType;
  description: string | null;
  cover_image: string | null;
  preview_pages: string[] | null;
  chapters?: BookChapter[] | null;
  external_links: Record<string, string> | null;
  price: number | null;
  is_featured: boolean;
  display_order: number;
  label: string | null;
  tone: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsPost {
  id: string;
  section: string;
  title: string;
  content: string | null;
  tag: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface BookCharacterLink {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  bio: string | null;
}

export interface BookWithCharacters extends Book {
  characters?: BookCharacterLink[];
  character_ids?: string[];
}

export interface Character {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  bio: string | null;
  full_description: string | null;
  abilities: string[] | null;
  speaking_style: string | null;
  personality: string | null;
  boundaries: string | null;
  knowledge_scope: string | null;
  spoiler_policy: string | null;
  reply_mode: CharacterReplyMode;
  can_receive_messages: boolean;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'reader' | 'author' | 'editor' | 'admin';
export type CharacterReplyMode = 'ai_auto' | 'manual' | 'hybrid' | 'disabled';
export type CharacterFriendshipStatus = 'pending' | 'accepted' | 'blocked';
export type CharacterMessageRole = 'user' | 'character' | 'system';
export type BookCharacterRole = 'main' | 'supporting' | 'cameo' | 'mentioned';

export interface UserProfile {
  id: string;
  email: string | null;
  login: string | null;
  handle: string;
  display_name: string;
  avatar: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserProfile extends UserProfile {
  roles: UserRole[];
  friends_count: number;
  conversations_count: number;
}

export interface CharacterFriendship {
  id: string;
  user_id: string;
  character_id: string;
  status: CharacterFriendshipStatus;
  intimacy_level: number;
  created_at: string;
  updated_at: string;
}

export interface CharacterConversation {
  id: string;
  user_id: string;
  character_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface CharacterMessage {
  id: string;
  conversation_id: string;
  role: CharacterMessageRole;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CharacterBookAppearance {
  id: string;
  title: string;
  slug: string;
  type: BookType;
  cover_image: string | null;
  role: BookCharacterRole;
  importance_score: number;
}

export interface CharacterRelationship {
  id: string;
  character_id: string;
  related_character_id: string;
  relationship_type: string;
  description: string | null;
  created_at: string;
}

export interface OrderItem {
  book_id: string;
  title: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
  image: string | null;
}

export interface HomepageSlide {
  id: string;
  title: string;
  eyebrow: string | null;
  description: string | null;
  background_image: string | null;
  mobile_image: string | null;
  primary_cta_label: string | null;
  primary_cta_href: string | null;
  secondary_cta_label: string | null;
  secondary_cta_href: string | null;
  aside_label: string | null;
  aside_number: string | null;
  aside_text: string | null;
  theme: HomepageSlideTheme;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
