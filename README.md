# 🚀 CodeTix CRM - Sistema de Gestión de Leads

Sistema completo de CRM diseñado para equipos comerciales distribuidos por zonas, con asignación automática de leads y notificaciones por WhatsApp.

## ✨ Características

- ✅ **Asignación automática** por zona geográfica
- ✅ **Notificaciones WhatsApp** (360dialog/Twilio)
- ✅ **Panel comercial** con leads asignados
- ✅ **Dashboard admin** con métricas y gestión
- ✅ **PWA instalable** (funciona offline parcialmente)
- ✅ **API webhook** para recibir leads desde cualquier fuente
- ✅ **Historial completo** de interacciones
- ✅ **Multi-estado** (NEW → CONTACTED → DEMO → WON/LOST)

## 🛠️ Stack Tecnológico

- **Frontend/Backend**: Next.js 14 (App Router)
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estilos**: Tailwind CSS
- **Hosting**: Vercel
- **WhatsApp**: 360dialog o Twilio

## 📋 Requisitos Previos

- Node.js 18+
- Cuenta en Supabase
- Cuenta en Vercel (opcional, puedes usar otro hosting)
- API de WhatsApp Business (360dialog o Twilio) - opcional

## 🚀 Instalación Paso a Paso

### 1. Clonar y configurar el proyecto

```bash
# Descargar el proyecto
cd codetix-crm

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
```

### 2. Configurar Supabase

