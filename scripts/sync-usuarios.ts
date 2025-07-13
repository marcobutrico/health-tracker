import { syncAuthUsersToUsuarios } from '../lib/supabase'

syncAuthUsersToUsuarios().then(() => {
  console.log('Sincronização finalizada!')
  process.exit(0)
}) 