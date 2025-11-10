-- Sequential scan scenario (no index on age)
EXPLAIN (FORMAT JSON, COSTS, ANALYZE, BUFFERS)
SELECT id, email, age
FROM users
WHERE age > 45;

-- Leading wildcard LIKE pattern
EXPLAIN (FORMAT JSON, COSTS, ANALYZE, BUFFERS)
SELECT id, email
FROM users
WHERE email LIKE '%gmail.com';

-- Function applied to column (lower on email)
EXPLAIN (FORMAT JSON, COSTS, ANALYZE, BUFFERS)
SELECT id
FROM users
WHERE lower(email) = 'user42@example.com';

-- Join and aggregation with selective filters
EXPLAIN (FORMAT JSON, COSTS, ANALYZE, BUFFERS)
WITH recent_orders AS (
  SELECT
    o.user_id,
    o.gross_amount,
    o.status,
    o.created_at
  FROM orders o
  WHERE o.created_at >= NOW() - INTERVAL '90 days'
)
SELECT
  u.country,
  COUNT(*) AS orders_count,
  SUM(ro.gross_amount) AS total_amount
FROM users u
JOIN recent_orders ro ON ro.user_id = u.id
WHERE ro.status = 'paid'
GROUP BY u.country
HAVING COUNT(*) > 10
ORDER BY total_amount DESC;
