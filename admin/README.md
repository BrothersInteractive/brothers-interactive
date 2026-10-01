# Content editor (/admin)

`/admin` is a private page for editing the site's content without touching code:
Homepage Hero, Hero Showcase (3D models / images / videos), Category Tile Images,
Portfolio, Games, Reviews, Team, Sculpt to Final, Breakdowns, Clients, Blog Posts,
Careers Images and Settings (email, address, Google Form link for applications...).

## How it works

- **On the live site** (https://brothersinteractive.in/admin/): click **Login with GitHub**.
  Anyone whose GitHub account has **Write** access to the repo
  `BrothersInteractive/brothers-interactive` can edit. Clicking **Publish** saves the change
  straight to the `main` branch on GitHub; Netlify republishes the site automatically,
  usually within a minute.
- **On your PC** (http://localhost:8788/admin/): run `npx decap-server` in the project
  folder first (with `BIND_HOST=::` on Windows). No login; it edits the local files, which
  you then push to GitHub as usual.

## One-time setup (needs your GitHub + Netlify accounts)

See **DEPLOY.md → "Go live on brothersinteractive.in"**, steps 3–5.

## Adding or removing an editor

GitHub → the repo → **Settings → Collaborators → Add people** → give them **Write**.
They log in to /admin with their own GitHub account. Remove them there to revoke access.

## Good to know

- Upload images as WebP or JPG around 1600–2000 px wide; 3D models as compressed .glb.
- After uploading new portfolio images, ask for thumbnails to be regenerated (the site
  falls back to the full image until then, so nothing breaks — it's just heavier).
- Every save is a Git commit, so any mistake can be rolled back from GitHub history.
