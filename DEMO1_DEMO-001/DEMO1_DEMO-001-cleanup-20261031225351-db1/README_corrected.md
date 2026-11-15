# Corrected Report - Demo 1 · client DEMO-001

| | |
|---|---|
| Customer ID | DEMO1_DEMO-001 |
| Report ID | DEMO1_DEMO-001-cleanup-20261031225351-db1 |
| Business type | Restaurant |
| Period | May 13, 2026 - Oct 15, 2027 |
| Source file | demo_taqueria_raw.csv |
| Created | 2026-10-31 22:55 |

**Status:** Corrected report: complete data. All bad rows were fixed and appended.

## Data quality
- Rows uploaded: 132
- Clean rows used in this report: 130
- Bad rows: 11 (9 fixed and appended, 2 deleted as duplicates or unusable)

## What we did in this job
1. Received **demo_taqueria_raw.csv** with 132 rows and saved an untouched copy with its fingerprint.
2. Identified the columns. All column names were already correct.
3. Checked every row for missing values, invalid dates, text in number columns, negative amounts and duplicates.
4. Found 11 bad rows:
   - order_datetime is not a valid date: 2
   - duplicate row (delete it): 2
   - order_total must be a number (no $ or text): 1
   - guest_count is negative: 1
   - quantity must be a number (no $ or text): 1
   - order_total is negative: 1
   - order_id is missing: 1
   - order_datetime is missing: 1
   - order_total is missing: 1
5. 9 rows were fixed, checked again and appended to the clean data; 2 were deleted as duplicates or unusable.
6. Built the final clean table (fact_table.csv) with 130 rows.
7. Fingerprinted every file and every row, before and after the clean-up.

## Your files
- Saved in the zip file: **Demo_1_DEMO_001_2026-10-31_2253.zip** (click **Download all files** on the screen and save it wherever you like, for example your Desktop)
- Your original data, exactly as you sent it: demo_taqueria_raw_DB1_raw.csv
- Clean data: demo_taqueria_raw_DB1_clean.csv
- This report: demo_taqueria_raw_DB1_README.md
- Every file and every row is fingerprinted and kept on record by El Austral.

## Analysis
**Clean-up plan: README findings file.** The steps above show everything found and done with this database. This plan includes the README file only, with no analysis report; the Basic plan ($220) adds one analysis report.

---
El Austral Consultant · elaustralconsultant@gmail.com
