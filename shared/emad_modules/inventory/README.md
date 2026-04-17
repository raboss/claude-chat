# Inventory Module — المخزون وإذن الصرف

Manages stock items, movements, and issuance notes (إذن صرف) with auto stock-deduction on approval.

## Data flow
```
UI (ui.html) ──► /api/inventory
                    │
                    ├── /items       ──► pm_inventory_items.json
                    ├── /moves       ──► pm_inventory_moves.json
                    │                     (POST applies stock delta atomically)
                    └── /issuance    ──► pm_issuance_notes.json
                                          PATCH status draft→approved
                                          automatically creates 'out' moves
                                          and deducts stock.
```

## Item shape
`{ id, code, name, category, unit (pcs/kg/m/m2/m3/l/box), cost, stock_qty, reorder_point, supplier }`

## Movement shape
`{ id, type: 'in'|'out'|'transfer', item_id, qty, ref_type, ref_id, ts, by_user, note }`

## Issuance note shape
`{ id, number, date, project_id, requested_by, approved_by, items:[{item_id,qty}], status: 'draft'|'approved'|'issued'|'cancelled' }`

## Endpoints (`/api/inventory`)
| Method | Path                  | Effect |
|--------|-----------------------|--------|
| GET    | `/items?category=&low=1` | list |
| POST   | `/items`              | create |
| PATCH  | `/items/:id`          | update |
| DELETE | `/items/:id`          | remove |
| GET    | `/moves?item_id=&type=` | list (last 500) |
| POST   | `/moves`              | create + adjust stock (rejects negative stock) |
| GET    | `/issuance`           | list |
| POST   | `/issuance`           | create (draft) |
| PATCH  | `/issuance/:id`       | on approved/issued: deduct stock + log moves |
| DELETE | `/issuance/:id`       | remove |

All handlers include `// TODO: require perm 'inventory.*'` hooks.

## UI
Three tabs: Items (with low-stock filter), Movements log, Issuance notes with in-place approve.
KPIs: total items, low-stock count, inventory value, today's movements.
