# Quotations Module — عروض الأسعار

Create, track and convert customer quotations to contracts.

## Data flow
```
UI (ui.html) ──► /api/quotations (Express)
                     │
                     ├── read/write  data/pm_quotations.json
                     │
                     └── convert → append to data/pm_contracts.json
                                    (quote.convertedContractId set)
```
The UI also mirrors to `localStorage` under key `pm_quotations` so it keeps working offline (SRV_PROXY pattern).

## Data shape
See `model.js`. Each quote: `{ id, number, status, customer, company, items[], vat_rate, totals, terms, notes, projectId, createdAt, updatedAt }`.

**Totals** are always derived by `Model.computeTotals` — never trusted from the client.

## Status machine
```
draft ─► sent ─► approved ─► converted
  ▲       │        │             (terminal)
  └─ rejected ─────┘
```

## Endpoints (prefix `/api/quotations`)
| Method | Path                          | Purpose                              |
|--------|-------------------------------|--------------------------------------|
| GET    | `/`                           | list, filters: status, customer, from, to, projectId |
| GET    | `/:id`                        | single quote                         |
| POST   | `/`                           | create                               |
| PATCH  | `/:id`                        | update (enforces status machine)     |
| DELETE | `/:id`                        | remove                               |
| POST   | `/:id/convert-to-contract`    | must be `approved` → creates contract|

Every handler has a `// TODO: require perm 'quotations.*'` hook for the future RBAC middleware.

## Screens
- **List view** — searchable / filterable table, status badges.
- **Edit modal** — customer, items grid with live totals, terms, notes.
- **Preview modal** — PDF-ready quotation layout, print-friendly.

## Wiring
See root `src/api/routes-v2.js`. In `server.js` add one line:
```js
app.use(require('./src/api/routes-v2')(DATA_DIR));
```
