# Scripts de Mantenimiento

## removeDuplicateLeads.ts

Script para eliminar leads duplicados en Supabase basándose en email o teléfono.

### Requisitos

- Tener las variables de entorno configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Uso

```bash
npx tsx scripts/removeDuplicateLeads.ts
```

### Qué hace

1. Busca todos los leads en la base de datos
2. Identifica duplicados por email o teléfono
3. Mantiene el primer registro (más antiguo) y elimina los duplicados
4. Muestra un resumen de la operación

### Notas

- El script usa el Service Role Key para tener permisos de admin
- Los leads sin email ni teléfono son ignorados pero se muestra un warning
- El script mantiene el registro más antiguo (created_at) de cada duplicado
