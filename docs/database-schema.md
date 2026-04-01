# MongoDB Database Schema

## Design Goals

- MVP-first document design
- MongoDB collections instead of SQL tables
- MongoDB Atlas as the single source of truth
- support VND amounts using `Number`
- use `YYYY-MM` for accounting month fields
- use ISO date values for exact dates and timestamps
- preserve stable English keys for system logic
- preserve Vietnamese display names where useful for UI

## Stable Jar Keys

These keys should remain stable across the backend, frontend, import layer, and future AI service.

| key | Vietnamese display name |
| --- | --- |
| `essentials` | Hũ chi tiêu cần thiết |
| `long_term_saving` | Tiết kiệm dài hạn |
| `education` | Quỹ Giáo Dục |
| `enjoyment` | Hưởng thụ |
| `financial_freedom` | Quỹ tự do tài chính |
| `charity` | Quỹ từ thiện |

## Relationship Summary

- one user owns many jars
- one user has many monthly income records
- one monthly income record can have many jar allocations
- one user has many transactions
- one user has many jar debts
- one user has many AI advice logs

## Collection: `users`

### Purpose

Stores the account owner profile and default finance preferences for the MVP. Authentication is not implemented yet, so this collection should stay minimal and ready for future expansion.

### Fields

| field | type | required | notes |
| --- | --- | --- | --- |
| `_id` | `ObjectId` | required | primary document id |
| `display_name` | `String` | required | user-facing name |
| `email` | `String` | optional | reserved for future auth and notifications |
| `base_currency` | `String` | required | default `VND` |
| `locale` | `String` | optional | example: `vi-VN` |
| `timezone` | `String` | optional | example: `Asia/Ho_Chi_Minh` |
| `created_at` | `Date` | required | ISO date |
| `updated_at` | `Date` | required | ISO date |

### Indexes

- `{ email: 1 }` unique sparse
- `{ created_at: -1 }`

### Example Document

```json
{
  "_id": { "$oid": "660000000000000000000001" },
  "display_name": "Nguyen Van A",
  "email": "owner@example.com",
  "base_currency": "VND",
  "locale": "vi-VN",
  "timezone": "Asia/Ho_Chi_Minh",
  "created_at": { "$date": "2026-04-01T00:00:00.000Z" },
  "updated_at": { "$date": "2026-04-01T00:00:00.000Z" }
}
```

## Collection: `jars`

### Purpose

Stores the six jar definitions for each user. This keeps stable jar keys separate from monthly allocations and supports jar display names, status, and future balance reporting.

### Fields

| field | type | required | notes |
| --- | --- | --- | --- |
| `_id` | `ObjectId` | required | primary document id |
| `user_id` | `ObjectId` | required | reference to `users._id` |
| `jar_key` | `String` | required | stable system key |
| `display_name_vi` | `String` | required | Vietnamese jar name |
| `display_order` | `Number` | required | UI ordering |
| `target_percentage` | `Number` | optional | default allocation target for future use |
| `is_active` | `Boolean` | required | soft activation flag |
| `created_at` | `Date` | required | ISO date |
| `updated_at` | `Date` | required | ISO date |

### Indexes

- `{ user_id: 1, jar_key: 1 }` unique
- `{ user_id: 1, display_order: 1 }`

### Example Document

```json
{
  "_id": { "$oid": "660000000000000000000101" },
  "user_id": { "$oid": "660000000000000000000001" },
  "jar_key": "essentials",
  "display_name_vi": "Hũ chi tiêu cần thiết",
  "display_order": 1,
  "target_percentage": 55,
  "is_active": true,
  "created_at": { "$date": "2026-04-01T00:00:00.000Z" },
  "updated_at": { "$date": "2026-04-01T00:00:00.000Z" }
}
```

## Collection: `monthly_incomes`

### Purpose

Stores total income for a user in a given accounting month. This is the monthly anchor for allocation planning and reporting.

### Fields

| field | type | required | notes |
| --- | --- | --- | --- |
| `_id` | `ObjectId` | required | primary document id |
| `user_id` | `ObjectId` | required | reference to `users._id` |
| `month` | `String` | required | format `YYYY-MM` |
| `total_amount` | `Number` | required | VND amount |
| `currency` | `String` | required | default `VND` |
| `income_date` | `Date` | optional | exact income receipt date if known |
| `source_note` | `String` | optional | short note such as salary or bonus |
| `created_at` | `Date` | required | ISO date |
| `updated_at` | `Date` | required | ISO date |

