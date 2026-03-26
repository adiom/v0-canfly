-- Тестовые данные для CanFly

-- Книги/Комиксы
INSERT INTO books (title, slug, type, description, cover_image, price, is_featured, display_order, external_links) VALUES
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
  'Артбук: Мир CanFly',
  'artbook-canfly-world',
  'book',
  'Коллекционный артбук с концепт-артами, эскизами персонажей и историей создания вселенной.',
  '/images/books/artbook-canfly.jpg',
  1299.00,
  true,
  5,
  '{"ozon": "https://ozon.ru"}'::jsonb
);

-- Персонажи
INSERT INTO characters (name, slug, avatar, bio, full_description, abilities) VALUES
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
);

-- Связи между персонажами
INSERT INTO character_relationships (character_id, related_character_id, relationship_type, description)
SELECT 
  c1.id, c2.id, 'наставник', 'Дмитрий обучает Киру контролировать её способности'
FROM characters c1, characters c2
WHERE c1.slug = 'dmitry-cherny' AND c2.slug = 'kira-volkova';

INSERT INTO character_relationships (character_id, related_character_id, relationship_type, description)
SELECT 
  c1.id, c2.id, 'ученица', 'Кира — ученица Дмитрия'
FROM characters c1, characters c2
WHERE c1.slug = 'kira-volkova' AND c2.slug = 'dmitry-cherny';

INSERT INTO character_relationships (character_id, related_character_id, relationship_type, description)
SELECT 
  c1.id, c2.id, 'лучшая подруга', 'Кира и Лиза — лучшие подруги с детства'
FROM characters c1, characters c2
WHERE c1.slug = 'kira-volkova' AND c2.slug = 'liza-svetlova';

INSERT INTO character_relationships (character_id, related_character_id, relationship_type, description)
SELECT 
  c1.id, c2.id, 'лучшая подруга', 'Лиза и Кира — лучшие подруги с детства'
FROM characters c1, characters c2
WHERE c1.slug = 'liza-svetlova' AND c2.slug = 'kira-volkova';

INSERT INTO character_relationships (character_id, related_character_id, relationship_type, description)
SELECT 
  c1.id, c2.id, 'враг', 'Арсений — главный противник Киры'
FROM characters c1, characters c2
WHERE c1.slug = 'arseniy-gromov' AND c2.slug = 'kira-volkova';

INSERT INTO character_relationships (character_id, related_character_id, relationship_type, description)
SELECT 
  c1.id, c2.id, 'враг', 'Кира противостоит Арсению'
FROM characters c1, characters c2
WHERE c1.slug = 'kira-volkova' AND c2.slug = 'arseniy-gromov';

INSERT INTO character_relationships (character_id, related_character_id, relationship_type, description)
SELECT 
  c1.id, c2.id, 'бывшие союзники', 'Дмитрий и Арсений когда-то сражались вместе'
FROM characters c1, characters c2
WHERE c1.slug = 'dmitry-cherny' AND c2.slug = 'arseniy-gromov';

INSERT INTO character_relationships (character_id, related_character_id, relationship_type, description)
SELECT 
  c1.id, c2.id, 'бывшие союзники', 'Арсений и Дмитрий когда-то сражались вместе'
FROM characters c1, characters c2
WHERE c1.slug = 'arseniy-gromov' AND c2.slug = 'dmitry-cherny';

INSERT INTO character_relationships (character_id, related_character_id, relationship_type, description)
SELECT 
  c1.id, c2.id, 'видит в видениях', 'Мира видит Киру в своих пророчествах'
FROM characters c1, characters c2
WHERE c1.slug = 'mira' AND c2.slug = 'kira-volkova';

-- Связи книг и персонажей
INSERT INTO book_characters (book_id, character_id)
SELECT b.id, c.id FROM books b, characters c
WHERE b.slug = 'wings-of-destiny' AND c.slug IN ('kira-volkova', 'dmitry-cherny', 'liza-svetlova', 'arseniy-gromov');

INSERT INTO book_characters (book_id, character_id)
SELECT b.id, c.id FROM books b, characters c
WHERE b.slug = 'shadows-of-sky' AND c.slug IN ('kira-volkova', 'dmitry-cherny', 'liza-svetlova', 'arseniy-gromov', 'mira');

INSERT INTO book_characters (book_id, character_id)
SELECT b.id, c.id FROM books b, characters c
WHERE b.slug = 'fall-of-angels' AND c.slug IN ('kira-volkova', 'dmitry-cherny', 'liza-svetlova', 'arseniy-gromov', 'mira');

INSERT INTO book_characters (book_id, character_id)
SELECT b.id, c.id FROM books b, characters c
WHERE b.slug = 'voices-of-abyss' AND c.slug IN ('kira-volkova', 'dmitry-cherny', 'liza-svetlova');

INSERT INTO book_characters (book_id, character_id)
SELECT b.id, c.id FROM books b, characters c
WHERE b.slug = 'artbook-canfly-world' AND c.slug IN ('kira-volkova', 'dmitry-cherny', 'liza-svetlova', 'arseniy-gromov', 'mira');
