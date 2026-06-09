#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'
import mammoth from 'mammoth'

// ─── Env ───────────────────────────────────────────────────────────────────────

const ENV_FILES = ['.env.local', '.env']

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  const contents = readFileSync(filePath, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

for (const envFile of ENV_FILES) loadEnvFile(resolve(process.cwd(), envFile))

// ─── DB ────────────────────────────────────────────────────────────────────────

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!databaseUrl) { console.error('Missing DATABASE_URL or POSTGRES_URL'); process.exit(1) }

function isLocalDatabaseUrl(value) {
  try { const url = new URL(value); return ['localhost', '127.0.0.1', '::1'].includes(url.hostname) } catch { return false }
}

function normalizeConnectionString(connectionString) {
  if (!connectionString.includes('sslmode=')) return connectionString
  const url = new URL(connectionString)
  const params = new URLSearchParams(url.search)
  const sslmode = params.get('sslmode')
  if (sslmode === 'require' || sslmode === 'prefer' || sslmode === 'verify-ca') {
    params.set('sslmode', 'verify-full')
    url.search = params.toString()
    return url.toString()
  }
  return connectionString
}

const pool = new pg.Pool({
  connectionString: normalizeConnectionString(databaseUrl),
  ssl: isLocalDatabaseUrl(databaseUrl) ? false : { rejectUnauthorized: false },
  max: 3,
})

// ─── Slug ──────────────────────────────────────────────────────────────────────

const CYRILLIC_MAP = {
  А:'A',Б:'B',В:'V',Г:'G',Д:'D',Е:'E',Ё:'Yo',Ж:'Zh',З:'Z',И:'I',Й:'Y',К:'K',Л:'L',М:'M',
  Н:'N',О:'O',П:'P',Р:'R',С:'S',Т:'T',У:'U',Ф:'F',Х:'Kh',Ц:'Ts',Ч:'Ch',Ш:'Sh',Щ:'Shch',
  Ъ:'',Ы:'Y',Ь:'',Э:'E',Ю:'Yu',Я:'Ya',
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',
  н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',
  ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
}

function transliterate(text) {
  let result = ''
  for (const char of text) result += CYRILLIC_MAP[char] ?? char
  return result
}

function generateSlug(text) {
  const slug = transliterate(text)
    .toLowerCase()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'untitled'
}

// ─── HTML splitting ────────────────────────────────────────────────────────────

function splitHtmlByHeadings(html, headingLevel = 1) {
  const tag = `h${headingLevel}`
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, 'gi')
  const blocks = []
  let lastEnd = 0
  let match

  const headingMatches = []
  while ((match = regex.exec(html)) !== null) {
    headingMatches.push({
      title: match[1].replace(/<[^>]*>/g, '').trim(),
      startIdx: match.index,
      endIdx: regex.lastIndex,
    })
  }

  if (headingMatches.length === 0) {
    return [{ title: '', content: html }]
  }

  // Preamble: content before first heading
  const preamble = html.slice(0, headingMatches[0].startIdx).trim()

  for (let i = 0; i < headingMatches.length; i++) {
    const h = headingMatches[i]
    const nextStart = i + 1 < headingMatches.length ? headingMatches[i + 1].startIdx : html.length
    const content = html.slice(h.endIdx, nextStart).trim()
    blocks.push({
      title: h.title,
      content: content || '',
    })
  }

  return { blocks, preamble }
}

function wordCount(html) {
  if (!html) return 0
  return html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
}

