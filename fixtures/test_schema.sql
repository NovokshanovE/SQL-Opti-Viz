-- Schema and seed data for SQL-Opti-Viz test database

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         CITEXT UNIQUE,
    full_name     TEXT NOT NULL,
    age           INTEGER NOT NULL,
    country       TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data only when the table is empty
INSERT INTO users (email, full_name, age, country, created_at)
SELECT
    format('user%1$s@example.com', g) AS email,
    format('User %1$s', g)           AS full_name,
    (random() * 50 + 18)::INTEGER    AS age,
    (ARRAY['US','DE','FR','ES','RU','JP','IN'])[1 + (random()*6)::INTEGER] AS country,
    NOW() - (random() * INTERVAL '365 days')
FROM generate_series(1, 1000) AS g
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS orders (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    status        TEXT NOT NULL,
    gross_amount  NUMERIC(12,2) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO orders (user_id, status, gross_amount, created_at)
SELECT
    u.id,
    (ARRAY['pending','paid','failed','refunded'])[1 + (random()*3)::INTEGER] AS status,
    round((random() * 250)::numeric, 2) AS gross_amount,
    NOW() - (random() * INTERVAL '365 days')
FROM users u
CROSS JOIN LATERAL generate_series(1, 1 + (random()*5)::INTEGER)
WHERE NOT EXISTS (SELECT 1 FROM orders);

-- Index to support exact lookups by email (note: age intentionally lacks an index)
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS orders_user_id_created_idx ON orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
