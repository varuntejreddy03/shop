import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csniddtrkxtwxnlpwrly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbmlkZHRya3h0d3hubHB3cmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTk1NTAsImV4cCI6MjA4NTUzNTU1MH0.40JvnW6i3xQrF2Sx_F7QabhRYIT6tl3RLUKmlPyjmv0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabase() {
  console.log('Adding missing pdf_path column to orders table...');
  
  try {
    // Add pdf_path column if it doesn't exist
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS pdf_path TEXT;'
    });
    
    if (error) {
      console.error('Error adding column:', error);
      // Try alternative approach using direct SQL
      console.log('Trying alternative approach...');
      
      // Check if column exists first
      const { data: columns, error: checkError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'orders')
        .eq('column_name', 'pdf_path');
        
      if (checkError) {
        console.error('Error checking columns:', checkError);
        return;
      }
      
      if (columns && columns.length === 0) {
        console.log('Column pdf_path does not exist, it needs to be added manually.');
        console.log('Please run this SQL in your Supabase SQL editor:');
        console.log('ALTER TABLE orders ADD COLUMN pdf_path TEXT;');
      } else {
        console.log('Column pdf_path already exists.');
      }
    } else {
      console.log('✓ pdf_path column added successfully');
    }
    
    // Test the fix
    console.log('Testing database structure...');
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('id, pdf_path')
      .limit(1);
      
    if (testError) {
      console.error('Test failed:', testError);
    } else {
      console.log('✓ Database structure is correct');
    }
    
  } catch (error) {
    console.error('Database fix failed:', error);
  }
}

fixDatabase();