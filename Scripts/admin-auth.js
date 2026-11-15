/* El Austral Consultant: Admin sign-in gate.

   Every Admin page loads this in its <head>:
       <script src="../../Scripts/admin-auth.js"></script>
   The login and setup pages load it with data-guard="off" so they stay reachable.

   HOW IT WORKS
   - The password is never stored. Scripts/admin-credentials.js holds only a salted
     PBKDF2-SHA256 hash (600,000 rounds), created by Pages/Admin/setup-login.html.
   - A correct sign-in starts a session for this browser tab only. It ends when the
     tab closes, after 20 idle minutes, or when you select Sign out.
   - Five wrong attempts lock the form for five minutes.

   LIMITS (please read)
   This all runs in the browser, so it keeps out casual visitors but is not real
   security. Anyone who can download the page files can read them or bypass this
   check, so keep the Admin folder and Scripts/admin-credentials.js OFF the public
   website. Real protection needs a server (see the notes delivered with this file).
*/
(() => {
  'use strict';
  const script = document.currentScript;
  const guardOn = !(script && script.dataset && script.dataset.guard === 'off');
  const SESSION = 'elAustralAdminSession', MESSAGE = 'elAustralAdminMsg', FAILS = 'elAustralAdminFails';
  const IDLE_MS = 20 * 60 * 1000, MAX_FAILS = 5, LOCK_MS = 5 * 60 * 1000, ITERATIONS = 600000;
  const base = new URL('../Pages/Admin/', script.src);

  /* ---------- storage (never throws) ---------- */
  const tab = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
                set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
                del: k => { try { sessionStorage.removeItem(k); } catch (e) {} } };
  const disk = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
                 set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
                 del: k => { try { localStorage.removeItem(k); } catch (e) {} } };

  const api = {};
  api.go = url => { location.assign(String(url)); };
  const loginUrl = q => new URL('login.html' + (q || ''), base).href;

  /* ---------- encoding and hashing ---------- */
  const enc = new TextEncoder();
  api.toB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  api.fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  api.derive = async (password, salt, iterations) => {
    const key = await crypto.subtle.importKey('raw', enc.encode(String(password).normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
    return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iterations || ITERATIONS }, key, 256);
  };
  api.ITERATIONS = ITERATIONS;
  api.base = base;

  /* ---------- session ---------- */
  function readSession() {
    const raw = tab.get(SESSION);
    if (!raw) return null;
    try {
      const s = JSON.parse(raw);
      if (s && s.user && Date.now() - s.last < IDLE_MS) return s;
    } catch (e) { /* fall through */ }
    tab.del(SESSION);
    return null;
  }
  const writeSession = user => tab.set(SESSION, JSON.stringify({ user, last: Date.now() }));
  api.session = readSession;
  api.signOut = () => { tab.del(SESSION); api.go(loginUrl()); };

  /* A page name that is safe to return to after signing in */
  api.safeNext = next => /^[A-Za-z0-9_-]+\.html(\?[A-Za-z0-9_=&.-]*)?$/.test(next || '') ? new URL(next, base).href : new URL('index.html', base).href;

  /* ---------- lockout after repeated failures ---------- */
  function lockInfo() {
    try {
      const f = JSON.parse(disk.get(FAILS) || '{}');
      if (f.until && f.until > Date.now()) return { locked: true, minutes: Math.ceil((f.until - Date.now()) / 60000) };
    } catch (e) { /* ignore */ }
    return { locked: false };
  }
  function recordFailure() {
    let f = {};
    try { f = JSON.parse(disk.get(FAILS) || '{}'); } catch (e) { f = {}; }
    f.n = (f.until && f.until <= Date.now() ? 0 : (f.n || 0)) + 1;
    if (f.n >= MAX_FAILS) { f.until = Date.now() + LOCK_MS; f.n = 0; }
    disk.set(FAILS, JSON.stringify(f));
  }

  /* ---------- sign in ---------- */
  api.login = async (user, password) => {
    const cfg = window.ADMIN_AUTH;
    if (!cfg || !cfg.hash || !cfg.salt) return { ok: false, code: 'nosetup', message: 'No login has been set up yet.' };
    if (!(window.crypto && crypto.subtle)) {
      return { ok: false, code: 'nocrypto', message: 'This browser cannot check passwords here. Open the page over https or from localhost.' };
    }
    const lock = lockInfo();
    if (lock.locked) return { ok: false, code: 'locked', message: 'Too many wrong attempts. Try again in ' + lock.minutes + (lock.minutes === 1 ? ' minute.' : ' minutes.') };
    let match = false;
    try {
      const got = new Uint8Array(await api.derive(password, api.fromB64(cfg.salt), cfg.iterations));
      const want = api.fromB64(cfg.hash);
      let diff = got.length ^ want.length;                       // compare every byte, no early exit
      for (let i = 0; i < got.length; i++) diff |= got[i] ^ (want[i] || 0);
      const sameUser = String(user).trim().toLowerCase() === String(cfg.user).trim().toLowerCase();
      match = diff === 0 && sameUser;
    } catch (e) {
      return { ok: false, code: 'error', message: 'Could not check the password: ' + e.message };
    }
    if (!match) {
      recordFailure();
      const after = lockInfo();
      return { ok: false, code: 'wrong', message: after.locked ? 'Too many wrong attempts. Try again in ' + after.minutes + ' minutes.' : 'Incorrect username or password.' };
    }
    disk.del(FAILS);
    writeSession(cfg.user);
    return { ok: true, user: cfg.user };
  };

  window.ElAustralAuth = api;
  if (!guardOn) return;

  /* ---------- the gate ---------- */
  const root = document.documentElement;
  root.style.visibility = 'hidden';                              // nothing shows until the session is confirmed

  function expire() {
    tab.del(SESSION);
    tab.set(MESSAGE, 'You were signed out after 20 minutes of inactivity.');
    api.go(loginUrl());
  }
  function check() {
    const s = readSession();
    if (s) return s;
    const here = decodeURIComponent(location.pathname.split('/').pop() || '') + location.search;
    api.go(loginUrl('?next=' + encodeURIComponent(here)));
    return null;
  }

  const session = check();
  if (!session) return;
  root.style.visibility = '';

  let lastTouch = 0;
  const touch = () => {
    const t = Date.now();
    if (t - lastTouch < 15000) return;
    lastTouch = t;
    const s = readSession();
    if (s) writeSession(s.user); else expire();
  };
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(ev => window.addEventListener(ev, touch, { passive: true }));
  setInterval(() => { if (!readSession()) expire(); }, 30000);
  window.addEventListener('pageshow', e => { if (e.persisted && !readSession()) { root.style.visibility = 'hidden'; check(); } });

  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = '.nav-signout{padding:12px 0;border:0;border-bottom:3px solid transparent;background:none;color:#28151d;font:inherit;font-size:17px;cursor:pointer}' +
      '.nav-signout:hover,.nav-signout:focus-visible{color:#78182e;border-bottom-color:#78182e;outline:none}';
    document.head.appendChild(style);
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    const admin = document.createElement('a');
    admin.className = 'nav-admin';
    admin.href = new URL('index.html', base).href;
    admin.textContent = 'Admin';
    const out = document.createElement('button');
    out.type = 'button';
    out.className = 'nav-signout';
    out.textContent = 'Sign out';
    out.title = 'Signed in as ' + session.user;
    out.addEventListener('click', api.signOut);
    nav.append(admin, out);
  });
})();
