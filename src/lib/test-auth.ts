import { supabase } from '@/lib/supabase/client'

export async function createTestUser() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    })

    if (error) {
      console.error('Error creating test user:', error.message)
      return null
    }

    console.log('Test user created:', data)
    return data
  } catch (err) {
    console.error('Failed to create test user:', err)
    return null
  }
}

export async function signInTestUser() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    })

    if (error) {
      console.error('Error signing in test user:', error.message)
      return null
    }

    console.log('Test user signed in:', data)
    return data
  } catch (err) {
    console.error('Failed to sign in test user:', err)
    return null
  }
}
