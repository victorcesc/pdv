SELECT 
    p.id,
    p.code,
    p.name,
    p.empresa_id,
    e.user_id,
    u.login as user_login
FROM products p
LEFT JOIN empresas e ON p.empresa_id = e.id
LEFT JOIN users u ON e.user_id = u.id
ORDER BY p.id DESC
LIMIT 10;
