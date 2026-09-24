import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const APP_URL = 'https://getstelli.base44.app';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&h=630&q=80';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Serialises a value for a <script> block. JSON.stringify alone is not enough:
 * it leaves `</script>` intact, which closes the element and lets anything
 * after it run as markup.
 */
function jsonForScript(value = '') {
  return JSON.stringify(String(value))
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

// A profile link is either a record ID or a slug — nothing else belongs in the
// redirect target.
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Share endpoint for curator profiles.
 *
 * Social platforms never run JavaScript, so a client-rendered profile page can
 * never carry its own preview tags. This returns a tiny HTML document with the
 * curator's tags for the crawler, and forwards real visitors straight on to the
 * profile itself.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let id = new URL(req.url).searchParams.get('id') || '';
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id || '';
      } catch {
        id = '';
      }
    }

    // Anything that is not a plain ID or slug is dropped rather than echoed.
    if (id && !ID_PATTERN.test(id)) {
      console.warn('shareProfile rejected malformed id');
      id = '';
    }

    let lensman = null;
    if (id) {
      try {
        lensman = await base44.asServiceRole.entities.Lensman.get(id);
      } catch (error) {
        console.error('shareProfile lookup failed for', id, '-', error.message);
      }
    }

    const name = lensman?.display_name || lensman?.full_name || 'A Stelli creator';
    const firstName = String(name).trim().split(' ')[0];
    const title = `${name} on Stelli`;
    const description = (lensman?.one_liner || '').trim() || `Book ${firstName} on Stelli.`;

    const images = (lensman?.portfolio_images || []).filter(Boolean);
    const cover =
      (lensman?.cover_image && images.includes(lensman.cover_image) ? lensman.cover_image : '') ||
      (lensman?.pinned_images || [])[0] ||
      images[0] ||
      DEFAULT_IMAGE;

    const target = `${APP_URL}/creators/${id}`;

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="profile" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(cover)}" />
<meta property="og:url" content="${escapeHtml(target)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(cover)}" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(target)}" />
<style>body{margin:0;background:#0a1226;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh}</style>
</head>
<body>
<p>Taking you to <a href="${escapeHtml(target)}" style="color:#c4f82a">${escapeHtml(name)} on Stelli</a>…</p>
<script>window.location.replace(${jsonForScript(target)});</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('shareProfile error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}