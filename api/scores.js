// Scoreboard API for Masi's Zim Trivia.
// GET  /api/scores                    -> { week: [...], all: [...] }  (top 10 each)
// POST /api/scores { name, score }    -> same boards plus the player's weekly/all-time rank
// Storage: Upstash Redis sorted sets via its REST API (no npm packages needed).
// Each nickname keeps its best score. Weekly boards reset every Monday 00:00 Harare time.

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
// Keep test scores from preview/dev deployments off the real boards.
const NS = process.env.VERCEL_ENV === 'production' ? 'lb' : 'lb-dev';

const TOP = 10;
// Highest score the game can produce: 50 right answers in a row (100 + 20 per streak)
// plus a full-clock time bonus and a perfect-stop bonus at all 10 stops.
const MAX_SCORE = 36000;
// Deliberately short to avoid blocking real names (e.g. Dickson); remove anything else by hand.
const BLOCKED = /(fuck|shit|cunt|bitch|nigg|pussy|whore|porn|http|www\.|\.com)/i;

async function redis(commands) {
  const r = await fetch(URL_ + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  const out = await r.json();
  return out.map((x) => {
    if (x.error) throw new Error(x.error);
    return x.result;
  });
}

// ISO week in Harare time (UTC+2, no daylight saving), e.g. "2026-W39"
function weekKey(now = new Date()) {
  const d = new Date(now.getTime() + 2 * 3600e3);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day + 3); // Thursday of this week decides the year
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d - Date.UTC(year, 0, 1)) / 864e5 + 1) / 7);
  return year + '-W' + String(week).padStart(2, '0');
}

function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 20) return null;
  if (!/^[\p{L}\p{N} .'\-_]+$/u.test(name)) return null;
  if (BLOCKED.test(name.replace(/[\s.'\-_]/g, ''))) return null;
  return name;
}

function toList(flat) {
  const list = [];
  for (let i = 0; i < flat.length; i += 2) list.push({ name: flat[i], score: Number(flat[i + 1]) });
  return list;
}

async function boards(wk) {
  const [week, all] = await redis([
    ['ZRANGE', wk, 0, TOP - 1, 'REV', 'WITHSCORES'],
    ['ZRANGE', NS + ':all', 0, TOP - 1, 'REV', 'WITHSCORES'],
  ]);
  return { week: toList(week), all: toList(all) };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'Scoreboard not configured' });
  const wk = NS + ':week:' + weekKey();

  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=15, stale-while-revalidate=60');
      return res.status(200).json(await boards(wk));
    }

    if (req.method === 'POST') {
      res.setHeader('Cache-Control', 'no-store');
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      const name = cleanName(body && body.name);
      const score = Number(body && body.score);
      if (!name) return res.status(400).json({ error: 'Please use 2–20 letters or numbers for your nickname.' });
      if (!Number.isInteger(score) || score < 1 || score > MAX_SCORE) return res.status(400).json({ error: 'That score doesn’t look right.' });

      // Rate limit: 5 submissions per IP per 10 minutes.
      const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
      const rl = NS + ':rl:' + ip;
      const [count] = await redis([['INCR', rl], ['EXPIRE', rl, 600, 'NX']]);
      if (count > 5) return res.status(429).json({ error: 'Too many scores sent — try again in a few minutes.' });

      // GT: only replace a nickname's score when the new one is higher.
      const [, , , weekRank, allRank] = await redis([
        ['ZADD', wk, 'GT', score, name],
        ['EXPIRE', wk, 60 * 60 * 24 * 60],
        ['ZADD', NS + ':all', 'GT', score, name],
        ['ZREVRANK', wk, name],
        ['ZREVRANK', NS + ':all', name],
      ]);
      const b = await boards(wk);
      return res.status(200).json({ ...b, name, weekRank: weekRank + 1, allRank: allRank + 1 });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Scoreboard is having a moment — try again soon.' });
  }
};