1. **Crear proyecto** en [supabase.com](https://supabase.com)
2. **Ejecutar el schema SQL**:
   - Ir a SQL Editor en Supabase
   - Copiar y ejecutar todo el contenido de `supabase/schema.sql`

3. **Obtener credenciales**:
   - Project Settings → API
   - Copiar `URL`, `anon key` y `service_role key`

4. **Actualizar `.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Crear usuarios iniciales

**Opción A: Desde Supabase Dashboard**
- Authentication → Add user
- Email: `admin@codetix.com`
- Password: tu password
- Auto Confirm User: ✅

**Opción B: Desde SQL Editor**

```sql
-- Crear admin
INSERT INTO users (email, name, role) 
VALUES ('admin@codetix.com', 'Admin CodeTix', 'admin');

-- Crear agente de prueba
INSERT INTO users (email, name, role) 
VALUES ('agente@codetix.com', 'Comercial Test', 'agent');

-- Configurar agente
INSERT INTO agents (id, phone, zone, capacity)
SELECT id, '+34600111222', 'Garraf', 10
FROM users WHERE email = 'agente@codetix.com';
```

### 4. Probar localmente

```bash
npm run dev
# Abrir http://localhost:3000
```

### 5. Configurar WhatsApp (Opcional)

**Opción A: 360dialog**

1. Registrarse en [360dialog.com](https://www.360dialog.com)
2. Obtener API Key y Phone ID
3. Actualizar `.env.local`:

```env
WHATSAPP_PROVIDER=360dialog
WHATSAPP_API_KEY=tu-api-key
WHATSAPP_API_URL=https://waba.360dialog.io/v1/messages
WHATSAPP_PHONE_ID=tu-phone-id
```

**Opción B: Twilio**

```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 6. Desplegar en Vercel

```bash
# Instalar CLI de Vercel
npm i -g vercel

# Desplegar
vercel

# Configurar variables de entorno en Vercel Dashboard
# Settings → Environment Variables
```

## 📡 Uso del Webhook

### Endpoint

```
POST https://tu-dominio.vercel.app/api/leads/intake
```

### Payload de ejemplo

```json
{
  "name": "Juan Pérez",
  "phone": "+34600111222",
  "email": "juan@example.com",
  "city": "Vilanova i la Geltrú",
  "postal_code": "08800",
  "source": "Landing Page",
  "notes": "Interesado en web + chatbot",
  "priority": 1
}
```

### Campos

- `name` (requerido): Nombre del lead
- `phone`: Teléfono (formato: +34...)
- `email`: Email
- `city`: Ciudad
- `postal_code`: Código postal (usado para asignar zona)
- `source`: Origen del lead
- `notes`: Notas adicionales
- `priority`: 1-5 (default: 1)

### Respuesta exitosa

```json
{
  "ok": true,
  "lead": {
    "id": "uuid",
    "name": "Juan Pérez",
    "zone": "Garraf",
    "status": "NEW"
  },
  "agent": {
    "id": "uuid",
    "name": "Comercial Test"
  }
}
```

## 🔗 Integración con Google Sheets

### Google Apps Script

```javascript
function sendLeadToCRM() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  // Obtener datos de la última fila
  const data = sheet.getRange(lastRow, 1, 1, 6).getValues()[0];
  
  const lead = {
    name: data[0],
    phone: data[1],
    email: data[2],
    city: data[3],
    postal_code: data[4],
    source: 'Google Sheets',
    notes: data[5]
  };
  
  const url = 'https://tu-dominio.vercel.app/api/leads/intake';
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(lead),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  if (result.ok) {
    // Marcar como enviado
    sheet.getRange(lastRow, 7).setValue('✓ Enviado a CRM');
  } else {
    sheet.getRange(lastRow, 7).setValue('❌ Error: ' + result.error);
  }
}

// Ejecutar automáticamente al agregar fila
function onEdit(e) {
  const range = e.range;
  if (range.getColumn() === 1 && range.getRow() > 1) {
    sendLeadToCRM();
  }
}
```

## 📊 Zonas Configuradas

| Código Postal | Zona       |
|---------------|------------|
| 08800-08899   | Garraf     |
| 08001-08042   | Barcelona  |
| 08100-08299   | Barcelona  |
| Otros         | General    |

**Personalizar zonas**: Editar función `getZoneFromPostalCode` en `lib/utils.ts`

## 🎯 Flujo de Trabajo

1. **Lead entra** (webhook, manual, Google Sheets)
2. **Sistema determina zona** (por código postal)
3. **Asigna automáticamente** al agente disponible de esa zona
4. **Notifica al agente** por WhatsApp (si está configurado)
5. **Agente contacta** y actualiza estado
6. **Se registra historial** de todas las interacciones

## 🔐 Roles de Usuario

### Admin
- Ver todos los leads
- Ver métricas globales
- Gestionar agentes
- Reasignar leads

### Agent
- Ver solo sus leads asignados
- Actualizar estados
- Agregar notas
- Contactar por WhatsApp

## 📱 Instalación como PWA

1. Abrir el CRM en el navegador móvil
2. Chrome/Safari → Menú → "Agregar a pantalla de inicio"
3. La app funciona como app nativa

## 🧪 Testing

### Crear lead de prueba (cURL)

```bash
curl -X POST https://tu-dominio.vercel.app/api/leads/intake \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "phone": "+34600222333",
    "email": "test@example.com",
    "city": "Vilanova",
    "postal_code": "08800",
    "source": "Test",
    "notes": "Lead de prueba"
  }'
```

### Verificar WhatsApp configurado

```bash
curl https://tu-dominio.vercel.app/api/notify/whatsapp
```

## 🐛 Troubleshooting

### Los leads no se asignan automáticamente

1. Verificar que hay agentes activos en la zona
2. Comprobar que el agente no superó su capacidad
3. Revisar logs en Vercel

### WhatsApp no envía mensajes

1. Verificar API Key en variables de entorno
2. Comprobar formato del teléfono (+34...)
3. Verificar que el número está registrado en WhatsApp Business

### No puedo hacer login

1. Verificar que creaste el usuario en Supabase Auth
2. Comprobar que las credenciales de Supabase son correctas
3. Revisar consola del navegador para errores

## 📈 Próximas Funcionalidades (Roadmap)

- [ ] Notificaciones Push
- [ ] Plantillas de mensajes WhatsApp
- [ ] Integración con Google Calendar
- [ ] Reportes avanzados (gráficos)
- [ ] SLA y alertas automáticas
- [ ] App móvil nativa (React Native)
- [ ] Integración con Zapier/Make
- [ ] Llamadas VoIP integradas

## 🤝 Contribuir

Este es un proyecto de código abierto. Pull requests son bienvenidos.

## 📄 Licencia

MIT License - Libre para uso comercial y personal

## 📞 Soporte

Para dudas o problemas:
- Crear issue en GitHub
- Email: support@codetix.com

---

**CodeTix CRM** - Gestión inteligente de leads para equipos comerciales 🚀
