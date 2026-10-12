# Viva notes
**One line:** Sahaay puts jobs, healthcare, sign language, an accessibility map and a community in one accessible website.

**Architecture (3 tiers):** browser (HTML/CSS/JS) -> api('/api/...') in js/store.js -> localStorage. (The original Flask + SQLAlchemy + PostgreSQL version is kept in `legacy-flask-backend/`.)

**Demo order (5 minutes)**
1. Home, then the accessibility toolbar: font size, dark mode, high contrast, read aloud.
2. Register a new user, log out, log in again (password is hashed, session cookie).
3. Jobs: search, save, apply. Profile shows saved jobs and applications.
4. Healthcare: filter and book an appointment.
5. Community: post, like, comment, report.
6. Sign Language: play a chapter in the Learning path (watch, then quiz), open Practice flashcards, then show Achievements and the streak.
6b. Log in as employer, doctor and admin (demo accounts) to show each dashboard: post a job -> admin approves -> user applies -> employer shortlists -> user sees the status.
7. Map: tick Ramp + Elevator, click a pin, use Near me, zoom.
8. Show the live GitHub Pages site (and, if asked, the original Flask API tests in `legacy-flask-backend/tests`).

**Likely questions**
- Where is data stored? In the hosted version: the browser's localStorage, with the same 14-table structure (see `legacy-flask-backend/backend/schema.sql`). The original Flask version used SQLite/PostgreSQL.
- Is the accessibility info private? Yes. Only /api/me returns it, to the logged-in owner. A test checks that posts never expose it.
- How is the password stored? Hashed with Werkzeug, never as plain text.
- What is not real yet? Sign-to-Text is simulated, the assistant is keyword-based, the map is a hand-drawn SVG with real coordinates. Each has a //FUTURE marker.
- Why no React? Plain HTML/CSS/JS keeps every line readable. React + Vite is the planned upgrade.
