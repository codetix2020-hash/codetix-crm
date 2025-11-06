# 📦 CodeTix CRM - Proyecto Completo

## ✅ Contenido del Paquete

### 📁 Estructura Creada (33 archivos)

```
codetix-crm/
├── 📄 Configuración Base
│   ├── package.json           # Dependencias del proyecto
│   ├── tsconfig.json          # Configuración TypeScript
│   ├── next.config.js         # Configuración Next.js
│   ├── tailwind.config.js     # Configuración Tailwind
│   ├── postcss.config.js      # PostCSS
│   ├── .env.example           # Variables de entorno (template)
│   ├── .gitignore            # Archivos a ignorar en Git
│   ├── README.md             # Documentación completa
│   └── QUICKSTART.md         # Guía de inicio rápido
│
├── 📚 Base de Datos
│   ├── supabase/schema.sql       # Schema completo (tablas, funciones, RLS)
│   └── supabase/sample-data.sql  # Datos de prueba
│
├── 🛠️ Biblioteca (lib/)
│   ├── supabase.ts            # Cliente Supabase + tipos
│   ├── utils.ts               # Funciones de utilidad
│   └── whatsapp.ts            # Integración WhatsApp (360dialog/Twilio)
│
├── 🎨 Componentes (components/)
│   ├── StatusBadge.tsx        # Badge de estado del lead
│   ├── LeadCard.tsx           # Tarjeta de lead
│   └── Navbar.tsx             # Barra de navegación
│
├── 🌐 Páginas (app/)
│   ├── layout.tsx             # Layout principal
│   ├── globals.css            # Estilos globales
│   ├── page.tsx               # Login
│   ├── dashboard/
│   │   ├── layout.tsx         # Layout dashboard
│   │   ├── page.tsx           # Panel comercial
│   │   └── admin/
│   │       └── page.tsx       # Panel admin
│   └── leads/
│       └── [id]/
│           └── page.tsx       # Detalle de lead
│
├── 🔌 API Routes (app/api/)
│   ├── leads/
│   │   ├── intake/route.ts    # Webhook entrada de leads
│   │   ├── my/route.ts        # Leads del agente
│   │   └── [id]/route.ts      # Detalle/actualización lead
│   ├── notify/
│   │   └── whatsapp/route.ts  # Envío WhatsApp
│   └── admin/
│       ├── leads/route.ts     # Admin: todos los leads
│       ├── agents/route.ts    # Admin: lista de agentes
│       └── stats/route.ts     # Admin: estadísticas globales
│
├── 📱 PWA
│   └── public/
│       └── manifest.json      # Manifest para app instalable
│
└── 🔧 Scripts
    └── scripts/
        └── google-sheets-integration.gs  # Script para Google Sheets
```

---

## 🎯 Características Implementadas

### ✅ Core Features
- [x] Asignación automática de leads por zona geográfica
- [x] Notificaciones WhatsApp (360dialog/Twilio)
- [x] Panel comercial con filtros por estado
- [x] Dashboard admin con métricas
- [x] Historial completo de interacciones
- [x] Actualización de estados (NEW → CONTACTED → DEMO → WON/LOST)
- [x] Sistema de notas por lead
- [x] Webhook API para recibir leads

### ✅ Seguridad & Auth
- [x] Autenticación con Supabase
- [x] Row Level Security (RLS)
- [x] Roles: Admin y Agent
- [x] Validación de inputs
- [x] Sanitización de datos

### ✅ Integraciones
- [x] WhatsApp Business API (360dialog/Twilio)
- [x] Google Sheets (script incluido)
- [x] Webhook REST API

### ✅ UI/UX
- [x] Diseño responsive (mobile-first)
- [x] PWA instalable
- [x] Loading states
- [x] Error handling
- [x] Badges de estado coloridos
- [x] Timestamps relativos

---

## 🚀 Stack Tecnológico

| Componente | Tecnología | Motivo |
|------------|-----------|--------|
| Frontend | Next.js 14 (App Router) | SSR, API Routes, optimal para SEO |
| Backend | Next.js API Routes | Todo en uno, deploy simple |
| Base de Datos | Supabase (PostgreSQL) | Managed, RLS, Auth integrado |
| Autenticación | Supabase Auth | Seguro, fácil integración |
| Estilos | Tailwind CSS | Rápido, utility-first |
| Hosting | Vercel | Deploy automático, edge functions |
| WhatsApp | 360dialog/Twilio | Oficial, confiable |

---

## 📊 Modelo de Datos

### Tablas Principales

**users** (6 campos)
- id, email, name, role (admin/agent), active, created_at

**agents** (7 campos)
- id (FK users), phone, zone, capacity, active_leads, last_assigned_at, notification_enabled

**leads** (13 campos)
- id, name, phone, email, city, postal_code, zone, source, notes, status, priority, created_at, updated_at

**assignments** (5 campos)
- id, lead_id, agent_id, method (auto/manual), assigned_at

**interactions** (7 campos)
- id, lead_id, agent_id, channel, message, metadata, created_at

**metrics** (9 campos)
- id, agent_id, date, leads_assigned, leads_contacted, leads_won, leads_lost, avg_response_time_minutes, created_at

---

## 🔐 Variables de Entorno Requeridas

```env
# Supabase (OBLIGATORIAS)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# WhatsApp - 360dialog (OPCIONALES)
WHATSAPP_PROVIDER=360dialog
WHATSAPP_API_KEY=
WHATSAPP_API_URL=https://waba.360dialog.io/v1/messages
WHATSAPP_PHONE_ID=

# WhatsApp - Twilio (ALTERNATIVA)
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
```

---

## 📡 API Endpoints

### Públicos

