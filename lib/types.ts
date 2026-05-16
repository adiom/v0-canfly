export type BookType = 'comic' | 'book' | 'audiobook';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';

export interface Book {
  id: string;
  title: string;
  slug: string;
  type: BookType;
  description: string | null;
  cover_image: string | null;
  preview_pages: string[] | null;
  external_links: Record<string, string> | null;
  price: number | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
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
