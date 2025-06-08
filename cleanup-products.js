// Cleanup script to remove old duplicate products
const { createClient } = require('@supabase/supabase-js');

async function cleanupProducts() {
  console.log('🧹 Cleaning up old products...');
  
  // Initialize Supabase admin client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. First, list all products
    console.log('\n📋 Current products in database:');
    const { data: allProducts, error: listError } = await supabaseAdmin
      .from('products')
      .select('id, name, active, metadata');

    if (listError) {
      console.error('❌ Failed to list products:', listError);
      return;
    }

    allProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.id} - ${product.name} (active: ${product.active})`);
    });

    // 2. Identify products to keep (our new Vercel schema products)
    const productsToKeep = ['prod_standard', 'prod_premium', 'prod_commercial'];
    const productsToDelete = allProducts.filter(p => !productsToKeep.includes(p.id));

    console.log(`\n🎯 Products to keep: ${productsToKeep.join(', ')}`);
    console.log(`🗑️  Products to delete: ${productsToDelete.map(p => p.id).join(', ')}`);

    if (productsToDelete.length === 0) {
      console.log('✅ No cleanup needed - database is already clean!');
      return;
    }

    // 3. Delete old products (this will cascade to prices due to foreign key)
    for (const product of productsToDelete) {
      console.log(`\n🗑️  Deleting product: ${product.id} (${product.name})`);
      
      // First delete associated prices
      const { error: pricesDeleteError } = await supabaseAdmin
        .from('prices')
        .delete()
        .eq('product_id', product.id);

      if (pricesDeleteError) {
        console.error(`❌ Failed to delete prices for ${product.id}:`, pricesDeleteError);
        continue;
      }

      // Then delete the product
      const { error: productDeleteError } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', product.id);

      if (productDeleteError) {
        console.error(`❌ Failed to delete product ${product.id}:`, productDeleteError);
      } else {
        console.log(`✅ Successfully deleted ${product.id}`);
      }
    }

    // 4. Verify cleanup
    console.log('\n🔍 Final product list:');
    const { data: finalProducts } = await supabaseAdmin
      .from('products')
      .select('id, name, active')
      .order('metadata->index');

    finalProducts?.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.id} - ${product.name}`);
    });

    console.log('\n🎉 Database cleanup completed!');

  } catch (error) {
    console.error('❌ Cleanup failed with exception:', error);
  }
}

// Run the cleanup
cleanupProducts();
