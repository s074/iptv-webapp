# IPTV WebApp

A modern [React](https://react.dev/) SPA webapp that faciliates interacting with any Xtream Codes API backend.
Also supports loading a M3u/M3u8 playlist from a url or a file.

See deployed webapp here:

http://tv.fermi.win/ (**recommended**)

https://iptv-webapp.pages.dev/

> [!NOTE]  
> This application does not provide any data or media, and only displays data from the user provided Xtream Codes API url, or M3u8 playlist

## Goals

- Use redux + local storage to minimize API calls and make search blazing fast
- Play browser-compatible media in the browser
- Easy to use interface for searching, browsing, and viewing media on all screen sizes
- Compatible with any Xtream Codes API backend or M3u/M3u8 playlist
- No additional proxy server needed, all application logic runs entirely on the browser and interacts directly with Xtream Codes API

## Building
You will need to install Node.js

After that, install the package dependencies and build:

1. `npm install`
2. `npm run build`

### Scripts

- `npm run dev`/`start` - start dev server and open browser
- `npm run build` - build for production
- `npm run preview` - locally preview production build
- `npm run test` - launch test runner

## Self-hosting

This is a static single-page app, `npm run build` emits plain files into
`build/` (`index.html` + assets) with no server-side code. Serve that
directory from any static web server (nginx, Caddy, Apache, `python -m
http.server`, GitHub Pages, Cloudflare Pages, …). No proxy or backend is required: all logic
runs in the browser and talks directly to your Xtream Codes API or M3u playlist.

**Serve it over plain HTTP, not HTTPS.** Xtream API backends are almost
always HTTP-only, and browsers block HTTPS pages from calling HTTP APIs
(mixed-content blocking) , an HTTPS-hosted copy cannot reach an HTTP-only
backend at all. If you must use HTTPS, your URL must also be
HTTPS. Client-side routing means unknown paths should rewrite to
`index.html` (e.g. nginx `try_files $uri /index.html`).