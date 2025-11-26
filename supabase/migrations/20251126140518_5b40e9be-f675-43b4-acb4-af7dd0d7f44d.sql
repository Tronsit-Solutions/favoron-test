-- Eliminar la función RPC que está causando timeouts
DROP FUNCTION IF EXISTS get_admin_packages_paginated(integer, integer, text, text, uuid);

-- Crear índices compuestos optimizados para queries simples
CREATE INDEX IF NOT EXISTS idx_packages_created_status 
ON packages(created_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_trips_created_status 
ON trips(created_at DESC, status);