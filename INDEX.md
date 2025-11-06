# 📑 Índice Rápido - CodeTix CRM

## 🎯 Para Empezar AHORA

1. **Primeros Pasos** → `QUICKSTART.md` (10 minutos)
2. **Documentación Completa** → `README.md`
3. **Resumen del Proyecto** → `PROJECT-SUMMARY.md`

---

## 📂 Archivos Clave por Tarea

### 🔧 Configuración Inicial

| Archivo | Propósito |
|---------|-----------|
| `.env.example` | Template variables de entorno |
| `package.json` | Dependencias del proyecto |
| `supabase/schema.sql` | **EJECUTAR PRIMERO** - Crear todas las tablas |
| `supabase/sample-data.sql` | Datos de prueba (opcional) |

### 🎨 Personalización UI

| Archivo | Qué Modificar |
|---------|---------------|
| `tailwind.config.js` | Colores, fuentes, tema |
| `app/globals.css` | Estilos globales |
| `components/StatusBadge.tsx` | Aspecto de badges |
| `components/LeadCard.tsx` | Tarjetas de leads |

### 🗺️ Gestión de Zonas

| Archivo | Función |
|---------|---------|
| `lib/utils.ts` → `getZoneFromPostalCode()` | **EDITAR AQUÍ** para cambiar zonas |

Ejemplo:
```typescript
// Agregar nueva zona
if (cp.startsWith('281')) return 'Madrid'
```

### 📡 API & Webhooks

| Endpoint | Archivo | Descripción |
|----------|---------|-------------|
| `/api/leads/intake` | `app/api/leads/intake/route.ts` | Recibir leads (webhook) |
| `/api/leads/my` | `app/api/leads/my/route.ts` | Leads del agente |
| `/api/notify/whatsapp` | `app/api/notify/whatsapp/route.ts` | Enviar WhatsApp |

### 💬 WhatsApp

| Archivo | Contenido |
|---------|-----------|
| `lib/whatsapp.ts` | Toda la lógica de WhatsApp |
| `.env.example` | Variables a configurar |

**Providers soportados**: 360dialog, Twilio

### 📊 Base de Datos

| Archivo | Descripción |
|---------|-------------|
| `supabase/schema.sql` | Schema completo (tablas + funciones + RLS) |
| `supabase/sample-data.sql` | Datos de prueba |
| `lib/supabase.ts` | Cliente y tipos TypeScript |

### 🔗 Integraciones

| Integración | Archivo |
|-------------|---------|
| Google Sheets | `scripts/google-sheets-integration.gs` |
| Landing Pages | Usar webhook `/api/leads/intake` |
| Zapier/Make | Usar webhook `/api/leads/intake` |

---

## 🚀 Comandos Más Usados

```bash
# Instalar
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Desplegar
vercel --prod
```

---

## 📋 Checklist de Setup

- [ ] 1. Ejecutar `npm install`
- [ ] 2. Crear proyecto en Supabase
- [ ] 3. Ejecutar `supabase/schema.sql`
- [ ] 4. Copiar credenciales a `.env.local`
- [ ] 5. Crear usuario admin en Supabase Auth
- [ ] 6. Insertar admin en tabla `users` (SQL)
- [ ] 7. Probar login en `http://localhost:3000`
- [ ] 8. Crear agente de prueba (SQL)
- [ ] 9. Probar webhook con cURL
- [ ] 10. (Opcional) Configurar WhatsApp

---

## 🔍 Buscar Algo Específico

### "¿Cómo cambio las zonas?"
→ `lib/utils.ts` → función `getZoneFromPostalCode()`

### "¿Cómo personalizo los estados de leads?"
→ Ver `supabase/schema.sql` línea ~65 (constraint en tabla `leads`)
→ Actualizar `lib/utils.ts` funciones `getStatus*`

### "¿Cómo agrego un nuevo campo al lead?"
1. Agregar columna en `supabase/schema.sql`
2. Actualizar tipo en `lib/supabase.ts`
3. Agregar campo en `app/api/leads/intake/route.ts`
4. Actualizar UI en `components/LeadCard.tsx`

### "¿Cómo cambio el sistema de asignación?"
→ `supabase/schema.sql` → función `pick_agent_for_zone()`

### "¿Cómo personalizo las notificaciones WhatsApp?"
→ `lib/whatsapp.ts` → funciones `notifyAgentNewLead()` y `sendFollowUpReminder()`

### "¿Cómo agrego más roles?"
1. Modificar constraint en tabla `users` (schema.sql)
2. Actualizar RLS policies
3. Agregar rutas en `components/Navbar.tsx`

---

## 📱 Pantallas Disponibles

| URL | Archivo | Rol | Descripción |
|-----|---------|-----|-------------|
| `/` | `app/page.tsx` | Público | Login |
| `/dashboard` | `app/dashboard/page.tsx` | Agent | Panel comercial |
| `/dashboard/admin` | `app/dashboard/admin/page.tsx` | Admin | Panel admin |
| `/leads/[id]` | `app/leads/[id]/page.tsx` | Agent | Detalle lead |

---

## 🎨 Componentes Reutilizables

