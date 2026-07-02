# canfly SSO

## Модель

- `canfly.org` — центр аккаунтов и прав.
- Поддомены (`dev.canfly.org`, `kristina.canfly.org`, `banita.canfly.org`) входят через OIDC provider `canfly`.
- `users` и `user_roles` остаются главным источником профилей и ролей.

## Главный домен

На `canfly.org` включены:

- magic link;
- Google;
- GitHub;
- управление ролями.

## Поддомены

В OIDC/Logto создать отдельное приложение на каждый поддомен и добавить redirect URI:

```text
https://dev.canfly.org/api/auth/callback/canfly
https://kristina.canfly.org/api/auth/callback/canfly
https://banita.canfly.org/api/auth/callback/canfly
```

Для каждого поддомена задать env:

```env
AUTH_CANFLY_ISSUER=https://canfly.org/oidc
AUTH_CANFLY_CLIENT_ID=...
AUTH_CANFLY_CLIENT_SECRET=...
NEXT_PUBLIC_CANFLY_SSO_ENABLED=true
```

Если discovery URL отличается от стандартного, задать:

```env
AUTH_CANFLY_WELL_KNOWN=https://canfly.org/oidc/.well-known/openid-configuration
```