**POST /api/leads/intake**
- Crear lead y asignar automáticamente
- Body: `{ name, phone?, email?, city?, postal_code?, source?, notes? }`
- Auth: No requerida (para webhooks externos)

**GET /api/leads/intake**
- Verificar que el servicio está activo

### Autenticados (Agentes)

**GET /api/leads/my**
- Obtener leads asignados al agente
- Query params: `?status=NEW&limit=50&offset=0`

**GET /api/leads/[id]**
- Detalle de un lead específico

**PATCH /api/leads/[id]**
- Actualizar lead (estado, notas, etc)

**POST /api/notify/whatsapp**
- Enviar mensaje WhatsApp
- Body: `{ lead_id?, to, message }`

### Admin

**GET /api/admin/leads**
- Todos los leads del sistema

**GET /api/admin/agents**
- Lista de agentes con carga

**GET /api/admin/stats**
- Estadísticas globales

---

## 🎨 Componentes Reutilizables

### StatusBadge
```tsx
<StatusBadge status="NEW" showEmoji={true} />
```

### LeadCard
```tsx
<LeadCard lead={leadObject} showActions={true} />
```

### Navbar
```tsx
<Navbar /> // Auto-detecta rol y muestra menú apropiado
```

---

## 🧪 Testing

### Crear Lead (cURL)
```bash
curl -X POST http://localhost:3000/api/leads/intake \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"+34600111222","postal_code":"08800"}'
```

### Verificar WhatsApp
```bash
curl http://localhost:3000/api/notify/whatsapp
```

---

## 📈 Métricas Implementadas

### Por Agente
- Total de leads asignados
- Leads por estado (NEW, CONTACTED, DEMO, WON, LOST)
- Tasa de conversión
- Últimas 30 días

### Globales (Admin)
- Total de leads histórico
- Leads hoy
- Agentes activos
- Conversión promedio

---

## 🔄 Flujo de Asignación

```
1. Lead entra vía webhook
2. Sistema detecta zona por código postal
3. Busca agente disponible:
   - Zona coincidente
   - Capacidad no superada
   - Menos carga actual
   - Notificaciones habilitadas
4. Asigna y registra
5. Actualiza contador agente
6. Notifica por WhatsApp (si configurado)
7. Lead aparece en dashboard agente
```

---

## 🌍 Zonas Configuradas por Defecto

| CP Range | Zona | Ejemplo |
|----------|------|---------|
| 08800-08899 | Garraf | Vilanova, Sitges |
| 08001-08042 | Barcelona | Barcelona centro |
| 08100-08299 | Barcelona | Área metropolitana |
| Otros | General | Resto de España |

**Personalizar**: Editar `lib/utils.ts` → `getZoneFromPostalCode()`

---

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción local
npm run start

# Desplegar Vercel
vercel --prod

# Ver logs (Vercel)
vercel logs
```

---

## 📦 Dependencias Principales

```json
{
  "@supabase/supabase-js": "^2.39.0",
  "next": "14.1.0",
  "react": "^18.2.0",
  "tailwindcss": "^3.4.1"
}
```

**Tamaño total**: ~200KB (sin node_modules)

---

## 🚀 Pasos de Despliegue

1. ✅ Ejecutar `npm install`
2. ✅ Configurar Supabase (schema.sql)
3. ✅ Copiar variables de entorno
4. ✅ Crear usuarios iniciales
5. ✅ Probar localmente
6. ✅ Desplegar en Vercel
7. ✅ Configurar WhatsApp (opcional)
8. ✅ Probar webhook en producción

---

## 🎓 Recursos Incluidos

- 📖 README.md completo (300+ líneas)
- ⚡ QUICKSTART.md (setup en 10 min)
- 🗄️ Schema SQL documentado
- 📊 Datos de prueba (sample-data.sql)
- 📝 Script Google Sheets completo
- 💬 Ejemplos de integración

---

## 🔮 Roadmap Sugerido

### Fase 2
- [ ] Notificaciones Push
- [ ] Plantillas WhatsApp personalizables
- [ ] Calendario integrado
- [ ] Reportes con gráficos

### Fase 3
- [ ] SLA tracking y alertas
- [ ] Integración Zapier/Make
- [ ] App móvil nativa
- [ ] IA para scoring de leads

---

## 💰 Costes Estimados (Producción)

| Servicio | Plan | Coste Mensual |
|----------|------|---------------|
| Vercel | Pro | €20 (opcional, Hobby gratis) |
| Supabase | Pro | €25 (Starter gratis hasta 500MB) |
| 360dialog | Pay-as-go | €0.005-0.01 por mensaje |
| **Total** | | **€0-45/mes** + WhatsApp variable |

Para 1000 leads/mes + 2000 mensajes WA → ~€50-70/mes

---

## 📞 Soporte

**Documentación completa**: `README.md`
**Setup rápido**: `QUICKSTART.md`
**Schema DB**: `supabase/schema.sql`
**Google Sheets**: `scripts/google-sheets-integration.gs`

---

## ✨ Lo Más Destacado

1. **Todo-en-uno**: Frontend + Backend + DB en un solo proyecto
2. **Production-ready**: RLS, sanitización, error handling
3. **Extensible**: Fácil agregar nuevas zonas, estados, integraciones
4. **Bien documentado**: 3 guías + comentarios en código
5. **Testing-friendly**: Datos de prueba incluidos
6. **Mobile-first**: PWA instalable, responsive

---

## 🎉 ¡Listo para Usar!

**Todo el código está en**: `/mnt/user-data/outputs/codetix-crm/`

**Próximo paso**: Seguir `QUICKSTART.md` para configuración inicial

---

*CodeTix CRM v1.0 - Gestión inteligente de leads para equipos comerciales* 🚀
