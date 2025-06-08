const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function testProductsFetch() {
  console.log('Testing products fetch like the pricing page...');
  
  try {
    // This should match what the pricing page does
    const { data, error } = await supabase
      .from('products')
      .select('*, prices(*)')
      .eq('active', true)
      .eq('prices.active', true)
      .order('metadata->index')
      .order('unit_amount', { referencedTable: 'prices' });

    console.log('Fetch successful!');
    console.log('Products found:', data?.length || 0);
    
    if (data && data.length > 0) {
      data.forEach((product, i) => {
        console.log(`\n--- Product ${i + 1} ---`);
        console.log('ID:', product.id);
        console.log('Name:', product.name);
        console.log('Description:', product.description);
        console.log('Active:', product.active);
        console.log('Metadata:', product.metadata);
        console.log('Prices:', product.prices?.length || 0);
        
        if (product.prices && product.prices.length > 0) {
          product.prices.forEach((price, j) => {
            console.log(`  Price ${j + 1}:`, {
              id: price.id,
              amount: price.unit_amount,
              currency: price.currency,
              interval: price.interval
            });
          });
        }
      });
    }

    if (error) {
      console.error('Query error:', error);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testProductsFetch();
