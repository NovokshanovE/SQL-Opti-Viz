EXPLAIN (FORMAT JSON, COSTS, ANALYZE, BUFFERS)
SELECT id, email, age
FROM users
WHERE lower(email) LIKE '%gmail.com';
