// El Austral testimonials connector (Cloudflare Worker, free plan)
// Receives a testimonial from contact_us.html and appends it to data/testimonials.json in the GitHub repo.
//
// Settings (Cloudflare dashboard > Worker > Settings > Variables):
//   GITHUB_TOKEN   (secret)  fine-grained token with "Contents: Read and write" on this one repo only
//   GITHUB_REPO              e.g.  your-username/el-austral-standby
//   GITHUB_BRANCH            e.g.  main
//   FILE_PATH                data/testimonials.json
//   ALLOWED_ORIGIN           e.g.  https://your-username.github.io

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    const reply = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);

    let body;
    try { body = await request.json(); } catch { return reply({ error: "Bad request" }, 400); }

    // Spam trap: real people never fill this hidden field
    if (body.website) return reply({ ok: true });

    const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000B-\u001F]/g, "").trim().slice(0, max);
    const first = clean(body.first_name, 40);
    const last = clean(body.last_name, 40);
    const year = clean(body.service_year, 4);
    const comment = clean(body.comment, 3000);
    const thisYear = new Date().getUTCFullYear();

    if (!first || !last || comment.length < 5 || !/^\d{4}$/.test(year) || +year < 1995 || +year > thisYear) {
      return reply({ error: "Missing or invalid fields" }, 400);
    }

    const entry = {
      id: crypto.randomUUID(),
      first_name: first,
      last_initial: last[0].toUpperCase(),
      service_year: year,
      comment,
      submitted: new Date().toISOString().slice(0, 10),
      reply: "",
    };

    const api = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${env.FILE_PATH}`;
    const gh = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "el-austral-testimonials",
    };

    // Retry a few times in case two people submit at the same moment
    for (let attempt = 0; attempt < 3; attempt++) {
      const getRes = await fetch(`${api}?ref=${env.GITHUB_BRANCH}`, { headers: gh });
      if (!getRes.ok) return reply({ error: "Could not read testimonials file" }, 502);
      const file = await getRes.json();

      const list = JSON.parse(fromBase64(file.content));
      list.push(entry);

      const putRes = await fetch(api, {
        method: "PUT",
        headers: { ...gh, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `New testimonial from ${entry.first_name} ${entry.last_initial}.`,
          content: toBase64(JSON.stringify(list, null, 2) + "\n"),
          sha: file.sha,
          branch: env.GITHUB_BRANCH,
        }),
      });
      if (putRes.ok) return reply({ ok: true });
      if (putRes.status !== 409 && putRes.status !== 422) break;
    }
    return reply({ error: "Could not save testimonial" }, 502);
  },
};

function fromBase64(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}
function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(bin);
}
