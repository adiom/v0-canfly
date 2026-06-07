import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['next/dist/*'],
              message:
                'Internal Next.js API. Используйте публичные экспорты (next/navigation, next/headers и т.п.). Эти пути ломаются между мажорами без предупреждения.',
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'e2e/**',
    'playwright-report/**',
    'test-results/**',
    'node_modules/**',
    'public/**',
    'scripts/**',
    'supabase/**',
    'postgres/**',
  ]),
])
