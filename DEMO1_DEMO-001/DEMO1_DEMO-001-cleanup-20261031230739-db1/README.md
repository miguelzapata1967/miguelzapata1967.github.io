# Report - Demo 1 · client DEMO-001

| | |
|---|---|
| Customer ID | DEMO1_DEMO-001 |
| Report ID | DEMO1_DEMO-001-cleanup-20261031230739-db1 |
| Business type | Restaurant |
| Period | Sep 01, 2026 - Oct 31, 2026 |
| Source file | demo_taqueria_raw.csv |
| Created | 2026-10-31 23:07 |

**Status:** **This analysis is incomplete because data is missing.** 11 rows had problems and are being fixed now. A corrected report with the completed data follows at no extra charge.

## Data quality
- Rows uploaded: 132
- Clean rows used in this report: 121
- Bad rows waiting to be fixed: 11

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
5. Bad rows saved in rejected_data.csv, waiting to be fixed.
6. Fingerprinted every file and every row, before and after the clean-up.

## Your files
- Saved in the zip file: **Demo_1_DEMO_001_2026-10-31_2307.zip** (click **Download all files** on the screen and save it wherever you like, for example your Desktop)
- Your original data, exactly as you sent it: demo_taqueria_raw_DB1_raw.csv
- Clean data: demo_taqueria_raw_DB1_clean.csv
- Bad data to fix: demo_taqueria_raw_DB1_rejected.csv
- This report: demo_taqueria_raw_DB1_README.md
- Every file and every row is fingerprinted and kept on record by El Austral.

## Analysis
**Plan: Clean-up plan.** $180.00 for the 1st database, plus $90.00 for each extra database. Includes the README file only: clean data, column identification, bad-data fix and append, and the findings above. No data analysis.  
*Need the numbers too? The Basic plan is $220.00 for the 1st database, plus $90.00 for each extra database, and adds the data analysis.*

---
El Austral Consultant · elaustralconsultant@gmail.com
