const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables or hardcode them temporarily
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearSubscriptions() {
  console.log('🗑️ Clearing all subscriptions for testing...')

  const { data, error } = await supabase
    .from('subscriptions')
    .delete()
    .gte('created_at', '2000-01-01') // Delete all rows with a date condition

  if (error) {
    console.error('❌ Error clearing subscriptions:', error)
    return
  }

  console.log('✅ All subscriptions cleared')

  // Verify they're gone
  const { data: remaining, error: checkError } = await supabase
    .from('subscriptions')
    .select('*')

  if (!checkError) {
    console.log('📊 Remaining subscriptions:', remaining.length)
  }
}

clearSubscriptions().then(() => process.exit(0))
