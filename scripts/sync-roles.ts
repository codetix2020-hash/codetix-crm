import 'dotenv/config'

import { updateUserRoles } from '@/lib/auth/updateUserRoles'

async function main() {
  console.log('🔄 Sincronizando roles de usuarios...')
  try {
    const result = await updateUserRoles()
    console.log('📊 Resumen de sincronización:')
    console.log(`   Total de usuarios: ${result.totalUsers}`)
    console.log(`   Actualizados correctamente: ${result.updatedCount}`)
    console.log(`   Con errores: ${result.errorsCount}`)
    console.log('   Detalles:', JSON.stringify(result.details, null, 2))
    process.exit(0)
  } catch (error) {
    console.error('❌ Error durante la sincronización de roles:', error)
    process.exit(1)
  }
}

main()

