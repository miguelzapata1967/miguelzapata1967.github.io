-- El Austral Consultant | Client POS / CRM | PostgreSQL-compatible schema
-- No customer data is included. All CSV files contain headers only.
-- user_id is VARCHAR(14); database_qty is INT (4-digit display is a UI rule, not INT(4)).
-- receipt_id format: contract_id || underscore || two-digit counter (00..99).

CREATE TABLE IF NOT EXISTS referrals (
    referral_id VARCHAR(20) PRIMARY KEY,
    referrer_type VARCHAR(20),
    referrer_name VARCHAR(100),
    referrer_client_user_id VARCHAR(14) REFERENCES clients(user_id),
    referrer_contact VARCHAR(100),
    channel VARCHAR(40),
    referral_date TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS clients (
    user_id VARCHAR(14) PRIMARY KEY,
    company_name VARCHAR(20),
    poc_name VARCHAR(20),
    poc_email_address VARCHAR(30),
    poc_phone_number VARCHAR(20),
    address_street_name VARCHAR(30),
    address_number VARCHAR(6),
    address_zip VARCHAR(6),
    database_qty INT,
    creation_date TIMESTAMP,
    referred_by VARCHAR(100),
    referral_id VARCHAR(20) REFERENCES referrals(referral_id)
);

CREATE TABLE IF NOT EXISTS client_databases (
    database_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(14) REFERENCES clients(user_id),
    database_name VARCHAR(100),
    database_type VARCHAR(40),
    access_method VARCHAR(40),
    data_classification VARCHAR(30),
    status VARCHAR(20),
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiries (
    inquiry_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(14) REFERENCES clients(user_id),
    service_requested VARCHAR(100),
    description TEXT,
    inquiry_status VARCHAR(30),
    received_at TIMESTAMP,
    assigned_employee_id VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS contracts (
    contract_id VARCHAR(20) PRIMARY KEY,
    inquiry_id VARCHAR(20) REFERENCES inquiries(inquiry_id),
    user_id VARCHAR(14) REFERENCES clients(user_id),
    signed_at TIMESTAMP,
    start_date DATE,
    due_date DATE,
    contract_amount DECIMAL(12,2),
    deposit_required DECIMAL(12,2),
    contract_status VARCHAR(30),
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract_addenda (
    addendum_id VARCHAR(25) PRIMARY KEY,
    contract_id VARCHAR(20) REFERENCES contracts(contract_id),
    description TEXT,
    amount_change DECIMAL(12,2),
    deposit_adjustment DECIMAL(12,2),
    signed_at TIMESTAMP,
    status VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS services (
    service_id VARCHAR(20) PRIMARY KEY,
    service_name VARCHAR(100),
    service_description TEXT,
    base_price DECIMAL(12,2),
    active BOOLEAN
);

CREATE TABLE IF NOT EXISTS contract_services (
    contract_service_id VARCHAR(20) PRIMARY KEY,
    contract_id VARCHAR(20) REFERENCES contracts(contract_id),
    service_id VARCHAR(20) REFERENCES services(service_id),
    description TEXT,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(12,2),
    line_total DECIMAL(12,2)
);

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id VARCHAR(25) PRIMARY KEY,
    contract_id VARCHAR(20) REFERENCES contracts(contract_id),
    issued_at TIMESTAMP,
    due_at TIMESTAMP,
    invoice_status VARCHAR(30),
    subtotal DECIMAL(12,2),
    tax DECIMAL(12,2),
    total DECIMAL(12,2)
);

CREATE TABLE IF NOT EXISTS invoice_items (
    invoice_item_id VARCHAR(25) PRIMARY KEY,
    invoice_id VARCHAR(25) REFERENCES invoices(invoice_id),
    service_id VARCHAR(20) REFERENCES services(service_id),
    description TEXT,
    qty DECIMAL(10,2),
    price DECIMAL(12,2),
    line_total DECIMAL(12,2)
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id VARCHAR(25) PRIMARY KEY,
    invoice_id VARCHAR(25) REFERENCES invoices(invoice_id),
    contract_id VARCHAR(20) REFERENCES contracts(contract_id),
    amount DECIMAL(12,2),
    currency CHAR(3),
    payment_method VARCHAR(30),
    transaction_reference VARCHAR(100),
    payment_status VARCHAR(30),
    paid_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS receipts (
    receipt_id VARCHAR(30) PRIMARY KEY,
    contract_id VARCHAR(20) REFERENCES contracts(contract_id),
    payment_id VARCHAR(25) UNIQUE REFERENCES payments(payment_id),
    receipt_counter SMALLINT,
    issued_at TIMESTAMP,
    notes TEXT,
    UNIQUE (contract_id, receipt_counter)
);

CREATE TABLE IF NOT EXISTS project_deliveries (
    delivery_id VARCHAR(25) PRIMARY KEY,
    contract_id VARCHAR(20) REFERENCES contracts(contract_id),
    deliverable_type VARCHAR(40),
    delivery_method VARCHAR(40),
    delivery_reference VARCHAR(255),
    scheduled_at TIMESTAMP,
    delivered_at TIMESTAMP,
    received_at TIMESTAMP,
    delivery_status VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS delivery_events (
    event_id VARCHAR(25) PRIMARY KEY,
    delivery_id VARCHAR(25) REFERENCES project_deliveries(delivery_id),
    event_type VARCHAR(40),
    event_at TIMESTAMP,
    actor_id VARCHAR(20),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS client_activity_history (
    activity_id VARCHAR(25) PRIMARY KEY,
    user_id VARCHAR(14) REFERENCES clients(user_id),
    contract_id VARCHAR(20) REFERENCES contracts(contract_id),
    activity_type VARCHAR(40),
    description TEXT,
    performed_by VARCHAR(20),
    occurred_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract_status_history (
    history_id VARCHAR(25) PRIMARY KEY,
    contract_id VARCHAR(20) REFERENCES contracts(contract_id),
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    changed_by VARCHAR(20),
    changed_at TIMESTAMP,
    reason TEXT
);

CREATE TABLE IF NOT EXISTS client_referral_history (
    record_id VARCHAR(25) PRIMARY KEY,
    user_id VARCHAR(14) REFERENCES clients(user_id),
    referral_id VARCHAR(20) REFERENCES referrals(referral_id),
    recorded_at TIMESTAMP,
    notes TEXT
);

-- Optional receipt format enforcement in PostgreSQL:
ALTER TABLE receipts ADD CONSTRAINT receipt_id_format CHECK (receipt_id = contract_id || '_' || LPAD(receipt_counter::TEXT, 2, '0') AND receipt_counter BETWEEN 0 AND 99);
-- Referral client self-reference can be added after table creation for strict referential integrity.