// ─── CLI ───────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  if (args.length < 2) {
    console.error(`
Usage: node scripts/import-docx.mjs <docx-path> <release-id> [options]

Options:
  --heading-level=N    Split by h1 (default), h2, etc.
  --edition-slug=...   Custom slug for the edition
  --publish            Set chapters to 'published' status
  --include-preamble   Include content before first heading as a prologue
  --strip-images       Remove all <img> tags from the HTML
  --dry-run            Preview only, no DB writes

Example:
  node scripts/import-docx.mjs ./book.docx 4acc91b6-... --dry-run
  node scripts/import-docx.mjs ./book.docx 4acc91b6-... --publish
`)
    process.exit(1)
  }

  const docxPath = resolve(process.cwd(), args[0])
  const releaseId = args[1]
  const options = {}

  for (let i = 2; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--heading-level=')) options.headingLevel = parseInt(arg.split('=')[1], 10)
    else if (arg.startsWith('--edition-slug=')) options.editionSlug = arg.split('=')[1]
    else if (arg === '--publish') options.publish = true
    else if (arg === '--include-preamble') options.includePreamble = true
    else if (arg === '--strip-images') options.stripImages = true
    else if (arg === '--dry-run') options.dryRun = true
  }

  return { docxPath, releaseId, options }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { docxPath, releaseId, options } = parseArgs()
  const { headingLevel = 1, editionSlug, publish, includePreamble, stripImages, dryRun } = options

  console.log(`📄 DOCX: ${docxPath}`)
  console.log(`🔗 Release ID: ${releaseId}`)
  if (dryRun) console.log('🏁 DRY RUN — no DB changes')

  // 1. Verify release exists
  const releaseRes = await pool.query('SELECT id, title, slug FROM releases WHERE id = $1', [releaseId])
  if (releaseRes.rows.length === 0) {
    console.error(`Release not found: ${releaseId}`)
    await pool.end()
    process.exit(1)
  }
  const release = releaseRes.rows[0]
  console.log(`📖 Release: ${release.title} (${release.slug})`)

  // 2. Convert DOCX to HTML
  console.log('\n⏳ Converting DOCX to HTML...')
  const result = await mammoth.convertToHtml({ path: docxPath })
  let html = result.value
  if (result.messages.length > 0) {
    for (const msg of result.messages) {
      console.log(`  ⚠ mammoth: ${msg.type} — ${msg.message}`)
    }
  }
  if (stripImages) {
    const imgCount = (html.match(/<img[^>]*>/gi) || []).length
    if (imgCount > 0) {
      console.log(`  🗑  Removing ${imgCount} image(s)`)
    }
    html = html.replace(/<img[^>]*>/gi, '')
  }

  console.log(`  HTML length: ${html.length} chars`)

  // 3. Split by headings
  console.log(`\n⏳ Splitting by <h${headingLevel}>...`)
  const { blocks, preamble } = splitHtmlByHeadings(html, headingLevel)
  console.log(`  Found ${blocks.length} heading(s)`)

  if (preamble && !includePreamble) {
    console.log(`  ⏭  Skipping preamble (${preamble.length} chars). Use --include-preamble to include it.`)
  } else if (preamble && includePreamble) {
    console.log(`  📌 Including preamble as prologue (${preamble.length} chars)`)
  }

  // Compile final chapter list
  const chapters = []
  let idx = 1

  if (preamble && includePreamble) {
    const preambleTitle = 'Пролог'
    chapters.push({
      title: preambleTitle,
      content: preamble,
      index: idx++,
      wordCount: wordCount(preamble),
    })
  }

  for (const block of blocks) {
    // Use heading text as chapter title. If empty, generate one.
    const title = block.title || `Глава ${idx}`
    chapters.push({
      title,
      content: block.content,
      index: idx++,
      wordCount: wordCount(block.content),
    })
  }

  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
  console.log(`\n📚 Chapters to create:`)
  for (const ch of chapters) {
    console.log(`  [${ch.index}] ${ch.title} — ${ch.wordCount} слов`)
  }
  console.log(`\n  Total: ${chapters.length} chapters, ${totalWords} words`)

  // 4. Generate edition slug
  const slug = editionSlug || generateSlug(`${release.slug}-book`)

  if (dryRun) {
    console.log(`\n🏁 DRY RUN — edition slug would be: ${slug}`)
    console.log('🏁 No DB changes made.')
    await pool.end()
    return
  }

  // 5. Create edition
  console.log('\n⏳ Creating edition...')
  const editionRes = await pool.query(
    `INSERT INTO editions (release_id, format, slug, status, is_primary)
     VALUES ($1, 'book'::edition_format, $2, 'draft', false)
     RETURNING id, slug`,
    [releaseId, slug]
  )
  const edition = editionRes.rows[0]
  console.log(`  ✅ Edition created: ${edition.id} (${edition.slug})`)

  // 6. Create chapters
  console.log(`\n⏳ Creating ${chapters.length} chapters...`)
  const status = publish ? 'published' : 'draft'

  for (const ch of chapters) {
    const chapterRes = await pool.query(
      `INSERT INTO chapters (edition_id, title, content, chapter_index, status, word_count)
       VALUES ($1, $2, $3, $4, $5::chapter_status, $6)
       RETURNING id`,
      [edition.id, ch.title, ch.content, ch.index, status, ch.wordCount]
    )
    const chapterId = chapterRes.rows[0].id
    const icon = publish ? '📖' : '📝'
    console.log(`  ${icon} [${ch.index}] ${ch.title} → ${chapterId}`)
  }

  console.log(`\n✅ Done! ${chapters.length} chapters imported into edition ${edition.slug} (${edition.id})`)
  console.log(`   Edition status: draft`)
  if (!publish) {
    console.log(`   Use --publish to create published chapters`)
  }

  await pool.end()
}

main().catch(err => {
  console.error(err)
  pool.end().then(() => process.exit(1))
})
