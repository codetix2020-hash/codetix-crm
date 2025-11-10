-- =====================================================
-- CODETIX CRM - Complete Database Schema
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Tabla usuarios
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role text not null check (role in ('admin', 'agent')),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla agentes (extiende users)
create table if not exists agents (
  id uuid primary key references users(id) on delete cascade,
  phone text,
  zone text not null, -- 'Garraf', 'Barcelona', 'General'
  capacity int default 10, -- máx leads simultáneos
  active_leads int default 0,
  last_assigned_at timestamptz,
  notification_enabled boolean default true,
  created_at timestamptz default now()
);

-- Tabla leads
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  business_name text,
  name text,
  phone text,
  sector text,
  city text,
  status text default 'nuevo',
  assigned_to uuid references agents(id),
  notes text
);

-- Tabla asignaciones
create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  agent_id uuid references agents(id) on delete set null,
  method text check (method in ('auto', 'manual')),
  assigned_at timestamptz default now(),
  reassigned_from uuid references agents(id)
);

-- Tabla interacciones
create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  agent_id uuid references agents(id),
  channel text check (channel in ('whatsapp', 'email', 'phone', 'note', 'system')),
  message text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Tabla reglas de asignación
create table if not exists assignment_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zone text,
  active boolean default true,
  priority int default 1,
  conditions jsonb, -- {"time_range": "09:00-18:00", "weekdays": [1,2,3,4,5]}
  created_at timestamptz default now()
);

-- Tabla métricas (para dashboard)
create table if not exists metrics (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete cascade,
  date date not null,
  leads_assigned int default 0,
  leads_contacted int default 0,
  leads_won int default 0,
  leads_lost int default 0,
  avg_response_time_minutes int,
  created_at timestamptz default now(),
  unique(agent_id, date)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

create index if not exists leads_status_city_sector_idx on leads(status, city, sector);
create index if not exists leads_assigned_to_idx on leads(assigned_to);
create index if not exists leads_created_at_idx on leads(created_at desc);
create index if not exists idx_assignments_lead on assignments(lead_id);
create index if not exists idx_assignments_agent on assignments(agent_id);
create index if not exists idx_interactions_lead on interactions(lead_id);
create index if not exists idx_interactions_created on interactions(created_at desc);
create index if not exists idx_metrics_agent_date on metrics(agent_id, date);

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función para elegir agente por zona
create or replace function pick_agent_for_zone(p_zone text)
returns table(id uuid, name text, phone text, email text, active_leads int)
language sql as $$
  select 
    a.id, 
    u.name, 
    a.phone, 
    u.email,
    a.active_leads
  from agents a
  join users u on u.id = a.id
  where a.active_leads < a.capacity
    and u.active = true
    and a.notification_enabled = true
    and (a.zone = p_zone or a.zone = 'General')
  order by 
    a.active_leads asc, 
    a.last_assigned_at asc nulls first,
    random()
  limit 1;
$$;

-- Función para obtener estadísticas del dashboard
create or replace function get_dashboard_stats(p_agent_id uuid, p_days int default 30)
returns jsonb
language plpgsql as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total_leads', count(*),
    'nuevo', count(*) filter (where l.status = 'nuevo'),
    'contactado', count(*) filter (where l.status = 'contactado'),
    'en_progreso', count(*) filter (where l.status = 'en_progreso'),
    'ganado', count(*) filter (where l.status = 'ganado'),
    'perdido', count(*) filter (where l.status = 'perdido'),
    'conversion_rate', 
      case when count(*) > 0 
        then round((count(*) filter (where l.status = 'ganado')::numeric / count(*)) * 100, 2)
        else 0 
      end
  )
  into result
  from leads l
  join assignments a on a.lead_id = l.id
  where a.agent_id = p_agent_id
    and l.created_at >= now() - (p_days || ' days')::interval;
  
  return result;
end;
$$;

