# Excel Import Plan

## Purpose

This document outlines a future plan for importing historical and ongoing finance data from Excel into the application. Import is intentionally deferred until the manual CRUD workflow and MongoDB schema are stable.

## Why Import Comes Later

- the MVP first needs a validated data model
- the backend should own clear finance rules before file ingestion is added
- Excel formats often contain inconsistencies that are easier to handle after the core system exists
- delaying import reduces early complexity and avoids coupling the app too tightly to one spreadsheet structure

## Import Goals

- migrate historical finance data from Excel into MongoDB
- preserve month-level income and allocation history
- preserve expense transaction history
- support jar debt reconstruction where the spreadsheet contains it
- keep enough source traceability for debugging and re-import fixes

## Expected Import Scope

Likely import targets:

- monthly incomes
- jar allocations
- transactions
- jar debts

Probably not imported initially:

- users beyond a single owner profile
- AI advice logs

## Proposed Import Flow

1. User uploads or provides an Excel workbook.
2. Backend import module reads workbook sheets and extracts raw rows.
3. Raw rows are mapped into a normalized intermediate format.
4. Validation rules check required columns, month format, jar keys, date values, and numeric amounts.
5. The system produces a preview report:
   - rows detected
   - rows accepted
   - rows rejected
   - unknown jar names
   - invalid dates or amounts
6. User confirms import.
7. Backend writes normalized records into MongoDB.
8. The system stores import metadata for traceability.

## Recommended Import Stages

### Stage 1: Spreadsheet analysis

- inspect actual workbook layout
- identify sheet names and column naming patterns
- map Vietnamese spreadsheet labels to stable system jar keys
- detect whether one workbook contains multiple months

### Stage 2: Intermediate mapping layer

Create a simple transformation layer that converts spreadsheet rows into normalized objects before database writes. This keeps import-specific parsing separate from core business logic.

Examples of mapping needs:

- Excel month text -> `YYYY-MM`
- Vietnamese jar label -> stable `jar_key`
- Excel date cell -> ISO date
- formatted currency cell -> numeric `amount`

### Stage 3: Validation and preview

Build a validation pass before insert or upsert:

- reject rows missing required dates or amounts
- reject unknown jar names unless explicitly mapped
- verify amounts are numeric
- verify month values are consistent
- flag duplicate rows or suspicious totals

### Stage 4: Persistence

After confirmation, write validated data into MongoDB collections using backend-owned rules. The import process should call the same domain services used by manual entry where practical.

## Data Mapping Draft

### Income rows

- map to `monthly_incomes`
- one record per user per `YYYY-MM`

### Allocation rows

- map to `jar_allocations`
- connect to the corresponding `monthly_income_id`

### Expense rows

- map to `transactions`
- preserve original description and exact date where available

### Jar debt rows

- map to `jar_debts`
- preserve source jar, destination jar, amount, and status if derivable

## Risks To Expect

- inconsistent sheet formats across months
- merged cells or manually styled spreadsheets
- missing jar labels or renamed jars
- amounts stored as text with separators
- dates stored in mixed Excel and text formats
- duplicate import runs creating duplicate records

## Recommended Future Technical Approach

- perform import in the Express backend, not in the React client
- keep file parsing logic isolated from finance-domain services
- add a dry-run preview before final write
- attach source metadata such as `source = excel_import`
- store optional row references for debugging failed or repeated imports

## Out Of Scope For Now

- direct Excel upload UI
- background job processing
- automatic re-import synchronization
- template auto-detection across many spreadsheet versions
- AI-assisted spreadsheet correction
