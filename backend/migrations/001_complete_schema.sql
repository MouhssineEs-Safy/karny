-- ============================================================================
-- Karny Backend — Incremental & Idempotent Schema Migration (001)
-- ============================================================================
-- Purpose:
--   1. Preserve all existing users and customers data in KarnyDb.
--   2. Harden constraints and indexes on public.users and public.customers.
--   3. Create public.transactions with strict referential & ownership integrity.
--   4. Backfill opening credit transactions for pre-existing customers with
--      positive balances so that (total_credit - total_payments = amount).
-- ============================================================================

BEGIN;

-- 1. Ensure public.users table and case-insensitive email index exist
CREATE TABLE IF NOT EXISTS public.users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
    ON public.users (LOWER(email));

-- 2. Ensure public.customers table exists
CREATE TABLE IF NOT EXISTS public.customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

-- Set default 0.00 on customers.amount
ALTER TABLE public.customers
    ALTER COLUMN amount SET DEFAULT 0.00;

-- Safely assign any legacy NULL user_id rows (if any exist) to the first user before setting NOT NULL
UPDATE public.customers
SET user_id = (SELECT id FROM public.users ORDER BY id ASC LIMIT 1)
WHERE user_id IS NULL
  AND EXISTS (SELECT 1 FROM public.users);

-- Enforce NOT NULL on customers.user_id once all rows have an owner
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.customers WHERE user_id IS NULL) THEN
        ALTER TABLE public.customers ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Add CHECK constraint preventing negative customer balances
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'customers_amount_non_negative'
          AND conrelid = 'public.customers'::regclass
    ) THEN
        ALTER TABLE public.customers
            ADD CONSTRAINT customers_amount_non_negative CHECK (amount >= 0);
    END IF;
END $$;

-- Add UNIQUE (id, user_id) on customers so transactions can enforce composite ownership FK
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'customers_id_user_id_unique'
          AND conrelid = 'public.customers'::regclass
    ) THEN
        ALTER TABLE public.customers
            ADD CONSTRAINT customers_id_user_id_unique UNIQUE (id, user_id);
    END IF;
END $$;

-- Ensure customers_user_id_fkey enforces ON DELETE CASCADE for referential cleanup
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'customers_user_id_fkey'
          AND conrelid = 'public.customers'::regclass
          AND confdeltype <> 'c'
    ) THEN
        ALTER TABLE public.customers
            DROP CONSTRAINT customers_user_id_fkey,
            ADD CONSTRAINT customers_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Index on customers(user_id) for fast merchant-scoped queries
CREATE INDEX IF NOT EXISTS idx_customers_user_id
    ON public.customers (user_id);

-- 3. Create public.transactions table with composite ownership foreign key
CREATE TABLE IF NOT EXISTS public.transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT transactions_type_check
        CHECK (type IN ('credit', 'payment')),
    CONSTRAINT transactions_amount_positive
        CHECK (amount > 0),
    CONSTRAINT transactions_customer_owner_fkey
        FOREIGN KEY (customer_id, user_id)
        REFERENCES public.customers (id, user_id)
        ON DELETE CASCADE
);

-- Indexes for transaction history and merchant dashboard queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_created
    ON public.transactions (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_customer_created
    ON public.transactions (customer_id, created_at DESC, id DESC);

-- 4. Backfill opening credit transaction for existing customers that have amount > 0
--    and no prior transaction history, preserving exact balance consistency.
INSERT INTO public.transactions (customer_id, user_id, type, amount, note)
SELECT
    c.id,
    c.user_id,
    'credit',
    c.amount,
    'Opening balance'
FROM public.customers c
WHERE c.amount > 0
  AND c.user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM public.transactions t
      WHERE t.customer_id = c.id
  );

COMMIT;
