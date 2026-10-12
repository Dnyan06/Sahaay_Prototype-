/* Sahaay data layer (replaces the Flask API + database for GitHub Pages).
 *
 * api(path, method, body) keeps the exact same signature and the same /api/... routes the
 * front end already used, but everything now runs in the browser:
 *   - sample data comes from js/seed.js
 *   - everything users create (accounts, applications, posts, progress...) is kept in localStorage
 *   - passwords are never stored in plain text (PBKDF2-SHA256 + random salt via the Web Crypto API)
 *
 * IMPORTANT: this data lives in ONE browser only. It is not shared between devices or visitors,
 * and it is not real server-side security. See README.md ("How data works").
 */
(function () {
  var KEY = 'sahaay_db_v1', SESSION = 'sahaay_session', SEED = window.SAHAAY_SEED;
  var mem = null;   // in-memory copy, used if the browser blocks localStorage

  function clone(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }
  function readDb() { try { var s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) {} return mem; }
  function writeDb(db) { mem = db; try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  function getSession() { try { return JSON.parse(localStorage.getItem(SESSION)); } catch (e) { return null; } }
  function setSession(id) { try { if (id == null) localStorage.removeItem(SESSION); else localStorage.setItem(SESSION, JSON.stringify(id)); } catch (e) {} }

  function today() { return new Date().toISOString().slice(0, 10); }
  function istDay(offset) {   // today's date in Indian time
    return new Date(Date.now() + 330 * 60000 - (offset || 0) * 864e5).toISOString().slice(0, 10);
  }

  /* ---------- first-run database ---------- */
  function freshDb() {
    var db = { v: 1, users: [], jobs: [], doctors: [], posts: [], saved: [], apps: [], appts: [], learned: [], chapters: [], days: [], next: {} };
    SEED.demoUsers.forEach(function (u) {
      db.users.push({ id: u.id, name: u.name, email: u.email, salt: u.salt, hash: u.hash, role: u.role,
                      skills: '', loc: '', dis: '', phone: '', education: '', worktype: 'Any' });
    });
    SEED.jobs.forEach(function (j) { var x = clone(j); x.created = '2026-09-03'; x.status = 'approved'; x.owner_id = null; db.jobs.push(x); });
    SEED.doctors.forEach(function (d) { var x = clone(d); x.user_id = null; db.doctors.push(x); });
    SEED.posts.forEach(function (p) {
      db.posts.push({ id: p.id, cat: p.cat, by: p.by, title: p.title, body: p.body, base_likes: p.likes, created: '2026-09-03',
                      user_id: null, comments: p.comments.map(function (t, i) { return { id: i + 1, user_id: null, text: t }; }), likes: [], reports: [] });
    });
    // link the demo accounts so every dashboard has something to show (same as the old seed())
    [1, 3, 4].forEach(function (id) { db.jobs.forEach(function (j) { if (j.id == id) j.owner_id = 2; }); });
    db.doctors[0].user_id = 3;
    db.apps.push({ user_id: 1, job_id: 1, status: 'Under review' });
    db.appts.push({ id: 1, user_id: 1, doctor_id: db.doctors[0].id, date: '10/10/2026', status: 'Requested' });
    db.next = { users: 5, jobs: 100, doctors: 100, posts: 100, appts: 2, comments: 1000 };
    return db;
  }
  var ready = Promise.resolve().then(function () {
    var db = readDb();
    if (!db || db.v !== 1) writeDb(freshDb());
  });

  /* ---------- password hashing (Web Crypto) ---------- */
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function pbkdf2(pw, saltHex) {
    if (!window.crypto || !crypto.subtle) return Promise.reject(httpErr(500, 'This browser cannot secure passwords here. Open the site over https://.'));
    var salt = new Uint8Array(saltHex.match(/../g).map(function (h) { return parseInt(h, 16); }));
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, k, 256); })
      .then(hex);
  }
  function newSalt() { return hex(crypto.getRandomValues(new Uint8Array(16))); }

  /* ---------- helpers ---------- */
  function httpErr(code, msg) { var e = new Error(msg); e.status = code; return e; }
  function find(list, pred) { for (var i = 0; i < list.length; i++) if (pred(list[i])) return list[i]; return null; }
  function userJson(u) {
    return { id: u.id, name: u.name, email: u.email, role: u.role, skills: u.skills, loc: u.loc, dis: u.dis,
             phone: u.phone, education: u.education, worktype: u.worktype };
  }
  function pub(o) { var r = clone(o); delete r.owner_id; delete r.user_id; return r; }
  function me(db) { var id = getSession(); return id == null ? null : find(db.users, function (u) { return u.id === id; }); }
  function need(db) { var u = me(db); if (!u) throw httpErr(401, 'Please log in first.'); return u; }
  function needRole(db) {
    var u = need(db), roles = Array.prototype.slice.call(arguments, 1);
    if (roles.indexOf(u.role) < 0) throw httpErr(403, 'This page is not available for your account type.');
    return u;
  }
  function getOr404(list, id, what) { var x = find(list, function (o) { return o.id === id; }); if (!x) throw httpErr(404, (what || 'Item') + ' not found.'); return x; }
  function str(v, n) { return (v == null ? '' : String(v)).trim().slice(0, n); }
  function postJson(p) {   // never includes private user data
    return { id: p.id, cat: p.cat, by: p.by, created: p.created, title: p.title, body: p.body,
             likes: p.base_likes + p.likes.length, comments: p.comments.map(function (c) { return c.text; }) };
  }
  function mine(db, u) {
    var days = db.days.filter(function (d) { return d.user_id === u.id; }).map(function (d) { return d.day; });
    var streak = 0, k = days.indexOf(istDay()) >= 0 ? 0 : 1;
    while (days.indexOf(istDay(k)) >= 0) { streak++; k++; }
    var chapters = {};
    db.chapters.forEach(function (c) { if (c.user_id === u.id) chapters[c.chapter] = { score: c.score, stars: c.stars }; });
    return {
      saved: db.saved.filter(function (s) { return s.user_id === u.id; }).map(function (s) { return s.job_id; }),
      apps: db.apps.filter(function (a) { return a.user_id === u.id; }).map(function (a) { return { job_id: a.job_id, status: a.status }; }),
      learned: db.learned.filter(function (p) { return p.user_id === u.id; }).map(function (p) { return p.sign_id; }),
      chapters: chapters,
      appts: db.appts.filter(function (a) { return a.user_id === u.id; }).map(function (a) {
        var d = find(db.doctors, function (x) { return x.id === a.doctor_id; });
        return { doctor: d ? d.name : 'Doctor', date: a.date, status: a.status };
      }),
      days: days, streak: streak, today: istDay()
    };
  }
  function myDoctor(db, u) {
    var d = find(db.doctors, function (x) { return x.user_id === u.id; });
    if (!d) { d = { id: db.next.doctors++, name: u.name, spec: 'General Medicine', city: u.loc || '', place: '', svc: '', user_id: u.id }; db.doctors.push(d); }
    return d;
  }
  var STATUSES = ['Submitted', 'Under review', 'Shortlisted', 'Selected', 'Rejected'];
  var LIMITS = { phone: 30, skills: 200, loc: 100, education: 100, worktype: 30, dis: 200 };

  /* ---------- routes: [method, regex, handler(db, params, body)] ---------- */
  // handlers return {data, save}; async ones (register/login) are handled separately below
  var routes = [
    ['GET', /^\/api\/me$/, function (db) { var u = me(db); return { data: { user: u ? userJson(u) : null } }; }],
    ['GET', /^\/api\/my$/, function (db) { return { data: mine(db, need(db)) }; }],
    ['POST', /^\/api\/logout$/, function () { setSession(null); return { data: { ok: true } }; }],
    ['PUT', /^\/api\/me$/, function (db, p, b) {
      var u = need(db);
      if (str(b.name, 100)) u.name = str(b.name, 100);
      Object.keys(LIMITS).forEach(function (f) { if (f in b) u[f] = str(b[f], LIMITS[f]); });
      return { data: { user: userJson(u) }, save: true };
    }],

    ['GET', /^\/api\/jobs$/, function (db) { return { data: db.jobs.filter(function (j) { return j.status === 'approved'; }).map(pub) }; }],
    ['POST', /^\/api\/jobs\/(\d+)\/save$/, function (db, p) {
      var u = needRole(db, 'User'), id = +p[0]; getOr404(db.jobs, id, 'Job');
      var i = db.saved.findIndex(function (s) { return s.user_id === u.id && s.job_id === id; });
      if (i >= 0) db.saved.splice(i, 1); else db.saved.push({ user_id: u.id, job_id: id });
      return { data: { mine: mine(db, u) }, save: true };
    }],
    ['POST', /^\/api\/jobs\/(\d+)\/apply$/, function (db, p) {
      var u = needRole(db, 'User'), id = +p[0]; getOr404(db.jobs, id, 'Job');
      if (find(db.apps, function (a) { return a.user_id === u.id && a.job_id === id; })) throw httpErr(409, 'You already applied to this job.');
      db.apps.push({ user_id: u.id, job_id: id, status: 'Submitted' });
      return { data: { mine: mine(db, u) }, save: true };
    }],

    ['GET', /^\/api\/doctors$/, function (db) { return { data: db.doctors.filter(function (d) { return d.svc !== ''; }).map(pub) }; }],
    ['POST', /^\/api\/doctors\/(\d+)\/book$/, function (db, p, b) {
      var u = needRole(db, 'User'), id = +p[0]; getOr404(db.doctors, id, 'Doctor');
      var date = str(b.date, 30); if (!date) throw httpErr(400, 'Please enter a date.');
      db.appts.push({ id: db.next.appts++, user_id: u.id, doctor_id: id, date: date, status: 'Requested' });
      return { data: { ok: true }, save: true };
    }],

    ['GET', /^\/api\/posts$/, function (db) { return { data: db.posts.slice().sort(function (a, b) { return b.id - a.id; }).map(postJson) }; }],
    ['POST', /^\/api\/posts$/, function (db, p, b) {
      var u = need(db);
      if (!str(b.title, 200) || !str(b.body, 5000)) throw httpErr(400, 'A post needs a title and some text.');
      var post = { id: db.next.posts++, cat: str(b.cat, 30) || 'General', by: u.name, title: str(b.title, 200), body: str(b.body, 5000),
                   base_likes: 0, created: today(), user_id: u.id, comments: [], likes: [], reports: [] };
      db.posts.push(post);
      return { data: postJson(post), save: true };
    }],
    ['POST', /^\/api\/posts\/(\d+)\/like$/, function (db, p) {
      var u = need(db), post = getOr404(db.posts, +p[0], 'Post'), i = post.likes.indexOf(u.id);
      if (i >= 0) post.likes.splice(i, 1); else post.likes.push(u.id);
      return { data: { ok: true }, save: true };
    }],
    ['POST', /^\/api\/posts\/(\d+)\/comment$/, function (db, p, b) {
      var u = need(db), post = getOr404(db.posts, +p[0], 'Post'), t = str(b.text, 1000);
      if (!t) throw httpErr(400, 'Comment cannot be empty.');
      post.comments.push({ id: db.next.comments++, user_id: u.id, text: t });
      return { data: { ok: true }, save: true };
    }],
    ['POST', /^\/api\/posts\/(\d+)\/report$/, function (db, p) {
      var u = need(db), post = getOr404(db.posts, +p[0], 'Post');
      post.reports.push(u.id);
      return { data: { ok: true }, save: true };
    }],

    ['GET', /^\/api\/signs$/, function () { return { data: clone(SEED.signs) }; }],
    ['GET', /^\/api\/places$/, function () { return { data: clone(SEED.places) }; }],
    ['POST', /^\/api\/signs\/(\d+)\/learn$/, function (db, p) {
      var u = need(db), id = +p[0]; getOr404(SEED.signs, id, 'Sign');
      if (!find(db.learned, function (x) { return x.user_id === u.id && x.sign_id === id; })) db.learned.push({ user_id: u.id, sign_id: id });
      return { data: { mine: mine(db, u) }, save: true };
    }],
    ['POST', /^\/api\/chapters\/([^\/]+)\/complete$/, function (db, p, b) {
      var u = need(db), cid = decodeURIComponent(p[0]).slice(0, 30), score = parseInt(b.score, 10);
      if (isNaN(score)) throw httpErr(400, 'A score is needed.');
      score = Math.max(0, Math.min(100, score));
      var stars = score ? Math.min(5, Math.floor((score + 19) / 20)) : 0;
      var cp = find(db.chapters, function (c) { return c.user_id === u.id && c.chapter === cid; });
      if (!cp) { cp = { user_id: u.id, chapter: cid, score: 0, stars: 0 }; db.chapters.push(cp); }
      cp.score = Math.max(cp.score, score); cp.stars = Math.max(cp.stars, stars);
      var day = istDay();
      if (!find(db.days, function (d) { return d.user_id === u.id && d.day === day; })) db.days.push({ user_id: u.id, day: day });
      (b.signs || []).forEach(function (sid) {
        if (typeof sid === 'number' && find(SEED.signs, function (s) { return s.id === sid; }) &&
            !find(db.learned, function (x) { return x.user_id === u.id && x.sign_id === sid; })) db.learned.push({ user_id: u.id, sign_id: sid });
      });
      return { data: { mine: mine(db, u) }, save: true };
    }],

    /* ----- employer ----- */
    ['POST', /^\/api\/employer\/jobs$/, function (db, p, b) {
      var u = needRole(db, 'Employer', 'Admin');
      if (!str(b.title, 200) || !str(b.company, 100)) throw httpErr(400, 'A job needs a title and a company.');
      var j = { id: db.next.jobs++, title: str(b.title, 200), company: str(b.company, 100), loc: str(b.loc, 100) || 'Remote',
                type: ['Full-Time', 'Part-Time', 'Remote', 'Hybrid'].indexOf(b.type) >= 0 ? b.type : 'Full-Time',
                pay: str(b.pay, 50), desc: str(b.desc, 2000), skills: str(b.skills, 200), created: today(),
                status: u.role === 'Admin' ? 'approved' : 'pending', owner_id: u.id };
      db.jobs.push(j);
      return { data: pub(j), save: true };
    }],
    ['GET', /^\/api\/employer\/jobs$/, function (db) {
      var u = needRole(db, 'Employer', 'Admin');
      return { data: db.jobs.filter(function (j) { return j.owner_id === u.id; }).sort(function (a, b) { return b.id - a.id; }).map(function (j) {
        var r = pub(j); r.applicants = db.apps.filter(function (a) { return a.job_id === j.id; }).length; return r; }) };
    }],
    ['GET', /^\/api\/employer\/applications$/, function (db) {
      var u = needRole(db, 'Employer', 'Admin'), out = [];   // never includes private accessibility info
      db.apps.forEach(function (a) {
        var j = find(db.jobs, function (x) { return x.id === a.job_id; });
        if (!j || j.owner_id !== u.id) return;
        var p = find(db.users, function (x) { return x.id === a.user_id; });
        if (p) out.push({ job_id: j.id, user_id: p.id, job: j.title, name: p.name, email: p.email, skills: p.skills, loc: p.loc, education: p.education, status: a.status });
      });
      return { data: out };
    }],
    ['PUT', /^\/api\/employer\/applications\/(\d+)\/(\d+)$/, function (db, p, b) {
      var u = needRole(db, 'Employer', 'Admin'), jid = +p[0], uid = +p[1], j = getOr404(db.jobs, jid, 'Job');
      if (j.owner_id !== u.id && u.role !== 'Admin') throw httpErr(403, 'This is not your job posting.');
      var a = find(db.apps, function (x) { return x.user_id === uid && x.job_id === jid; });
      if (!a) throw httpErr(404, 'Application not found.');
      if (STATUSES.indexOf(b.status) < 0) throw httpErr(400, 'Unknown status.');
      a.status = b.status;
      return { data: { ok: true }, save: true };
    }],

    /* ----- doctor ----- */
    ['GET', /^\/api\/doctor\/me$/, function (db) {
      var d = myDoctor(db, needRole(db, 'Doctor'));
      var appts = db.appts.filter(function (a) { return a.doctor_id === d.id; }).sort(function (a, b) { return b.id - a.id; }).map(function (a) {
        var pt = find(db.users, function (x) { return x.id === a.user_id; });
        return { id: a.id, patient: pt ? pt.name : 'Patient', date: a.date, status: a.status }; });
      return { data: { doctor: pub(d), appointments: appts }, save: true };
    }],
    ['PUT', /^\/api\/doctor\/me$/, function (db, p, b) {
      var d = myDoctor(db, needRole(db, 'Doctor'));
      [['name', 100], ['spec', 60], ['city', 60], ['place', 120], ['svc', 1000]].forEach(function (f) { if (f[0] in b) d[f[0]] = str(b[f[0]], f[1]); });
      return { data: { doctor: pub(d) }, save: true };
    }],
    ['PUT', /^\/api\/doctor\/appointments\/(\d+)$/, function (db, p, b) {
      var d = myDoctor(db, needRole(db, 'Doctor')), a = getOr404(db.appts, +p[0], 'Appointment');
      if (a.doctor_id !== d.id) throw httpErr(403, 'This is not your appointment.');
      if (['Confirmed', 'Declined'].indexOf(b.status) < 0) throw httpErr(400, 'Unknown status.');
      a.status = b.status;
      return { data: { ok: true }, save: true };
    }],

    /* ----- admin ----- */
    ['GET', /^\/api\/admin\/stats$/, function (db) {
      needRole(db, 'Admin');
      var n = function (list, f) { return list.filter(f).length; };
      return { data: { users: n(db.users, function (u) { return u.role === 'User'; }), employers: n(db.users, function (u) { return u.role === 'Employer'; }),
        doctors: db.doctors.length, jobs: n(db.jobs, function (j) { return j.status === 'approved'; }), pending: n(db.jobs, function (j) { return j.status === 'pending'; }),
        posts: db.posts.length, reports: db.posts.reduce(function (s, x) { return s + x.reports.length; }, 0),
        applications: db.apps.length, appointments: db.appts.length } };
    }],
    ['GET', /^\/api\/admin\/users$/, function (db) {
      needRole(db, 'Admin');
      return { data: db.users.map(function (u) { return { id: u.id, name: u.name, email: u.email, role: u.role }; }) };
    }],
    ['GET', /^\/api\/admin\/pending$/, function (db) {
      needRole(db, 'Admin');
      return { data: db.jobs.filter(function (j) { return j.status === 'pending'; }).map(function (j) {
        var o = find(db.users, function (x) { return x.id === j.owner_id; }), r = pub(j); r.by = o ? o.name : ''; return r; }) };
    }],
    ['POST', /^\/api\/admin\/jobs\/(\d+)\/(\w+)$/, function (db, p) {
      needRole(db, 'Admin'); var j = getOr404(db.jobs, +p[0], 'Job');
      if (['approve', 'reject'].indexOf(p[1]) < 0) throw httpErr(400, 'Unknown action.');
      j.status = p[1] === 'approve' ? 'approved' : 'rejected';
      return { data: { ok: true }, save: true };
    }],
    ['GET', /^\/api\/admin\/reports$/, function (db) {
      needRole(db, 'Admin');
      return { data: db.posts.filter(function (x) { return x.reports.length; }).map(function (x) {
        return { id: x.id, title: x.title, by: x.by, body: x.body, reports: x.reports.length }; }) };
    }],
    ['DELETE', /^\/api\/admin\/posts\/(\d+)$/, function (db, p) {
      needRole(db, 'Admin'); var post = getOr404(db.posts, +p[0], 'Post');
      db.posts.splice(db.posts.indexOf(post), 1);
      return { data: { ok: true }, save: true };
    }]
  ];

  /* ---------- register / login (async because of password hashing) ---------- */
  function register(db, d) {
    var name = str(d.name, 100), email = str(d.email, 120).toLowerCase(), pw = d.password || '';
    if (!name || email.indexOf('@') < 0 || pw.length < 6) throw httpErr(400, 'Enter your name, a valid email and a password of at least 6 characters.');
    if (find(db.users, function (u) { return u.email === email; })) throw httpErr(409, 'This email is already registered.');
    var role = ['User', 'Employer', 'Doctor'].indexOf(d.role) >= 0 ? d.role : 'User', salt = newSalt();
    return pbkdf2(pw, salt).then(function (hash) {
      var db2 = readDb();   // re-read: another tab may have changed it while hashing
      if (find(db2.users, function (u) { return u.email === email; })) throw httpErr(409, 'This email is already registered.');
      var u = { id: db2.next.users++, name: name, email: email, salt: salt, hash: hash, role: role, skills: str(d.skills, 200), loc: str(d.loc, 100),
                dis: str(d.dis, 200), phone: str(d.phone, 30), education: str(d.education, 100), worktype: str(d.worktype, 30) || 'Any' };
      db2.users.push(u);
      if (role === 'Doctor') db2.doctors.push({ id: db2.next.doctors++, name: name, spec: 'General Medicine', city: u.loc, place: '', svc: '', user_id: u.id });
      writeDb(db2); setSession(u.id);
      return { user: userJson(u) };
    });
  }
  function login(db, d) {
    var u = find(db.users, function (x) { return x.email === str(d.email, 120).toLowerCase(); });
    var fail = function () { throw httpErr(401, 'Wrong email or password.'); };
    if (!u) return pbkdf2(String(d.password || ''), newSalt()).then(fail);   // same timing for unknown emails
    return pbkdf2(String(d.password || ''), u.salt).then(function (h) { if (h !== u.hash) fail(); setSession(u.id); return { user: userJson(u) }; });
  }

  /* ---------- the api() function used by every page ---------- */
  window.api = function (path, method, body) {
    method = (method || 'GET').toUpperCase(); body = clone(body) || {};
    return ready.then(function () {
      var db = readDb();
      if (method === 'POST' && path === '/api/register') return register(db, body);
      if (method === 'POST' && path === '/api/login') return login(db, body);
      for (var i = 0; i < routes.length; i++) {
        var r = routes[i], m = r[0] === method && path.match(r[1]);
        if (m) { var out = r[2](db, m.slice(1), body); if (out.save) writeDb(db); return clone(out.data); }
      }
      throw httpErr(404, 'Not found.');
    });
  };

  // "Reset demo data": wipes everything stored by this site in this browser
  window.sahaayReset = function () {
    try { localStorage.removeItem(KEY); localStorage.removeItem(SESSION); localStorage.removeItem('sahaay_user'); } catch (e) {}
    mem = null; location.hash = '#home'; location.reload();
  };
})();
