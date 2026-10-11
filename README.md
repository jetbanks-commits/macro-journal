# Macro Journal

Personal calorie & macro tracker (MyFitnessPal-style). Single user, no accounts, no ads, no server. Plain HTML/CSS/JS, no build step. Data lives in your browser's localStorage.

## Run
    cd calorie-tracker
    python3 -m http.server 8000
Open http://localhost:8000. (Opening index.html directly also works, but the offline/PWA features need http(s).)

## Install on your phone
The PWA needs HTTPS (or localhost) to install. Easiest options:
- Host the folder free on GitHub Pages / Netlify / Cloudflare Pages, open the URL on your phone, then
  - iPhone: Safari > Share > Add to Home Screen
  - Android: Chrome > menu > Install app / Add to Home screen
- Or on the same Wi-Fi, run the server and browse to http://<computer-ip>:8000 — works as a bookmark, but Chrome only offers true install over HTTPS.
Note: data is per-browser/per-origin; use Settings > Export JSON to back up or move data.

## Features
First-run goals (editable in Settings) · diary by meal with prev/next day · edit/delete entries · progress rings with live remaining · Open Food Facts search (serving or per-gram quantities) · barcode lookup by typed number · custom foods · recent foods · copy previous day · weight log with chart · JSON export/import · light/dark auto · offline app shell via service worker.

## Test
`npm i puppeteer-core` then start the server on port 8765 and `node tests/e2e.js` (needs /usr/bin/google-chrome).

## Caveats
Open Food Facts data is crowdsourced and can be wrong; search needs internet. Units are kg. Camera barcode scanning not included (type the number).
