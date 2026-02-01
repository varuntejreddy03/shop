import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://csniddtrkxtwxnlpwrly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbmlkZHRya3h0d3hubHB3cmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTk1NTAsImV4cCI6MjA4NTUzNTU1MH0.40JvnW6i3xQrF2Sx_F7QabhRYIT6tl3RLUKmlPyjmv0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSchema() {
  try {
    const sql = readFileSync('supabase-schema.sql', 'utf8');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing schema:', error);
    } else {
      console.log('Schema executed successfully:', data);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runSchema();