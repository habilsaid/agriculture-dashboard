import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wzwvwatmzyaiyhwkcokv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d3Z3YXRtenlhaXlod2tjb2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODU5NzAsImV4cCI6MjA2NTU2MTk3MH0.DdZVRU4qxo_9wfG3S26Qe07BhUIclhxVZNeZ4cNBfGo'

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  }
})

// Test connection on initialization
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .limit(1)
      
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Supabase connection test failed:', err)
    return false
  }
}

// Export both supabase client and connection tester
export { supabase, testConnection }