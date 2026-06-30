// scripts/generate-recipe-pages.js
// Génère une page HTML par recette depuis Supabase — Curieuse Cuisine

const https = require('https');
const fs = require('fs');
const path = require('path');

const SB_URL = process.env.SB_URL || 'https://fctrykdgileberjguzfx.supabase.co/rest/v1';
const SB_KEY = process.env.SB_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHJ5a2RnaWxlYmVyamd1emZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzQyNDEsImV4cCI6MjA5MjYxMDI0MX0.0Kz8ZFtqWMTG6HXT7WeeJsoSyJ9tfSj6WwTdAjWwrRM';
const SITE_URL = 'https://curieuse-cuisine.arsene-mathieu09.workers.dev';
const SITE_NAME = 'Curieuse Cuisine';

// Convertit un nom en slug URL
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Fetch depuis Supabase
function fetchRecipes() {
  return new Promise((resolve, reject) => {
    const url = new URL(SB_URL + '/recettes?select=*&order=created_at.desc');
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
      }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const rows = JSON.parse(data);
          const recipes = rows.map(row => Object.assign({ _id: row.id }, row.data || {}));
          resolve(recipes);
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Génère le HTML d'une page recette
function generateRecipePage(recipe) {
  const ings = (recipe.ingredients || '').split('\n').filter(Boolean);
  const steps = (recipe.steps || '').split('\n').filter(Boolean);
  const photo = recipe.photo || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80';
  const slug = slugify(recipe.name || 'recette');
  const mainUrl = `${SITE_URL}/recettes/${slug}.html`;
  const time = recipe.time ? recipe.time + ' min' : '';

  const ingsHtml = ings.map(i => {
    const m = i.match(/^([\d.,\/]+\s*(?:g|kg|ml|l|cl)?)\s*(.*)$/i);
    if (m) return `<li class="ing-item"><span class="ing-qty">${m[1].trim()}</span> ${m[2]}</li>`;
    return `<li class="ing-item"><span class="ing-dot">·</span> ${i}</li>`;
  }).join('\n');

  const stepsHtml = steps.map((s, i) => `
    <div class="step">
      <div class="step-n">${i + 1}</div>
      <div class="step-t">${s}</div>
    </div>`).join('\n');

  // Schema.org pour le SEO
  const schema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": recipe.name,
    "description": recipe.notes || `Recette de ${recipe.name}${recipe.origin ? ' — ' + recipe.origin : ''}`,
    "image": photo,
    "url": mainUrl,
    "recipeCategory": recipe.category || 'Plat',
    "recipeOrigin": recipe.origin || '',
    "totalTime": recipe.time ? `PT${recipe.time}M` : undefined,
    "recipeIngredient": ings,
    "recipeInstructions": steps.map((s, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "text": s
    })),
    "author": {
      "@type": "Person",
      "name": "Arsène Mathieu"
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": SITE_URL
    }
  };

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${recipe.name} — ${SITE_NAME}</title>
  <meta name="description" content="${recipe.notes ? recipe.notes.slice(0, 155) : `Recette de ${recipe.name}${recipe.origin ? ', cuisine ' + recipe.origin : ''}${time ? ', ' + time : ''}.`}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${mainUrl}">
  <!-- Open Graph -->
  <meta property="og:title" content="${recipe.name} — ${SITE_NAME}">
  <meta property="og:description" content="Recette de ${recipe.name}${recipe.origin ? ' · ' + recipe.origin : ''}${time ? ' · ' + time : ''}">
  <meta property="og:image" content="${photo}">
  <meta property="og:url" content="${mainUrl}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="fr_FR">
  <!-- Schema.org -->
  <script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Instrument+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --ink: #17130f;
      --ink2: #1f1a15;
      --ink3: #28221b;
      --cream: #E8E0D2;
      --muted: rgba(232,224,210,.55);
      --gold: #C8922A;
      --gold2: #E8B84B;
      --border: rgba(232,224,210,.09);
      --r: 14px; --r2: 20px; --r3: 28px;
    }
    body {
      font-family: 'Instrument Sans', sans-serif;
      background: var(--ink);
      color: var(--cream);
      min-height: 100vh;
      line-height: 1.6;
    }
    /* HEADER */
    .hdr {
      background: rgba(23,19,15,.95);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky; top: 0; z-index: 100;
    }
    .logo {
      font-family: 'Playfair Display', serif;
      font-size: 1.15rem;
      color: var(--cream);
      text-decoration: none;
    }
    .logo em { color: var(--gold2); font-style: italic; }
    .back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 99px;
      border: 1px solid var(--border);
      background: transparent; color: var(--muted);
      font-family: 'Instrument Sans', sans-serif;
      font-size: .78rem; text-decoration: none;
      transition: all .2s;
    }
    .back-btn:hover { border-color: rgba(200,146,42,.35); color: var(--gold2); }
    /* HERO */
    .hero {
      position: relative;
      height: clamp(300px, 50vw, 480px);
      overflow: hidden;
      display: flex; align-items: flex-end;
    }
    .hero-img {
      position: absolute; inset: 0;
      background-image: url('${photo}');
      background-size: cover; background-position: center;
    }
    .hero-img img {
      position: absolute; inset: 0;
      width: 100%; height: 100%; object-fit: cover;
      opacity: 0; pointer-events: none;
    }
    .hero-ov {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(23,19,15,.97) 0%, rgba(23,19,15,.4) 55%, rgba(23,19,15,.05) 100%);
    }
    .hero-content {
      position: relative; z-index: 2;
      padding: 32px 28px; width: 100%;
    }
    @media(min-width: 768px) { .hero-content { padding: 48px 56px; } }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: .6rem; font-weight: 600; letter-spacing: .14em;
      text-transform: uppercase;
      border: 1px solid rgba(200,146,42,.4); color: var(--gold2);
      padding: 4px 12px; border-radius: 99px; margin-bottom: 14px;
      backdrop-filter: blur(8px); background: rgba(23,19,15,.3);
    }
    .recipe-title {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2rem, 6vw, 3.5rem);
      font-weight: 400; line-height: 1.1;
      color: #F2EDE4; margin-bottom: 16px;
      letter-spacing: -.01em;
    }
    .pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .pill {
      display: flex; align-items: center; gap: 5px;
      background: rgba(23,19,15,.55); backdrop-filter: blur(10px);
      border: 1px solid rgba(232,224,210,.12); color: var(--muted);
      font-size: .68rem; padding: 5px 13px; border-radius: 99px;
    }
    /* BODY */
    .body { max-width: 900px; margin: 0 auto; padding: 40px 20px 80px; }
    @media(min-width: 768px) { .body { padding: 56px 40px 80px; } }
    /* NOTES */
    .notes-card {
      background: linear-gradient(135deg, rgba(200,146,42,.1), rgba(200,146,42,.03));
      border: 1px solid rgba(200,146,42,.2);
      border-radius: var(--r2); padding: 22px 26px; margin-bottom: 28px;
    }
    .notes-lbl {
      font-size: .58rem; font-weight: 600; letter-spacing: .14em;
      text-transform: uppercase; color: var(--gold); margin-bottom: 8px;
    }
    .notes-txt {
      font-family: 'Playfair Display', serif;
      font-size: 1.05rem; line-height: 1.65;
      color: var(--cream); font-style: italic;
    }
    /* GRID */
    .grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
    @media(min-width: 620px) { .grid { grid-template-columns: 1fr 1fr; } }
    .card {
      background: var(--ink3); border: 1px solid var(--border);
      border-radius: var(--r2); padding: 24px 26px;
    }
    .card-h {
      font-family: 'Playfair Display', serif;
      font-size: .95rem; font-weight: 400;
      color: var(--cream); margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
      padding-bottom: 12px; border-bottom: 1px solid var(--border);
    }
    /* INGREDIENTS */
    .ing-list { list-style: none; display: flex; flex-direction: column; gap: 0; }
    .ing-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 9px 0; border-bottom: 1px solid rgba(232,224,210,.04);
      font-size: .85rem; color: var(--muted); line-height: 1.4;
    }
    .ing-item:last-child { border: none; }
    .ing-qty { color: var(--gold2); font-weight: 600; flex-shrink: 0; }
    .ing-dot { color: var(--gold); flex-shrink: 0; }
    /* STEPS */
    .step {
      display: flex; gap: 14px; margin-bottom: 16px;
      align-items: flex-start;
    }
    .step-n {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: .72rem; font-weight: 700;
      color: var(--ink); background: var(--gold); margin-top: 1px;
      font-family: 'Playfair Display', serif;
    }
    .step-t { font-size: .88rem; line-height: 1.7; color: var(--muted); padding-top: 4px; }
    /* CTA */
    .cta {
      margin-top: 40px; padding: 32px;
      background: var(--ink3); border: 1px solid var(--border);
      border-radius: var(--r3); text-align: center;
    }
    .cta-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.4rem; font-weight: 400;
      color: var(--cream); margin-bottom: 8px;
    }
    .cta-sub { font-size: .85rem; color: var(--muted); margin-bottom: 22px; line-height: 1.6; }
    .cta-btn {
      display: inline-block; padding: 14px 32px;
      background: var(--gold); color: var(--ink);
      border-radius: var(--r2); font-family: 'Instrument Sans', sans-serif;
      font-size: .85rem; font-weight: 600; text-decoration: none;
      letter-spacing: .03em; transition: all .2s;
    }
    .cta-btn:hover { background: var(--gold2); }
    /* FOOTER */
    .footer {
      border-top: 1px solid var(--border);
      padding: 24px; text-align: center;
      font-size: .7rem; color: var(--muted);
      margin-top: 60px;
    }
    .footer a { color: var(--gold2); text-decoration: none; }
    /* Breadcrumb */
    .breadcrumb {
      font-size: .72rem; color: var(--muted);
      padding: 14px 28px;
      display: flex; align-items: center; gap: 6px;
      max-width: 900px; margin: 0 auto;
    }
    .breadcrumb a { color: var(--muted); text-decoration: none; }
    .breadcrumb a:hover { color: var(--gold2); }
    .breadcrumb span { color: var(--muted2); }
    @media(max-width: 767px) {
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

<header class="hdr">
  <a class="logo" href="${SITE_URL}">Curieuse <em>Cuisine</em></a>
  <a class="back-btn" href="${SITE_URL}">← Retour au site</a>
</header>

<nav class="breadcrumb" aria-label="Fil d'Ariane">
  <a href="${SITE_URL}">Accueil</a>
  <span>›</span>
  <a href="${SITE_URL}/recettes/">Recettes</a>
  <span>›</span>
  <span>${recipe.name}</span>
</nav>

<div class="hero">
  <div class="hero-img">
    <img src="${photo}" alt="${recipe.name}">
  </div>
  <div class="hero-ov"></div>
  <div class="hero-content">
    <div class="badge">${recipe.category || 'Recette'}${recipe.origin ? ' · ' + recipe.origin : ''}</div>
    <h1 class="recipe-title">${recipe.name}</h1>
    <div class="pills">
      ${time ? `<span class="pill">⏱ ${time}</span>` : ''}
      ${recipe.origin ? `<span class="pill">📍 ${recipe.origin}</span>` : ''}
      ${recipe.seasonal ? `<span class="pill" style="border-color:rgba(107,143,113,.5);background:rgba(107,143,113,.15)">🌿 Produit de saison</span>` : ''}
    </div>
  </div>
</div>

<main class="body">

  ${recipe.notes ? `
  <div class="notes-card">
    <div class="notes-lbl">📖 Notes du cuisinier</div>
    <p class="notes-txt">${recipe.notes}</p>
  </div>` : ''}

  <div class="grid">
    <div class="card">
      <div class="card-h">🧺 Ingrédients</div>
      <ul class="ing-list">
        ${ingsHtml || '<li class="ing-item"><span style="color:var(--muted2)">Non renseignés</span></li>'}
      </ul>
    </div>
    <div class="card">
      <div class="card-h">👨‍🍳 Étapes</div>
      ${stepsHtml || '<p style="font-size:.85rem;color:var(--muted2)">Non renseignées</p>'}
    </div>
  </div>

  <div class="cta">
    <div class="cta-title">Découvre d'autres recettes ✦</div>
    <p class="cta-sub">Accords mets-boissons, suggestions IA, et bien plus sur ${SITE_NAME}.</p>
    <a class="cta-btn" href="${SITE_URL}">Explorer l'encyclopédie →</a>
  </div>

</main>

<footer class="footer">
  <a href="${SITE_URL}">${SITE_NAME}</a> — Encyclopédie culinaire personnelle · <a href="${SITE_URL}/recettes/">Voir toutes les recettes</a>
</footer>

</body>
</html>`;
}

// Génère aussi une page index des recettes
function generateIndexPage(recipes) {
  const cards = recipes.map(r => {
    const slug = slugify(r.name || 'recette');
    const photo = r.photo || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80';
    return `
    <a class="recipe-card" href="/recettes/${slug}.html">
      <div class="card-img" style="background-image:url('${photo}')">
        <img src="${photo}" alt="${r.name}" loading="lazy">
        <div class="card-ov"></div>
        <span class="card-cat">${r.category || 'Recette'}</span>
      </div>
      <div class="card-body">
        <h2 class="card-title">${r.name}</h2>
        <div class="card-meta">
          ${r.origin ? `<span>📍 ${r.origin}</span>` : ''}
          ${r.time ? `<span>⏱ ${r.time} min</span>` : ''}
        </div>
      </div>
    </a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Toutes les recettes — ${SITE_NAME}</title>
  <meta name="description" content="Découvre toutes les recettes de ${SITE_NAME} — cuisine du monde, plats, desserts, entrées et plus encore.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${SITE_URL}/recettes/">
  <meta property="og:title" content="Toutes les recettes — ${SITE_NAME}">
  <meta property="og:description" content="Découvre ${recipes.length} recettes du monde entier.">
  <meta property="og:url" content="${SITE_URL}/recettes/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Instrument+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --ink:#17130f; --ink2:#1f1a15; --ink3:#28221b; --cream:#E8E0D2; --muted:rgba(232,224,210,.55); --gold:#C8922A; --gold2:#E8B84B; --border:rgba(232,224,210,.09); }
    body { font-family: 'Instrument Sans', sans-serif; background: var(--ink); color: var(--cream); min-height: 100vh; }
    .hdr { background: rgba(23,19,15,.95); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
    .logo { font-family: 'Playfair Display', serif; font-size: 1.15rem; color: var(--cream); text-decoration: none; }
    .logo em { color: var(--gold2); font-style: italic; }
    .back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 99px; border: 1px solid var(--border); background: transparent; color: var(--muted); font-size: .78rem; text-decoration: none; transition: all .2s; }
    .back-btn:hover { border-color: rgba(200,146,42,.35); color: var(--gold2); }
    .hero-sm { padding: 56px 28px 40px; max-width: 900px; margin: 0 auto; }
    .hero-tag { font-size: .6rem; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
    .hero-tag::before { content: ''; width: 24px; height: 1px; background: var(--gold); }
    .hero-h { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 400; line-height: 1.1; margin-bottom: 10px; }
    .hero-h em { font-style: italic; color: var(--gold2); }
    .hero-sub { font-size: .88rem; color: var(--muted); line-height: 1.7; }
    .body { max-width: 1100px; margin: 0 auto; padding: 0 20px 80px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
    @media(max-width: 480px) { .grid { grid-template-columns: 1fr 1fr; gap: 12px; } }
    .recipe-card { background: var(--ink3); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; text-decoration: none; color: var(--cream); transition: transform .3s, box-shadow .3s; display: block; }
    .recipe-card:hover { transform: translateY(-5px); box-shadow: 0 16px 48px rgba(0,0,0,.5); }
    .card-img { height: 180px; position: relative; overflow: hidden; background-size: cover; background-position: center; }
    .card-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(.65); transition: filter .4s; }
    .recipe-card:hover .card-img img { filter: brightness(.85); }
    .card-ov { position: absolute; inset: 0; background: linear-gradient(to top, rgba(23,19,15,.8) 0%, transparent 60%); }
    .card-cat { position: absolute; top: 10px; left: 10px; font-size: .55rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; background: rgba(23,19,15,.7); backdrop-filter: blur(8px); border: 1px solid rgba(200,146,42,.3); color: var(--gold2); padding: 3px 9px; border-radius: 99px; }
    .card-body { padding: 16px 18px 18px; }
    .card-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 400; margin-bottom: 8px; line-height: 1.3; }
    .card-meta { display: flex; gap: 8px; font-size: .68rem; color: var(--muted); flex-wrap: wrap; }
    .footer { border-top: 1px solid var(--border); padding: 24px; text-align: center; font-size: .7rem; color: var(--muted); margin-top: 40px; }
    .footer a { color: var(--gold2); text-decoration: none; }
  </style>
</head>
<body>
<header class="hdr">
  <a class="logo" href="${SITE_URL}">Curieuse <em>Cuisine</em></a>
  <a class="back-btn" href="${SITE_URL}">← Accueil</a>
</header>
<div class="hero-sm">
  <div class="hero-tag">Encyclopédie culinaire</div>
  <h1 class="hero-h">Toutes les <em>recettes</em></h1>
  <p class="hero-sub">${recipes.length} recettes du monde entier — plats, desserts, entrées et plus.</p>
</div>
<main class="body">
  <div class="grid">
    ${cards}
  </div>
</main>
<footer class="footer">
  <a href="${SITE_URL}">${SITE_NAME}</a> — Encyclopédie culinaire personnelle
</footer>
</body>
</html>`;
}

// Main
async function main() {
  console.log('Fetching recipes from Supabase...');
  const recipes = await fetchRecipes();
  console.log(`Found ${recipes.length} recipes`);

  // Crée le dossier recettes/
  const dir = path.join(process.cwd(), 'recettes');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Génère une page par recette
  let generated = 0;
  for (const recipe of recipes) {
    if (!recipe.name) continue;
    const slug = slugify(recipe.name);
    const html = generateRecipePage(recipe);
    const filePath = path.join(dir, `${slug}.html`);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✓ ${recipe.name} → recettes/${slug}.html`);
    generated++;
  }

  // Génère la page index
  const indexHtml = generateIndexPage(recipes);
  fs.writeFileSync(path.join(dir, 'index.html'), indexHtml, 'utf8');
  console.log(`✓ Index → recettes/index.html`);

  // Génère le sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/0.5">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/recettes/</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${recipes.filter(r => r.name).map(r => `  <url>
    <loc>${SITE_URL}/recettes/${slugify(r.name)}.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(process.cwd(), 'sitemap.xml'), sitemap, 'utf8');
  console.log(`✓ Sitemap mis à jour`);

  console.log(`\nDone! ${generated} pages générées.`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
