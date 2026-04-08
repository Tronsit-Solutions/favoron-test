UPDATE payment_orders
SET bank_name = 'Banco promerica',
    bank_account_holder = 'Ana Georgina Sierra Ponce',
    bank_account_number = '32336620334171',
    bank_account_type = 'ahorros',
    updated_at = now()
WHERE id = '7b31111f-b033-4f79-8fbe-513b5e6d56ce';