### Indexes

- `{ user_id: 1, month: 1 }` unique
- `{ month: 1 }`

### Example Document

```json
{
  "_id": { "$oid": "660000000000000000000201" },
  "user_id": { "$oid": "660000000000000000000001" },
  "month": "2026-04",
  "total_amount": 30000000,
  "currency": "VND",
  "income_date": { "$date": "2026-04-05T00:00:00.000Z" },
  "source_note": "Luong thang 4",
  "created_at": { "$date": "2026-04-05T01:00:00.000Z" },
  "updated_at": { "$date": "2026-04-05T01:00:00.000Z" }
}
```

## Collection: `jar_allocations`

### Purpose

Stores how a monthly income is allocated into each jar. This collection keeps allocation history by month without mutating the jar definitions.

### Fields

| field | type | required | notes |
| --- | --- | --- | --- |
| `_id` | `ObjectId` | required | primary document id |
| `user_id` | `ObjectId` | required | reference to `users._id` |
| `monthly_income_id` | `ObjectId` | required | reference to `monthly_incomes._id` |
| `jar_id` | `ObjectId` | required | reference to `jars._id` |
| `jar_key` | `String` | required | duplicated stable key for easier querying |
| `month` | `String` | required | format `YYYY-MM` |
| `allocated_amount` | `Number` | required | VND amount allocated into jar |
| `allocation_percentage` | `Number` | optional | snapshot percentage for that month |
| `note` | `String` | optional | manual adjustment reason |
| `created_at` | `Date` | required | ISO date |
| `updated_at` | `Date` | required | ISO date |

### Indexes

- `{ user_id: 1, month: 1, jar_key: 1 }`
- `{ monthly_income_id: 1, jar_id: 1 }` unique
- `{ jar_id: 1, month: 1 }`

### Example Document

```json
{
  "_id": { "$oid": "660000000000000000000301" },
  "user_id": { "$oid": "660000000000000000000001" },
  "monthly_income_id": { "$oid": "660000000000000000000201" },
  "jar_id": { "$oid": "660000000000000000000101" },
  "jar_key": "essentials",
  "month": "2026-04",
  "allocated_amount": 16500000,
  "allocation_percentage": 55,
  "note": "Phan bo theo ke hoach thang",
  "created_at": { "$date": "2026-04-05T01:05:00.000Z" },
  "updated_at": { "$date": "2026-04-05T01:05:00.000Z" }
}
```

## Collection: `transactions`

### Purpose

Stores transaction-level records, primarily expenses that will later come from Excel import. Transactions may optionally be tied to a jar when classification is known.

### Fields

| field | type | required | notes |
| --- | --- | --- | --- |
| `_id` | `ObjectId` | required | primary document id |
| `user_id` | `ObjectId` | required | reference to `users._id` |
| `jar_id` | `ObjectId` | optional | reference to `jars._id` when classified |
| `jar_key` | `String` | optional | stable jar key snapshot |
| `month` | `String` | required | format `YYYY-MM` |
| `transaction_date` | `Date` | required | ISO date for exact date |
| `amount` | `Number` | required | VND amount |
| `currency` | `String` | required | default `VND` |
| `direction` | `String` | required | MVP values: `expense`, `income_adjustment`, `transfer` |
| `description` | `String` | required | human-readable description |
| `source` | `String` | optional | example: `manual`, `excel_import` |
| `external_row_ref` | `String` | optional | reserved for future import traceability |
| `notes` | `String` | optional | additional context |
| `created_at` | `Date` | required | ISO date |
| `updated_at` | `Date` | required | ISO date |

### Indexes

- `{ user_id: 1, month: 1, transaction_date: -1 }`
- `{ user_id: 1, jar_key: 1, transaction_date: -1 }`
- `{ source: 1, external_row_ref: 1 }`

### Example Document

```json
{
  "_id": { "$oid": "660000000000000000000401" },
  "user_id": { "$oid": "660000000000000000000001" },
  "jar_id": { "$oid": "660000000000000000000101" },
  "jar_key": "essentials",
  "month": "2026-04",
  "transaction_date": { "$date": "2026-04-07T00:00:00.000Z" },
  "amount": 250000,
  "currency": "VND",
  "direction": "expense",
  "description": "Tien dien",
  "source": "manual",
  "external_row_ref": null,
  "notes": "Thanh toan hoa don",
  "created_at": { "$date": "2026-04-07T12:00:00.000Z" },
  "updated_at": { "$date": "2026-04-07T12:00:00.000Z" }
}
```

