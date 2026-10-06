# CRM

A simple CRM that runs entirely in the browser: contacts, companies, a deals pipeline,
tasks with due dates, and an activity log of calls, emails, meetings and notes.

## Running it

```
npm install
npm run dev
```

## Where the data lives

Everything is saved in your browser's local storage, so it stays on that computer and browser only.
Clearing site data will erase it. Use **Export** (bottom of the sidebar) to download a backup file,
and **Import** to load one back, including on a different computer.

## What's where

- `src/store.js`: the data (load, save, delete, export/import) and the page routing (`#/contacts/<id>` style URLs)
- `src/forms.js`: the fields shown in each "New…" and "Edit" form
- `src/components/`: one file per page (Home, Contacts, Companies, Deals, Tasks), plus shared pieces in `sections.jsx` and `ui.jsx`

## Publishing

Every push to `main` builds the app and publishes it to the `gh-pages` branch
(see `.github/workflows/deploy.yml`). Live at https://andremelos92-dev.github.io/My-new-project-catalog/
