# Manual Catalog

Type a model number and jump straight to the page of the manual it's on.

## Adding manuals

1. Put each PDF in `public/manuals/<Company>/`, for example `public/manuals/Carrier/30RB Product Data.pdf`.
2. Run `npm run dev` to try it on your computer. The search index is rebuilt automatically.
3. Commit and push.

## How it works

`scripts/build-index.mjs` extracts the text of every page of every PDF and saves it as
`public/manuals-index.json` (runs automatically before `npm run dev` and `npm run build`).
The search ignores spaces, dashes and case, so `30rb120` finds `30RB-120`, and exact matches are listed first.
Clicking a result (or pressing Enter) opens the PDF at that page (`file.pdf#page=N`).

Note: scanned PDFs (pictures of pages, no selectable text) can't be searched.
