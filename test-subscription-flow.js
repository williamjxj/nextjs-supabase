// Test script to verify subscription flow
const { createClient } = require('@supabase/supabase-js');

async function testSubscriptionFlow() {
  console.log('🧪 Testing subscription flow...');
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // 1. Test products fetch
    console.log('\n1️⃣ Testing products fetch...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*, prices(*)')
      .eq('active', true)
      .eq('prices.active', true);

    if (productsError) {
      console.error('❌ Products fetch failed:', productsError);
      return false;
    }

    console.log(`✅ Successfully fetched ${products.length} products`);
    products.forEach(product => {
      console.log(`  - ${product.name}: ${product.prices.length} prices`);
    });

    // 2. Test API endpoint
    console.log('\n2️⃣ Testing API endpoint...');
    const response = await fetch('http://localhost:3001/api/stripe/seed-plans');
    
    if (!response.ok) {
      console.error('❌ API endpoint failed:', response.status, response.statusText);
      return false;
    }

    const apiData = await response.json();
    console.log(`✅ API endpoint working: ${apiData.count} products seeded`);

    // 3. Test subscription table structure
    console.log('\n3️⃣ Testing subscription table structure...');
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*, prices(*, products(*))')
      .limit(1);

    if (subError) {
      console.error('❌ Subscription table query failed:', subError);
      return false;
    }

    console.log('✅ Subscription table structure is valid');

    console.log('\n🎉 All subscription flow tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return false;
  }
}

// Run the test
testSubscriptionFlow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
