# AWS DevOps Quest - Cloudflare Pages fixed package

## Direct Upload
Upload the ZIP named `AWS_DevOps_Quest_CF_Pages_FIXED_ROOT.zip` directly in Cloudflare Pages.
The ZIP has `index.html` at its root. Do not put the files inside another folder before uploading.

## Git integration
Commit these files at the repository root. Cloudflare Pages settings:

- Framework preset: None
- Build command: `exit 0` (or leave blank)
- Build output directory: `.`
- Root directory: leave blank

After redeploying, open `/index.html` once. Then hard-refresh the root page.
