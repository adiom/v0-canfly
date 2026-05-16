-- Homepage hero slider managed from admin panel

DO $$
BEGIN
  CREATE TYPE homepage_slide_theme AS ENUM ('atelier', 'night-city', 'pvz', 'volga', 'dreams');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS homepage_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  eyebrow TEXT,
  description TEXT,
  background_image TEXT,
  mobile_image TEXT,
  primary_cta_label TEXT,
  primary_cta_href TEXT,
  secondary_cta_label TEXT,
  secondary_cta_href TEXT,
  theme homepage_slide_theme NOT NULL DEFAULT 'atelier',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_slides_active_order
  ON homepage_slides(is_active, display_order);

CREATE TRIGGER update_homepage_slides_updated_at
  BEFORE UPDATE ON homepage_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE homepage_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homepage slides are viewable by everyone"
  ON homepage_slides FOR SELECT USING (true);

INSERT INTO homepage_slides (
  title,
  eyebrow,
  description,
  primary_cta_label,
  primary_cta_href,
  secondary_cta_label,
  secondary_cta_href,
  theme,
  is_active,
  display_order
) VALUES
  (
    'Крой по душе',
    'бытовой магический реализм',
    'Швея Соня создаёт одежду, которая работает как эмоциональная броня: ткань говорит за человека, когда голос не выдерживает.',
    'Читать',
    '/books',
    'Персонажи',
    '/characters',
    'atelier',
    true,
    1
  ),
  (
    'Маша Можно',
    'ночной город / ненадёжная память',
    'Остановки, автобусы, странные разговоры и мягкий хоррор повседневности, где невозможно до конца доверять собственному восприятию.',
    'Войти в историю',
    '/books',
    'Город N',
    '/characters',
    'night-city',
    true,
    2
  ),
  (
    'Неучтённая',
    'производственное технофэнтези',
    'Сотрудница ПВЗ попадает в мир, где реальность устроена как повреждённая система хранения: маршруты, ячейки, узлы и архивы.',
    'Открыть цикл',
    '/books',
    'Смотреть миры',
    '/characters',
    'pvz',
    true,
    3
  ),
  (
    'Железный Хан Волги',
    'инженерное попаданчество',
    'Инженер XXI века в XVI столетии собирает не легенду о себе, а инфраструктуру, правила и систему, которая переживёт человека.',
    'Читать роман',
    '/books',
    'Карта связей',
    '/characters',
    'volga',
    true,
    4
  )
ON CONFLICT DO NOTHING;
