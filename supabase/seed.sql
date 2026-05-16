-- Demo data for local Supabase resets.

INSERT INTO public.books (title, slug, type, description, cover_image, price, is_featured, display_order, external_links) VALUES
(
  'Крылья Судьбы',
  'wings-of-destiny',
  'comic',
  'Первая глава эпической саги о героях, которые научились летать. История о мечте, предательстве и силе духа.',
  '/images/books/wings-of-destiny.jpg',
  599.00,
  true,
  1,
  '{"litres": "https://litres.ru", "ozon": "https://ozon.ru"}'::jsonb
),
(
  'Тени Небес',
  'shadows-of-sky',
  'comic',
  'Продолжение истории. Герои сталкиваются с тёмной стороной своих способностей и узнают правду о своём происхождении.',
  '/images/books/shadows-of-sky.jpg',
  649.00,
  true,
  2,
  '{"litres": "https://litres.ru", "ozon": "https://ozon.ru"}'::jsonb
),
(
  'Падение Ангелов',
  'fall-of-angels',
  'book',
  'Новеллизация первых двух томов с дополнительными главами и иллюстрациями.',
  '/images/books/fall-of-angels.jpg',
  799.00,
  true,
  3,
  '{"litres": "https://litres.ru", "ozon": "https://ozon.ru"}'::jsonb
),
(
  'Голоса Бездны',
  'voices-of-abyss',
  'audiobook',
  'Аудиоверсия первого тома в исполнении профессиональных актёров с оригинальным саундтреком.',
  '/images/books/voices-of-abyss.jpg',
  449.00,
  true,
  4,
  '{"litres": "https://litres.ru"}'::jsonb
),
(
  'Артбук: Мир Canfly',
  'artbook-canfly-world',
  'book',
  'Коллекционный артбук с концепт-артами, эскизами персонажей и историей создания вселенной.',
  '/images/books/artbook-canfly.jpg',
  1299.00,
  true,
  5,
  '{"ozon": "https://ozon.ru"}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.characters (name, slug, avatar, bio, full_description, abilities) VALUES
(
  'Кира Волкова',
  'kira-volkova',
  '/images/characters/kira.jpg',
  'Главная героиня. Молодая художница, обнаружившая способность управлять гравитацией.',
  'Кира выросла в маленьком городке, мечтая о небе. После трагической потери родителей она обнаружила в себе дар — способность игнорировать законы гравитации. Теперь ей предстоит найти других "крылатых" и раскрыть тайну своего происхождения.',
  '["Управление гравитацией", "Левитация", "Гравитационный щит", "Художественное чутьё"]'::jsonb
),
(
  'Дмитрий Черный',
  'dmitry-cherny',
  '/images/characters/dmitry.jpg',
  'Загадочный наставник Киры. Ветеран первого поколения "крылатых".',
  'Дмитрий был одним из первых, кто обрёл способность летать. Прошлое, полное боли и потерь, научило его скрывать эмоции за маской цинизма. Он взял Киру под своё крыло, но его истинные мотивы остаются загадкой.',
  '["Сверхзвуковой полёт", "Воздушные лезвия", "Тактический гений", "Непроницаемость"]'::jsonb
),
(
  'Лиза Светлова',
  'liza-svetlova',
  '/images/characters/liza.jpg',
  'Лучшая подруга Киры и её связь с обычным миром.',
  'Лиза — единственный человек без способностей, которому Кира доверяет полностью. Её острый ум и хакерские навыки не раз спасали команду. Несмотря на отсутствие сверхсил, она доказывает, что для героизма не нужны крылья.',
  '["Хакерство", "Аналитический ум", "Медицинские знания", "Верность"]'::jsonb
),
(
  'Арсений Громов',
  'arseniy-gromov',
  '/images/characters/arseniy.jpg',
  'Антагонист первых томов. Лидер организации "Падшие".',
  'Когда-то Арсений был идеалистом, верившим в светлое будущее крылатых. Предательство и эксперименты над ним превратили героя в безжалостного манипулятора. Он верит, что только через разрушение старого мира можно построить новый.',
  '["Контроль электричества", "Молниеносные удары", "Техномантия", "Манипуляция"]'::jsonb
),
(
  'Мира',
  'mira',
  '/images/characters/mira.jpg',
  'Таинственная девочка с пророческим даром.',
  'Мира появляется в видениях Киры задолго до их реальной встречи. Её способность видеть будущее — проклятие, которое она несёт с детства. Она знает, чем закончится история, но не может изменить судьбу.',
  '["Пророческие видения", "Телепатия", "Астральная проекция", "Временные петли"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.character_relationships (character_id, related_character_id, relationship_type, description)
SELECT c1.id, c2.id, item.relationship_type, item.description
FROM (
  VALUES
    ('dmitry-cherny', 'kira-volkova', 'наставник', 'Дмитрий обучает Киру контролировать её способности'),
    ('kira-volkova', 'dmitry-cherny', 'ученица', 'Кира — ученица Дмитрия'),
    ('kira-volkova', 'liza-svetlova', 'лучшая подруга', 'Кира и Лиза — лучшие подруги с детства'),
    ('liza-svetlova', 'kira-volkova', 'лучшая подруга', 'Лиза и Кира — лучшие подруги с детства'),
    ('arseniy-gromov', 'kira-volkova', 'враг', 'Арсений — главный противник Киры'),
    ('kira-volkova', 'arseniy-gromov', 'враг', 'Кира противостоит Арсению'),
    ('dmitry-cherny', 'arseniy-gromov', 'бывшие союзники', 'Дмитрий и Арсений когда-то сражались вместе'),
    ('arseniy-gromov', 'dmitry-cherny', 'бывшие союзники', 'Арсений и Дмитрий когда-то сражались вместе'),
    ('mira', 'kira-volkova', 'видит в видениях', 'Мира видит Киру в своих пророчествах')
) AS item(character_slug, related_slug, relationship_type, description)
JOIN public.characters c1 ON c1.slug = item.character_slug
JOIN public.characters c2 ON c2.slug = item.related_slug
ON CONFLICT (character_id, related_character_id) DO NOTHING;

INSERT INTO public.book_characters (book_id, character_id)
SELECT b.id, c.id
FROM public.books b
JOIN LATERAL (
  SELECT unnest(
    CASE b.slug
      WHEN 'wings-of-destiny' THEN ARRAY['kira-volkova', 'dmitry-cherny', 'liza-svetlova', 'arseniy-gromov']
      WHEN 'shadows-of-sky' THEN ARRAY['kira-volkova', 'dmitry-cherny', 'liza-svetlova', 'arseniy-gromov', 'mira']
      WHEN 'fall-of-angels' THEN ARRAY['kira-volkova', 'dmitry-cherny', 'liza-svetlova', 'arseniy-gromov', 'mira']
      WHEN 'voices-of-abyss' THEN ARRAY['kira-volkova', 'dmitry-cherny', 'liza-svetlova']
      WHEN 'artbook-canfly-world' THEN ARRAY['kira-volkova', 'dmitry-cherny', 'liza-svetlova', 'arseniy-gromov', 'mira']
      ELSE ARRAY[]::text[]
    END
  ) AS character_slug
) bc ON true
JOIN public.characters c ON c.slug = bc.character_slug
ON CONFLICT (book_id, character_id) DO NOTHING;

INSERT INTO public.homepage_slides (
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
