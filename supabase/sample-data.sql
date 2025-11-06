-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================
-- Ejecutar este script DESPUÉS de ejecutar schema.sql
-- y DESPUÉS de crear los usuarios en Supabase Auth

-- IMPORTANTE: Reemplazar los UUIDs con los IDs reales de tus usuarios
-- Los puedes obtener de: Authentication → Users en Supabase Dashboard

-- =====================================================
-- USUARIOS DE EJEMPLO
-- =====================================================

-- Admin (reemplazar 'admin-uuid-here' con el UUID real del usuario admin)
INSERT INTO users (id, email, name, role, active) VALUES 
('admin-uuid-here', 'admin@codetix.com', 'Admin CodeTix', 'admin', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Agente 1 - Zona Garraf
INSERT INTO users (id, email, name, role, active) VALUES 
('agent1-uuid-here', 'agente1@codetix.com', 'Carlos Ruiz', 'agent', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

INSERT INTO agents (id, phone, zone, capacity, active_leads, notification_enabled) VALUES 
('agent1-uuid-here', '+34600111222', 'Garraf', 15, 0, true)
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  zone = EXCLUDED.zone,
  capacity = EXCLUDED.capacity;

-- Agente 2 - Zona Barcelona
INSERT INTO users (id, email, name, role, active) VALUES 
('agent2-uuid-here', 'agente2@codetix.com', 'Ana Martínez', 'agent', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

INSERT INTO agents (id, phone, zone, capacity, active_leads, notification_enabled) VALUES 
('agent2-uuid-here', '+34600333444', 'Barcelona', 20, 0, true)
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  zone = EXCLUDED.zone,
  capacity = EXCLUDED.capacity;

-- Agente 3 - Zona General (backup)
INSERT INTO users (id, email, name, role, active) VALUES 
('agent3-uuid-here', 'agente3@codetix.com', 'Pedro López', 'agent', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

INSERT INTO agents (id, phone, zone, capacity, active_leads, notification_enabled) VALUES 
('agent3-uuid-here', '+34600555666', 'General', 10, 0, true)
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  zone = EXCLUDED.zone,
  capacity = EXCLUDED.capacity;

-- =====================================================
-- LEADS DE PRUEBA
-- =====================================================

-- Lead 1 - Zona Garraf
INSERT INTO leads (name, phone, email, city, postal_code, zone, source, notes, status, priority) VALUES
('Juan Pérez', '+34600111222', 'juan@example.com', 'Vilanova i la Geltrú', '08800', 'Garraf', 'Landing Page', 'Interesado en página web corporativa', 'NEW', 2);

-- Lead 2 - Zona Barcelona
INSERT INTO leads (name, phone, email, city, postal_code, zone, source, notes, status, priority) VALUES
('María García', '+34600222333', 'maria@example.com', 'Barcelona', '08015', 'Barcelona', 'Google Ads', 'Necesita e-commerce para venta online', 'NEW', 1);

-- Lead 3 - Zona Garraf
INSERT INTO leads (name, phone, email, city, postal_code, zone, source, notes, status, priority) VALUES
('Roberto Sánchez', '+34600333444', 'roberto@example.com', 'Sitges', '08870', 'Garraf', 'Referido', 'Quiere chatbot para atención al cliente 24/7', 'NEW', 3);

-- Lead 4 - Zona General
INSERT INTO leads (name, phone, email, city, postal_code, zone, source, notes, status, priority) VALUES
('Laura Jiménez', '+34600444555', 'laura@example.com', 'Madrid', '28001', 'General', 'Formulario Web', 'Startup busca web + app móvil', 'NEW', 1);

-- Lead 5 - Zona Barcelona (ya contactado)
INSERT INTO leads (name, phone, email, city, postal_code, zone, source, notes, status, priority) VALUES
('Antonio Fernández', '+34600555666', 'antonio@example.com', 'Barcelona', '08020', 'Barcelona', 'Cold Email', 'Restaurante necesita sistema de reservas', 'CONTACTED', 2);

-- =====================================================
-- ASIGNACIONES DE EJEMPLO
-- =====================================================

-- Asignar Lead 1 al Agente 1 (Garraf)
-- Nota: Reemplazar los UUIDs con los IDs reales de los leads y agentes generados
-- En producción, esto lo hace automáticamente el sistema

-- =====================================================
-- INTERACCIONES DE EJEMPLO
-- =====================================================

-- Ejemplo de interacción (solo si quieres datos de prueba)
-- INSERT INTO interactions (lead_id, agent_id, channel, message) VALUES
-- ('lead-uuid-here', 'agent-uuid-here', 'whatsapp', 'Primer contacto por WhatsApp. Cliente muy interesado.');

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar usuarios creados
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  CASE WHEN a.id IS NOT NULL THEN '✓ Agent configured' ELSE '' END as agent_status
FROM users u
LEFT JOIN agents a ON a.id = u.id
ORDER BY u.role DESC, u.name;

-- Verificar agentes y su capacidad
SELECT 
  u.name,
  u.email,
  a.zone,
  a.capacity,
  a.active_leads,
  CASE WHEN u.active THEN '✓ Active' ELSE '○ Inactive' END as status
FROM agents a
JOIN users u ON u.id = a.id
ORDER BY a.zone, u.name;

-- Verificar leads creados
SELECT 
  l.name,
  l.city,
  l.zone,
  l.status,
  l.source,
  l.created_at
FROM leads l
ORDER BY l.created_at DESC
LIMIT 10;

-- =====================================================
-- COMANDOS ÚTILES POST-SETUP
-- =====================================================

-- Ver leads sin asignar
-- SELECT l.* FROM leads l 
-- LEFT JOIN assignments a ON a.lead_id = l.id 
-- WHERE a.id IS NULL;

-- Ver carga de trabajo por agente
-- SELECT 
--   u.name,
--   a.zone,
--   COUNT(DISTINCT l.id) as total_leads,
--   COUNT(DISTINCT CASE WHEN l.status = 'NEW' THEN l.id END) as new_leads,
--   COUNT(DISTINCT CASE WHEN l.status = 'WON' THEN l.id END) as won_leads
-- FROM agents a
-- JOIN users u ON u.id = a.id
-- LEFT JOIN assignments asn ON asn.agent_id = a.id
-- LEFT JOIN leads l ON l.id = asn.lead_id
-- GROUP BY u.name, a.zone
-- ORDER BY a.zone, u.name;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
1. Este script crea datos de EJEMPLO para testing
2. En producción, los leads entran vía webhook automáticamente
3. Las asignaciones las hace el sistema según zona y disponibilidad
4. Los UUIDs de ejemplo deben reemplazarse con los reales de Supabase Auth
5. Para crear usuarios: Supabase Dashboard → Authentication → Add User
*/
