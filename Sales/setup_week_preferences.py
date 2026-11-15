"""Manage client reporting-week preferences, preserving customer history.
Usage:
  python setup_week_preferences.py init
  python setup_week_preferences.py set CUSTOMER_ID week_1 --reason "Customer request"
  python setup_week_preferences.py show CUSTOMER_ID
"""
import argparse
import csv
import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r'C:\Users\mexar\El-Austral_Consultant\English\Data')
SALES = ROOT / 'Sales'
CLIENTS = SALES / 'clients.csv'
WEEK_TYPES = SALES / 'week_types.csv'
HISTORY = SALES / 'client_week_type_history.csv'
ALLOWED = {
    'week_1': ('Monday', 'Sunday'),
    'week_2': ('Sunday', 'Saturday'),
    'week_end_1': ('Thursday', 'Sunday'),
    'week_end_2': ('Friday', 'Sunday'),
    'week_end_3': ('Saturday', 'Sunday'),
}
HISTORY_COLUMNS = ['user_id', 'previous_week_type', 'new_week_type', 'changed_at_utc', 'changed_by', 'reason']


def read_clients():
    if not CLIENTS.exists():
        raise FileNotFoundError(f'Missing {CLIENTS}. No client file was created or overwritten.')
    with CLIENTS.open('r', newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames
        if not columns or 'user_id' not in columns:
            raise ValueError('clients.csv must contain a user_id column')
        rows = list(reader)
    ids = [r['user_id'] for r in rows]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate user_id values: update aborted')
    return columns, rows


def atomic_write_csv(path, columns, rows):
    fd, tmp = tempfile.mkstemp(prefix='.week_', suffix='.csv', dir=path.parent)
    try:
        with os.fdopen(fd, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=columns, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(rows)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def init():
    SALES.mkdir(parents=True, exist_ok=True)
    columns, rows = read_clients()
    if 'week_type' not in columns:
        columns = [*columns, 'week_type']
        for row in rows:
            row['week_type'] = ''
        backup = CLIENTS.with_name(f'clients_backup_{datetime.now().strftime("%Y%m%d_%H%M%S_%f")}.csv')
        shutil.copy2(CLIENTS, backup)
        atomic_write_csv(CLIENTS, columns, rows)
        print(f'Added week_type column; backup: {backup}')
    else:
        print('clients.csv already contains week_type; existing selections preserved')
    atomic_write_csv(WEEK_TYPES, ['week_type', 'start_day', 'end_day', 'description'], [
        dict(week_type=k, start_day=v[0], end_day=v[1], description=f'{v[0]} through {v[1]}')
        for k, v in ALLOWED.items()
    ])
    if not HISTORY.exists():
        atomic_write_csv(HISTORY, HISTORY_COLUMNS, [])
    print(f'Ready: {CLIENTS}\nOptions: {WEEK_TYPES}\nHistory: {HISTORY}')


def set_week(user_id, week_type, changed_by, reason):
    if week_type not in ALLOWED:
        raise ValueError(f'Invalid week type: {week_type}')
    init()
    columns, rows = read_clients()
    matches = [r for r in rows if r['user_id'] == user_id]
    if not matches:
        raise ValueError(f'Customer {user_id!r} not found. No new customer was created.')
    old = matches[0].get('week_type', '')
    if old == week_type:
        print('No change: preference already set to this value')
        return
    matches[0]['week_type'] = week_type
    # Preserve the previous clients.csv before every update.
    backup = CLIENTS.with_name(f'clients_backup_{datetime.now().strftime("%Y%m%d_%H%M%S_%f")}.csv')
    shutil.copy2(CLIENTS, backup)
    # Log first so a failed history write cannot silently discard the audit record.
    with HISTORY.open('a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=HISTORY_COLUMNS)
        writer.writerow(dict(user_id=user_id, previous_week_type=old, new_week_type=week_type,
                             changed_at_utc=datetime.now(timezone.utc).isoformat(),
                             changed_by=changed_by, reason=reason))
        f.flush()
        os.fsync(f.fileno())
    atomic_write_csv(CLIENTS, columns, rows)
    print(f'{user_id}: {old or "(not set)"} -> {week_type}; backup: {backup}')


def show(user_id):
    _, rows = read_clients()
    matches = [r for r in rows if r['user_id'] == user_id]
    if not matches:
        raise ValueError(f'Unknown user_id: {user_id}')
    print(f'{user_id}: {matches[0].get("week_type", "(not set)") or "(not set)"}')
    if HISTORY.exists():
        with HISTORY.open(newline='', encoding='utf-8-sig') as f:
            for row in csv.DictReader(f):
                if row['user_id'] == user_id:
                    print(f"  {row['changed_at_utc']}: {row['previous_week_type']} -> {row['new_week_type']} ({row['changed_by']}; {row['reason']})")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Client week preferences')
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('init')
    p = sub.add_parser('set')
    p.add_argument('user_id')
    p.add_argument('week_type', choices=list(ALLOWED))
    p.add_argument('--changed-by', default='admin')
    p.add_argument('--reason', default='Customer preference update')
    p = sub.add_parser('show')
    p.add_argument('user_id')
    a = parser.parse_args()
    if a.command == 'init': init()
    elif a.command == 'set': set_week(a.user_id, a.week_type, a.changed_by, a.reason)
    else: show(a.user_id)