## Collection: `jar_debts`

### Purpose

Tracks debt or borrowing between jars when one jar temporarily covers spending for another. This supports the Excel workflow where jar balances may need later internal settlement.

### Fields

| field | type | required | notes |
| --- | --- | --- | --- |
| `_id` | `ObjectId` | required | primary document id |
| `user_id` | `ObjectId` | required | reference to `users._id` |
| `from_jar_id` | `ObjectId` | required | jar that provided the money |
| `from_jar_key` | `String` | required | stable source jar key |
| `to_jar_id` | `ObjectId` | `required` | jar that owes repayment |
| `to_jar_key` | `String` | required | stable destination jar key |
| `month` | `String` | required | format `YYYY-MM` for reporting period |
| `amount` | `Number` | required | VND amount |
| `debt_date` | `Date` | required | ISO date when debt was recorded |
| `status` | `String` | required | MVP values: `open`, `settled` |
| `settled_at` | `Date` | optional | ISO date when cleared |
| `reason` | `String` | optional | short explanation |
| `created_at` | `Date` | required | ISO date |
| `updated_at` | `Date` | required | ISO date |

### Indexes

- `{ user_id: 1, month: 1, status: 1 }`
- `{ user_id: 1, from_jar_key: 1, to_jar_key: 1 }`
- `{ debt_date: -1 }`

### Example Document

```json
{
  "_id": { "$oid": "660000000000000000000501" },
  "user_id": { "$oid": "660000000000000000000001" },
  "from_jar_id": { "$oid": "660000000000000000000101" },
  "from_jar_key": "essentials",
  "to_jar_id": { "$oid": "660000000000000000000103" },
  "to_jar_key": "education",
  "month": "2026-04",
  "amount": 500000,
  "debt_date": { "$date": "2026-04-10T00:00:00.000Z" },
  "status": "open",
  "settled_at": null,
  "reason": "Tam ung cho chi phi giao duc",
  "created_at": { "$date": "2026-04-10T12:00:00.000Z" },
  "updated_at": { "$date": "2026-04-10T12:00:00.000Z" }
}
```

## Collection: `ai_advice_logs`

### Purpose

Stores logs of future AI advice requests and outputs. This is for traceability, observability, and user history, not for storing the main finance ledger.

### Fields

| field | type | required | notes |
| --- | --- | --- | --- |
| `_id` | `ObjectId` | required | primary document id |
| `user_id` | `ObjectId` | required | reference to `users._id` |
| `month` | `String` | optional | format `YYYY-MM` if advice is month-specific |
| `request_type` | `String` | required | example: `monthly_summary`, `spending_advice` |
| `input_snapshot` | `Object` | optional | sanitized finance context used for advice |
| `response_text` | `String` | optional | plain text result or summary |
| `response_payload` | `Object` | optional | structured response if needed |
| `provider` | `String` | optional | reserved for future AI provider |
| `model_name` | `String` | optional | reserved for future model tracking |
| `status` | `String` | required | MVP values: `queued`, `completed`, `failed` |
| `error_message` | `String` | optional | failure detail if request fails |
| `created_at` | `Date` | required | ISO date |
| `completed_at` | `Date` | optional | ISO date |

### Indexes

- `{ user_id: 1, created_at: -1 }`
- `{ user_id: 1, month: 1 }`
- `{ status: 1, created_at: -1 }`

### Example Document

```json
{
  "_id": { "$oid": "660000000000000000000601" },
  "user_id": { "$oid": "660000000000000000000001" },
  "month": "2026-04",
  "request_type": "monthly_summary",
  "input_snapshot": {
    "income_total": 30000000,
    "expense_total": 11250000,
    "top_spending_jar": "essentials"
  },
  "response_text": "Placeholder for future AI advice output.",
  "response_payload": {
    "highlights": []
  },
  "provider": null,
  "model_name": null,
  "status": "completed",
  "error_message": null,
  "created_at": { "$date": "2026-04-15T10:00:00.000Z" },
  "completed_at": { "$date": "2026-04-15T10:00:05.000Z" }
}
```

## MVP Notes

- Keep all amount fields as `Number` and assume VND for MVP.
- Use `month` as the reporting key and exact ISO dates for event timing.
- Duplicate stable fields like `jar_key` where they improve query simplicity and import traceability.
- Avoid advanced ledger abstractions until the Excel workflow is validated in the app.