-- Función para actualizar métricas diarias
create or replace function update_daily_metrics()
returns void
language plpgsql as $$
begin
  insert into metrics (agent_id, date, leads_assigned, leads_contacted, leads_won, leads_lost)
  select 
    a.agent_id,
    current_date - 1 as date,
    count(*) as leads_assigned,
    count(*) filter (where l.status in ('CONTACTED', 'DEMO', 'WON', 'LOST')) as leads_contacted,
    count(*) filter (where l.status = 'WON') as leads_won,
    count(*) filter (where l.status = 'LOST') as leads_lost
  from assignments a
  join leads l on l.id = a.lead_id
  where a.assigned_at::date = current_date - 1
  group by a.agent_id
  on conflict (agent_id, date) do update
  set 
    leads_assigned = excluded.leads_assigned,
    leads_contacted = excluded.leads_contacted,
    leads_won = excluded.leads_won,
    leads_lost = excluded.leads_lost;
end;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at en leads
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
before update on users
for each row execute function update_updated_at();

-- Trigger para registrar cambios de estado
create or replace function log_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into interactions (lead_id, channel, message, metadata)
    values (
      new.id,
      'system',
      'Estado cambiado de ' || old.status || ' a ' || new.status,
      jsonb_build_object('old_status', old.status, 'new_status', new.status)
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger log_lead_status_change
after update on leads
for each row execute function log_status_change();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

alter table leads enable row level security;
alter table assignments enable row level security;
alter table interactions enable row level security;
alter table metrics enable row level security;

-- Política: webs públicas (anon) pueden insertar leads
create policy "public_insert_leads"
on leads for insert
to anon
with check (true);

-- Política: comerciales ven solo sus leads
create policy "agents_select_own_leads"
on leads for select
to authenticated
using (assigned_to = auth.uid());

-- Política: comerciales actualizan solo sus leads
create policy "agents_update_own_leads"
on leads for update
to authenticated
using (assigned_to = auth.uid())
with check (assigned_to = auth.uid());

-- Política: admins ven todo
create policy "admin_select_all"
on leads for select
using (auth.role() = 'admin');

-- Política: admins actualizan todo
create policy "admin_update_all"
on leads for update
using (auth.role() = 'admin')
with check (auth.role() = 'admin');

-- Política: admins pueden borrar
create policy "admin_delete_all"
on leads for delete
using (auth.role() = 'admin');

-- Política: todos ven sus asignaciones
create policy "Users see their assignments"
on assignments for select
using (
  agent_id = auth.uid() or
  exists (
    select 1 from users
    where users.id = auth.uid()
      and users.role = 'admin'
  )
);

-- Política: interacciones visibles según lead
create policy "Interactions visible per lead access"
on interactions for select
using (
  exists (
    select 1 from leads l
    join assignments a on a.lead_id = l.id
    where l.id = interactions.lead_id
      and (a.agent_id = auth.uid() or exists (
        select 1 from users u
        where u.id = auth.uid() and u.role = 'admin'
      ))
  )
);

-- Política: agentes pueden insertar interacciones en sus leads
create policy "Agents insert interactions on assigned leads"
on interactions for insert
with check (
  exists (
    select 1 from assignments a
    where a.lead_id = interactions.lead_id
      and a.agent_id = auth.uid()
  )
);

-- Política: métricas visibles según agente
create policy "Metrics visible per agent"
on metrics for select
using (
  agent_id = auth.uid() or
  exists (
    select 1 from users
    where users.id = auth.uid()
      and users.role = 'admin'
  )
);

-- =====================================================
-- DATOS INICIALES (OPCIONAL - comentar si no necesitas)
-- =====================================================

-- Insertar zonas predefinidas (opcional, puedes gestionar desde la app)
-- insert into assignment_rules (name, zone, conditions) values
-- ('Garraf Business Hours', 'Garraf', '{"time_range": "09:00-18:00", "weekdays": [1,2,3,4,5]}'),
-- ('Barcelona Business Hours', 'Barcelona', '{"time_range": "09:00-18:00", "weekdays": [1,2,3,4,5]}');

-- =====================================================
-- SCHEDULED JOBS (ejecutar manualmente o con pg_cron)
-- =====================================================

-- Para actualizar métricas diarias, ejecutar:
-- select update_daily_metrics();

-- O configurar pg_cron (si está habilitado en Supabase):
-- select cron.schedule('update-daily-metrics', '0 1 * * *', 'select update_daily_metrics()');
