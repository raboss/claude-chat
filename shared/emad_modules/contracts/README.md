# Contracts Module — العقود

Agreement lifecycle: draft → active → completed (or cancelled). Tracks payment schedule, مستخلصات (extracts/progress invoices), and actual payments.

## Data flow
```
Quotations ──► /api/quotations/:id/convert-to-contract ──► pm_contracts
UI (ui.html) ──► /api/contracts
                    │
                    ├── pm_contracts.json       (source of truth)
                    └── pm_payments.json        (cross-module payment log)
```

## Key fields
- `parties.customer`, `parties.company`
- `value`, `down_payment`
- `payment_schedule[]` — `{name, pct, amount, due_date, status}`
- `extracts[]` — milestones registered by ops
- `payments[]` — actual money received (auto-moves status → active, then completed when fully paid)
- `attached_quote_id`, `project_id`

## Endpoints (`/api/contracts`)
- `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`
- `POST /:id/register-extract` — `{name, pct, amount}` creates extract, marks matching schedule row `invoiced`.
- `POST /:id/record-payment` — `{amount, method, ref, note}` appends payment; auto-transitions status; also logs to `pm_payments`.

Each handler is marked with `// TODO: require perm 'contracts.*'`.

## UI
- **Grid** of contract cards with status badge, payment progress bar, paid/remaining.
- **Edit modal** — parties, value, payment schedule editor.
- **Detail modal** — schedule view, register extract, record payment.

## Links to other modules
- `attached_quote_id` → `pm_quotations`
- `project_id` → `pm_projects` (future)
- Payments mirrored to `pm_payments`
