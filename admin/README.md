# Content editor (/admin)

`/admin` is a private page for editing the site's content without touching code:
Homepage Hero, Hero Showcase (3D models / images / videos), Category Tile Images,
Portfolio, Games, Reviews, Team, Sculpt to Final, Breakdowns, Clients, Blog Posts,
Careers Images and Settings (email, availability text, Google Form link for applications).

The editor is **Sveltia CMS** (loaded by `admin/index.html`, configured by `admin/config.yml`).

## Logging in

1. Open https://brothersinteractive.in/admin/
2. Click **Sign In Using Access Token** and paste the admin key (a GitHub fine-grained
   personal access token, see below). The browser remembers it.
   Don't use "Sign In with GitHub": it needs a login helper this site doesn't have.

**Making a key** (new computer, lost key, or the old one was exposed):
GitHub → profile picture → **Settings → Developer settings → Personal access tokens →
Fine-grained tokens → Generate new token**. Name it `Website admin`, Expiration **No expiration**,
Repository access **Only select repositories → brothers-interactive**, Permissions
**Contents: Read and write**. Copy it once, keep it private, and delete any old key you no longer use.

## Saving

**Save** writes the change straight to the `main` branch on GitHub. GitHub Pages republishes the
site within 1–2 minutes; press Ctrl + F5 on the site to see it. Every save is a Git commit, so any
mistake can be rolled back from the GitHub history.

## Adding a new portfolio piece

Portfolio → Portfolio Pieces → **Add Piece** at the bottom of the list. Fill in Title, Category,
optional "Also show in", a unique **ID** (no spaces, e.g. `orc-warrior-01`), Main Image, optional
Additional Images, Description and Tags. Leave width and height at 0. Drag the piece to the top of
the list to show it first, then **Save**.

## Good to know

- Upload images as JPG or WebP, about 1600 px wide (PNG only for transparent cut-outs).
  File names in lowercase with dashes, no spaces. 3D models as compressed .glb.
- New portfolio images have no small thumbnail copy yet, so the site uses the full image instead.
  Nothing breaks, it's just a little heavier.
- Editing files on a computer instead (code or design changes)? First open GitHub Desktop and click
  **Fetch origin**, then **Pull origin**, so edits made here in /admin are not overwritten.
- On localhost, Sveltia offers **Work with Local Repository** (Chrome/Edge): pick the project folder to
  edit the local files directly, with no login.
