# 🚀 Guía de Inicio Rápido - CodeTix CRM

## ⚡ Setup en 10 Minutos

### 1️⃣ Instalar Dependencias (2 min)

```bash
npm install
```

### 2️⃣ Configurar Supabase (3 min)

1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Ir a **SQL Editor** y ejecutar `supabase/schema.sql`
4. Copiar credenciales desde **Settings → API**

### 3️⃣ Variables de Entorno (1 min)

```bash
cp .env.example .env.local
```

Editar `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

### 4️⃣ Crear Usuario Admin (2 min)

**Opción A - Dashboard:**
- Supabase → Authentication → Add user
- Email: `admin@tudominio.com`
- Password: (tu contraseña)
- ✅ Auto Confirm User

**Opción B - SQL:**
```sql
INSERT INTO users (email, name, role) 
VALUES ('admin@tudominio.com', 'Tu Nombre', 'admin');
```

### 5️⃣ Probar Localmente (1 min)

```bash
npm run dev
# Abrir http://localhost:3000
# Login con las credenciales creadas
```

### 6️⃣ Crear Agente de Prueba (1 min)

```sql
-- Crear usuario
INSERT INTO users (email, name, role) 
VALUES ('agente@test.com', 'Agente Test', 'agent');

-- Configurar como agente
INSERT INTO agents (id, phone, zone, capacity)
SELECT id, '+34600111222', 'Garraf', 10
FROM users WHERE email = 'agente@test.com';
```

---

## 🧪 Probar el Sistema

### Enviar Lead de Prueba

```bash
curl -X POST http://localhost:3000/api/leads/intake \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "phone": "+34600222333",
    "email": "test@example.com",
    "postal_code": "08800",
    "city": "Vilanova",
    "source": "Test"
  }'
```

**Resultado esperado:**
- El lead se crea automáticamente
- Se asigna al agente de la zona Garraf
- Aparece en el dashboard del agente

---

## 🌐 Desplegar en Vercel (Opcional)

```bash
# Instalar CLI
npm i -g vercel

# Desplegar
vercel

# Configurar variables de entorno en dashboard
```

---

## 📊 Flujo Básico

```
1. Lead entra → /api/leads/intake
2. Sistema detecta zona por CP
3. Asigna a agente disponible
4. Notifica por WhatsApp (si configurado)
5. Agente ve lead en /dashboard
6. Agente actualiza estado
7. Se registra historial
```

---

## 🔑 Accesos por Rol

### Admin
- URL: `/dashboard/admin`
- Ver: Todos los leads, métricas, agentes

### Agente
- URL: `/dashboard`
- Ver: Solo sus leads asignados

---

## 📱 WhatsApp (Opcional)

Si querés notificaciones automáticas:

1. Registrate en [360dialog.com](https://www.360dialog.com)
2. Obtén API Key
3. Agregá a `.env.local`:

```env
WHATSAPP_API_KEY=tu-api-key
WHATSAPP_API_URL=https://waba.360dialog.io/v1/messages
WHATSAPP_PHONE_ID=tu-phone-id
```

---

## 🆘 Problemas Comunes

### No puedo hacer login
- Verificá que creaste el usuario en Supabase Auth
- Revisá las variables de entorno

### Los leads no se asignan
- Verificá que hay agentes activos
- Revisá que el CP coincide con alguna zona

### Error 500 en la API
- Revisá logs en la consola
- Verificá las credenciales de Supabase

---

## 📚 Próximos Pasos

1. ✅ Sistema funcionando → Personalizá las zonas en `lib/utils.ts`
2. 🔗 Integrá con Google Sheets → Usá `scripts/google-sheets-integration.gs`
3. 📱 Configurá WhatsApp → Seguí la guía en README.md
4. 🚀 Desplegá en producción → `vercel --prod`

---

## 💡 Tips

- Usá códigos postales reales para testing
- Creá varios agentes en diferentes zonas
- El sistema balancea carga automáticamente
- Podés cambiar zona/capacidad de agentes desde SQL

---

¿Todo funcionando? 🎉 
Leé el **README.md** completo para funcionalidades avanzadas.
