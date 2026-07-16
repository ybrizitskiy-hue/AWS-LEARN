# AWS DevOps Quest - Cloudflare Pages clean release

Upload the files in this folder directly to the root of the GitHub repository.
Do not rename any file.

Required root files:
- index.html
- app.js
- course-data.js
- styles.css
- app.webmanifest
- icon-192.png
- icon-512.png

Cloudflare Pages settings:
- Framework preset: None
- Root directory: blank
- Build command: exit 0
- Build output directory: .

This clean release intentionally has no service worker, redirects, Wrangler config,
or deployment-check file. That removes caching and routing variables while the app
is being validated.
