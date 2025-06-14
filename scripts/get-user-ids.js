#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Read environment variables from process.env (they'll be loaded by Next.js dev server context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
)

async function getUserIds() {
  console.log('🔍 Getting user IDs from profiles table...')

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .limit(10)

    if (error) {
      console.error('❌ Error fetching profiles:', error)
      return
    }

    console.log(`📊 Found ${profiles.length} users:`)
    profiles.forEach((profile, index) => {
      console.log(
        `  ${index + 1}. ID: ${profile.id} | Name: ${profile.full_name || 'N/A'} | Username: ${profile.username || 'N/A'}`
      )
    })

    if (profiles.length > 0) {
      console.log(`\n✅ Using first user ID for tests: ${profiles[0].id}`)
      return profiles[0].id
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

getUserIds()