```tsx
// Badge de estado
import StatusBadge from '@/components/StatusBadge'
<StatusBadge status="NEW" />

// Tarjeta de lead
import LeadCard from '@/components/LeadCard'
<LeadCard lead={leadObject} />

// Navbar
import Navbar from '@/components/Navbar'
<Navbar />
```

---

## 🔐 Seguridad

### Row Level Security (RLS)
- Implementado en todas las tablas principales
- Agentes solo ven sus leads
- Admins ven todo

### Validación
- Sanitización de inputs: `lib/utils.ts` → `sanitizeInput()`
- Validación en API routes

### Auth
- Supabase Auth (JWT)
- Verificación en cada API route

---

## 🧪 Testing

### Test Manual Rápido

```bash
# 1. Crear lead
curl -X POST http://localhost:3000/api/leads/intake \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Lead","phone":"+34600111222","postal_code":"08800"}'

# 2. Verificar en dashboard
# → Login como agente
# → Ver lead en lista

# 3. Actualizar estado
# → Click en lead
# → Cambiar estado

# 4. Verificar historial
# → Ver interacciones registradas
```

---

## 🐛 Problemas Comunes

| Problema | Solución | Archivo |
|----------|----------|---------|
| No puedo hacer login | Verificar usuario en Supabase Auth | - |
| Leads no se asignan | Verificar agentes activos en zona | `supabase/schema.sql` |
| Error 500 API | Revisar variables `.env.local` | `.env.example` |
| WhatsApp no funciona | Verificar API key y provider | `lib/whatsapp.ts` |
| Zona incorrecta | Ajustar lógica de CP | `lib/utils.ts` |

---

## 📞 Donde Buscar Ayuda

1. **README.md** → Documentación completa
2. **QUICKSTART.md** → Setup paso a paso
3. **PROJECT-SUMMARY.md** → Visión general
4. **Comentarios en código** → Cada archivo está documentado

---

## 🎯 Casos de Uso Típicos

### Caso 1: Agregar Nueva Zona
```typescript
// lib/utils.ts
export function getZoneFromPostalCode(postalCode: string): string {
  const cp = postalCode.trim()
  
  // Nueva zona: Valencia
  if (cp.startsWith('460')) return 'Valencia'
  
  // ... resto de zonas
}
```

### Caso 2: Cambiar Capacidad de Agente
```sql
UPDATE agents 
SET capacity = 20 
WHERE id = 'uuid-del-agente';
```

### Caso 3: Ver Carga de Trabajo
```sql
SELECT 
  u.name,
  a.zone,
  a.active_leads,
  a.capacity,
  round((a.active_leads::numeric / a.capacity) * 100) as carga_pct
FROM agents a
JOIN users u ON u.id = a.id
ORDER BY carga_pct DESC;
```

---

## 🎓 Recursos de Aprendizaje

### Next.js
- [Documentación oficial](https://nextjs.org/docs)
- [App Router](https://nextjs.org/docs/app)

### Supabase
- [Documentación](https://supabase.com/docs)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

### Tailwind CSS
- [Documentación](https://tailwindcss.com/docs)
- [Cheatsheet](https://nerdcave.com/tailwind-cheat-sheet)

---

## ✅ Lista de Archivos (33 total)

```
📦 codetix-crm/
├── 📄 .env.example
├── 📄 .gitignore
├── 📄 README.md ⭐
├── 📄 QUICKSTART.md ⭐
├── 📄 PROJECT-SUMMARY.md ⭐
├── 📄 INDEX.md (este archivo)
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 next.config.js
├── 📄 tailwind.config.js
├── 📄 postcss.config.js
│
├── 📁 app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── 📁 dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── 📁 admin/
│   │       └── page.tsx
│   ├── 📁 leads/
│   │   └── 📁 [id]/
│   │       └── page.tsx
│   └── 📁 api/
│       ├── 📁 leads/
│       │   ├── 📁 intake/
│       │   │   └── route.ts ⭐
│       │   ├── 📁 my/
│       │   │   └── route.ts
│       │   └── 📁 [id]/
│       │       └── route.ts
│       ├── 📁 notify/
│       │   └── 📁 whatsapp/
│       │       └── route.ts
│       └── 📁 admin/
│           ├── 📁 leads/
│           │   └── route.ts
│           ├── 📁 agents/
│           │   └── route.ts
│           └── 📁 stats/
│               └── route.ts
│
├── 📁 components/
│   ├── StatusBadge.tsx
│   ├── LeadCard.tsx
│   └── Navbar.tsx
│
├── 📁 lib/
│   ├── supabase.ts
│   ├── utils.ts ⭐
│   └── whatsapp.ts
│
├── 📁 public/
│   └── manifest.json
│
├── 📁 scripts/
│   └── google-sheets-integration.gs ⭐
│
└── 📁 supabase/
    ├── schema.sql ⭐⭐⭐
    └── sample-data.sql
```

⭐ = Archivo clave
⭐⭐⭐ = SUPER importante

---

**¡Empezá por QUICKSTART.md y en 10 minutos tenés el CRM funcionando!** 🚀
