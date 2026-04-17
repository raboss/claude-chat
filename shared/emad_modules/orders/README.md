# Orders Module — أوامر التشغيل

Polymorphic work orders for the shop floor: Cut (قص), Manufacturing (تصنيع), and Glass (زجاج). Displayed as a unified Kanban pipeline grouped by status.

## Data flow
```
UI (ui.html) ──► /api/orders
                    │
                    ├── /cut      ──► pm_cut_orders.json
                    ├── /mfg      ──► pm_mfg_orders.json
                    ├── /glass    ──► pm_glass_orders.json
                    └── /all      merged view (for Kanban)
```

## Shared shape
`{ id, type, number, status, priority, project_id, assigned_to, created_at, updated_at, notes }`

## Type-specific fields
| Type  | Extra fields                                           |
|-------|--------------------------------------------------------|
| cut   | `cut_list:[{profile,length,qty,angles}]`               |
| mfg   | `assembly_specs, frames_count, glass_list`             |
| glass | `items:[{type,width,height,qty}], supplier, eta`       |

## Status machine
```
draft → sent → in_progress → completed
         ↓          ↓              (terminal)
    cancelled   cancelled
```
Illegal transitions return 400.

## Endpoints (`/api/orders`)
For each `{cut,mfg,glass}`:
- `GET    /:type`      (filters: status, project_id, assigned_to)
- `GET    /:type/:id`
- `POST   /:type`      (type is forced server-side)
- `PATCH  /:type/:id`  (enforces status machine)
- `DELETE /:type/:id`

Plus merged: `GET /all` — returns all orders of every type, used by Kanban UI.

All handlers: `// TODO: require perm 'orders.{type}.*'`.

## UI
- 4-column Kanban (draft / sent / in_progress / completed) with native HTML5 drag-and-drop to move cards (honoring the state machine).
- Per-type create modals with the right inline editors (cut list, glass pieces, assembly specs).
- Filters: type, priority, project.
