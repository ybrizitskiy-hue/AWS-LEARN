# AWS DevOps Quest — Cloudflare Pages Web App

A dependency-free, installable learning web app containing 15 stages, 45 substantive lessons, 60 checkpoint questions, hands-on missions, XP, streaks, locked progression, local progress storage, export/import, responsive design, and offline caching.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy to Cloudflare Pages from Git

1. Push this folder to a GitHub or GitLab repository.
2. In Cloudflare, open **Workers & Pages** and create a Pages project from the repository.
3. Use production branch `main`.
4. Build command: `exit 0`
5. Build output directory: `.`
6. Deploy.

The app uses hash routing, so it works as a static site without a server-side router. `_headers` adds basic security headers, `_redirects` provides an SPA fallback, and the service worker enables offline use after the first visit.

## Data model

Progress is stored in browser `localStorage`. Use **Settings → Export progress** before clearing site data or changing devices. Import restores the JSON backup. This release has no login or server database.

## Content scope

The curriculum is production-shaped but does not provision AWS automatically. Each lesson teaches a concept and gives a hands-on mission to perform in your own project repository and AWS sandbox.

## Next product upgrades

- Cloud sync using Cloudflare Workers + D1
- Authentication
- Rich code editors and Terraform validators
- GitHub repository evidence checks
- Spaced repetition and mistake review
- Instructor/admin content management
