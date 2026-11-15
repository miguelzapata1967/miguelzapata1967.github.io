EL AUSTRAL CONSULTANT - CUSTOMER WEEK PREFERENCES

Destination: C:\Users\mexar\El-Austral_Consultant\English\Data\Sales\

1. Place setup_week_preferences.py and week_types.csv in Sales.
2. Ensure clients.csv already exists and has a user_id column.
3. In PowerShell:
   cd 'C:\Users\mexar\El-Austral_Consultant\English\Data\Sales'
   python setup_week_preferences.py init
4. Change a customer's preference:
   python setup_week_preferences.py set CUSTOMER_ID week_end_2 --changed-by admin --reason "Requested by customer"
5. View current preference and history:
   python setup_week_preferences.py show CUSTOMER_ID

The script adds a week_type column to existing clients.csv without removing
other columns, creates week_types.csv and client_week_type_history.csv, and
makes timestamped backups before modifying clients.csv.

Allowed values:
week_1: Monday-Sunday
week_2: Sunday-Saturday
week_end_1: Thursday-Sunday
week_end_2: Friday-Sunday
week_end_3: Saturday-Sunday

Other application paths:
C:\Users\mexar\El-Austral_Consultant\English\Data\Admin\
C:\Users\mexar\El-Austral_Consultant\English\Data\Employees\

IMPORTANT: This CSV-based script is intended for single-user administration.
For concurrent multi-user updates, use a transactional database instead.
