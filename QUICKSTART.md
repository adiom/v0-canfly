# CanFly - Быстрый старт

## 1. Финальная проверка

Все необходимые компоненты уже созданы. Просто убедитесь, что:

✅ Supabase подключен (интеграция в v0)
✅ Таблицы созданы в БД
✅ Sample данные загружены (5 книг и 5 персонажей)

## 2. Запуск приложения

```bash
pnpm dev
```

Приложение откроется на [http://localhost:3000](http://localhost:3000)

## 3. Тестирование функциональности

### Главная страница
- Слайдер с 5 избранными книгами
- Табы ниже слайдера с названиями книг
- Кнопки "Читать" и ссылки на магазины

### Персонажи (`/characters`)
- Граф взаимосвязей в центре
- Сетка с карточками 5 персонажей
- Клик на персонажа → полный профиль с описанием и связями

### Магазин (`/shop`)
- Сетка с 5 книгами/комиксами
- Кнопка "В корзину" добавляет товар (хранится в localStorage)
- Цены в рублях

### Корзина (`/cart`)
- Просмотр добавленных товаров
- Изменение количества (+-) или удаление
- Форма заявки: имя, email, телефон, адрес, заметки
- При отправке заказ сохраняется в БД

### Чтение онлайн (`/books/[slug]`)
- Просмотр страниц книги
- Навигация вперед/назад
- Полноэкранный режим
- Возможность добавить в корзину

### Админ-панель (`/admin`)
- Вход: email `admin@canfly.local`, пароль `admin123`
- Табы: Книги, Персонажи, Заказы
- Просмотр всех данных и полученных заказов

## 4. Переменные окружения

Скопируйте `.env.example` в `.env.local` и обновите значения Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ADMIN_PASSWORD=admin123
```

Ключи найдете в Supabase Dashboard → Settings → API.

## 5. Дополнение контента

### Добавить еще книг

SQL:
```sql
INSERT INTO books (title, slug, type, description, cover_image, price, is_featured, display_order)
VALUES (
  'Название книги',
  'slug-названия',
  'comic', -- или 'book', 'audiobook'
  'Описание...',
  'https://link-to-image.jpg',
  59999, -- цена в копейках
  true,
  6 -- порядок отображения
);
```

### Добавить персонажа

SQL:
```sql
INSERT INTO characters (name, slug, avatar, bio, full_description)
VALUES (
  'Имя Персонажа',
  'slug-имени',
  'https://link-to-avatar.jpg',
  'Краткое описание',
  'Полное описание...'
);
```

### Связать персонажей

SQL:
```sql
INSERT INTO character_relationships (character_id, related_character_id, relationship_type, description)
VALUES (
  (SELECT id FROM characters WHERE slug = 'cipher'),
  (SELECT id FROM characters WHERE slug = 'nova'),
  'Союзник',
  'Боец сопротивления присоединяется к Cipher'
);
```

## 6. Развертывание на Vercel

1. Создайте репозиторий на GitHub
2. Подключите проект на Vercel
3. Добавьте переменные окружения в Project Settings
4. Разверните с помощью `git push`

## 7. Проблемы и решения

**Ошибка: "Таблицы не найдены"**
→ Убедитесь, что SQL миграции выполнены в Supabase console

**Ошибка: "NEXT_PUBLIC_SUPABASE_URL не определен"**
→ Скопируйте `.env.example` в `.env.local` и добавьте реальные ключи

**Админ-панель не загружается**
→ Очистите localStorage: `localStorage.clear()` в консоли браузера

**Корзина пуста после перезагрузки**
→ Это нормально, корзина хранится в localStorage браузера (в продакшене используйте БД)

## 8. Структура файлов

```
/app
  /api
    /admin
      /login - вход админа
      /orders - заказы
    /books - получить книги
    /characters - получить персонажей
    /orders - создать заказ
  /admin
    /page.tsx - главная админ-панель
    /login/page.tsx - форма входа
  /books
    /[slug]/page.tsx - читалка книги
  /characters
    /page.tsx - каталог персонажей
    /[slug]/page.tsx - профиль персонажа
  /shop/page.tsx - магазин
  /cart/page.tsx - корзина
  /page.tsx - главная
/components
  /books-carousel.tsx - слайдер на главной
  /character-card.tsx - карточка персонажа
  /character-graph.tsx - граф взаимосвязей
/lib
  /types.ts - TypeScript типы
  /cart-context.tsx - контекст корзины
  /supabase/
    /client.ts - Supabase клиент (браузер)
    /server.ts - Supabase клиент (сервер)
    /middleware.ts - middleware для сессий
```

## 9. Что дальше?

- Добавьте больше контента (книг, персонажей, связей)
- Кастомизируйте дизайн в `globals.css`
- Добавьте аутентификацию для пользователей (Supabase Auth)
- Интегрируйте реальный платеж (Stripe)
- Настройте рассылку уведомлений (заказы)

---

**Готово к использованию!** 🚀

Вопросы? Смотрите SETUP.md для подробной документации.
