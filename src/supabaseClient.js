import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xgtiunoqpsycjzaaffph.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndGl1bm9xcHN5Y2p6YWFmZnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjg0MzMsImV4cCI6MjA3NDkwNDQzM30.m_BqR4vlQBeb9XN3B7l76D53s_E_XbO9k4eJcl7nEUc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)