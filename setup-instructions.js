import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csniddtrkxtwxnlpwrly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbmlkZHRya3h0d3hubHB3cmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTk1NTAsImV4cCI6MjA4NTUzNTU1MH0.40JvnW6i3xQrF2Sx_F7QabhRYIT6tl3RLUKmlPyjmv0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('Creating tables...');
  
  // Test connection first
  const { data: testData, error: testError } = await supabase.from('customers').select('count').limit(1);
  if (testError && testError.code === 'PGRST116') {
    console.log('Tables don\'t exist yet, this is expected.');
  }
  
  console.log('Schema needs to be run through Supabase Dashboard SQL Editor.');
  console.log('Please:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste the contents of supabase-schema.sql');
  console.log('5. Run the query');
}

createTables();