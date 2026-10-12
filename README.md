# Sahaay - Access for everyone
An accessibility platform for jobs, healthcare, sign-language learning and community. BCA final-year project (Project Based Learning BCA30050), MIT WPU. Group 04: Harsha Dhage, Zaara Anam, Hussain Mohammad. Mentor: Prof. Suryakant Karande.

This is a **static website**: it runs entirely in the browser and is hosted free on **GitHub Pages**. There is no server to start.

## Publish on GitHub Pages
1. **Create a repository** on github.com (for example `Sahaay-Website`). Leave it empty: no README, no .gitignore.
2. **Push the project** from this folder:
   ```
   git init
   git add .
   git commit -m "Sahaay on GitHub Pages"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/Sahaay-Website.git
   git push -u origin main
   ```
3. **Enable GitHub Pages:** repository **Settings > Pages > Build and deployment > Source: GitHub Actions**.
4. **Wait about a minute.** Open the **Actions** tab; when "Deploy to GitHub Pages" turns green, your site is live at
   `https://YOUR-NAME.github.io/Sahaay-Website/` (the same link is shown under Settings > Pages).

If the first run finished before you changed the Source setting, open Actions > Deploy to GitHub Pages > **Run workflow**.

*Alternative without Actions:* Settings > Pages > Source: **Deploy from a branch**, branch `main`, folder `/ (root)`. This also works (`.nojekyll` is included) but publishes the `legacy-flask-backend/` folder too.

## Update the website later
Edit the files, then:
```
git add .
git commit -m "Describe your change"
git push
```
GitHub redeploys automatically in about a minute. Hard-refresh (Ctrl+Shift+R) to see the change.

## Try it on your computer
Double-click `index.html`, or for a closer match to GitHub Pages run `python -m http.server 8000` in this folder and open http://localhost:8000. Account creation needs a secure context, which both `file://` in most browsers and `localhost` provide.

Demo logins: user@demo.com / user123, employer@demo.com / employer123, doctor@demo.com / doctor123, admin@sahaay.dev / admin123

## How data works (read this before a demo)
GitHub Pages can only serve files, so the Flask server and PostgreSQL database were replaced by `js/store.js`, which keeps the same `/api/...` routes but runs in the browser.

| Feature | Before | Now |
|---|---|---|
| Jobs, doctors, lessons, map places | Database via Flask | Sample data in `js/seed.js` |
| Register / login | Flask session cookie, server password check | Account saved in this browser; password stored only as a salted PBKDF2 hash |
| Save/apply to jobs, appointments, community posts, likes, comments, reports | Database tables | `localStorage` in this browser |
| Learning progress, stars, daily streak | Database tables | `localStorage` in this browser |
| Employer, doctor and admin dashboards | Flask role checks | Same screens; role checks run in `js/store.js` |
| Accessibility toolbar, map, sign videos, assistant | Browser | Unchanged |

What this means:
- Data is **per browser**. A post written on your laptop is not visible on a phone or to other visitors. Several accounts in the same browser do see each other's data (a user applies, the employer in that browser sees the applicant).
- This is a **demo-grade login, not real security**. With no server, nobody can truly protect data from the person using the browser. Do not enter real passwords or private medical or personal details.
- "Reset demo data" (on the Login page) clears everything saved in the browser and restores the sample data.
- No secrets are stored in the repository. The demo passwords above are only present as hashes.

To make data shared between all visitors you need a hosted database. The smallest change is a free hosted service such as Supabase or Firebase, called from `js/store.js` with its public (anon) key and row-level security rules, while the website itself stays on GitHub Pages. Only `store.js` would change.

## What each account type sees (Profile page)
- User: applications with status, saved jobs, appointments, learning streak
- Employer: post jobs (an admin approves them), see applicants, change each applicant's status
- Doctor: edit the clinic profile shown in the directory, confirm or decline appointment requests
- Admin: statistics, approve or reject jobs, delete reported posts, see all users

## Sign Language Centre
Four tabs: Learning path (units, chapters and stars with lessons and quizzes built from the videos), Practice (flashcards and a daily quiz), Dictionary and Achievements (daily streak and badges). Videos are in `assets/signs/`. Alphabet videos carry the ISLRTC watermark: give credit and check the licence before publishing.

## Folders
    index.html, css/, assets/    the website
    js/                          one JavaScript file per module
    js/store.js                  browser-side replacement for the Flask API and database
    js/seed.js                   sample jobs, doctors, lessons, posts, map places
    .github/workflows/pages.yml  deploys the site to GitHub Pages
    legacy-flask-backend/        the original Flask/PostgreSQL version (not used by the website)
    VIVA.md, CONTRIBUTING.md     project notes
