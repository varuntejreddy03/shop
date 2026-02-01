import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csniddtrkxtwxnlpwrly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbmlkZHRya3h0d3hubHB3cmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTk1NTAsImV4cCI6MjA4NTUzNTU1MH0.40JvnW6i3xQrF2Sx_F7QabhRYIT6tl3RLUKmlPyjmv0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('Testing database connection...');
  
  try {
    // Test customers table
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (customersError) {
      console.error('Customers table error:', customersError);
    } else {
      console.log('✓ Customers table accessible');
    }

    // Test orders table
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (ordersError) {
      console.error('Orders table error:', ordersError);
    } else {
      console.log('✓ Orders table accessible');
    }

    // Test order_items table
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .limit(1);
    
    if (itemsError) {
      console.error('Order items table error:', itemsError);
    } else {
      console.log('✓ Order items table accessible');
    }

    // Test insert operation
    console.log('Testing insert operation...');
    const { data: testCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({ name: 'Test Customer', phone: '1234567890' })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('✓ Insert operation successful:', testCustomer);
      
      // Clean up test data
      await supabase.from('customers').delete().eq('id', testCustomer.id);
      console.log('✓ Test data cleaned up');
    }

  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase();