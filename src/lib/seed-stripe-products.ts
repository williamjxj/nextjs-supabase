import { stripe } from '@/lib/stripe'

interface CreateProductParams {
  name: string
  description: string
  prices: {
    amount: number // in cents
    interval: 'month' | 'year'
    trial_period_days?: number
  }[]
}

const subscriptionProducts: CreateProductParams[] = [
  {
    name: 'Basic Plan',
    description: 'Perfect for casual users. 50 downloads per month, access to standard gallery.',
    prices: [
      {
        amount: 999, // $9.99
        interval: 'month',
        trial_period_days: 7
      },
      {
        amount: 9900, // $99.00 (save ~17%)
        interval: 'year',
        trial_period_days: 7
      }
    ]
  },
  {
    name: 'Pro Plan', 
    description: 'For power users and professionals. 200 downloads per month, priority support.',
    prices: [
      {
        amount: 1999, // $19.99
        interval: 'month',
        trial_period_days: 7
      },
      {
        amount: 19900, // $199.00 (save ~17%)
        interval: 'year', 
        trial_period_days: 7
      }
    ]
  },
  {
    name: 'Enterprise Plan',
    description: 'Unlimited everything. Perfect for teams and businesses.',
    prices: [
      {
        amount: 4999, // $49.99
        interval: 'month',
        trial_period_days: 14
      },
      {
        amount: 49900, // $499.00 (save ~17%)
        interval: 'year',
        trial_period_days: 14
      }
    ]
  }
]

async function createProduct(productData: CreateProductParams) {
  try {
    // Create product in Stripe
    const product = await stripe.products.create({
      name: productData.name,
      description: productData.description,
      metadata: {
        type: 'subscription'
      }
    })

    console.log(`✅ Created product: ${product.name} (${product.id})`)

    // Create prices for this product
    for (const priceData of productData.prices) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceData.amount,
        currency: 'usd',
        recurring: {
          interval: priceData.interval,
          trial_period_days: priceData.trial_period_days
        },
        metadata: {
          type: 'subscription'
        }
      })

      console.log(`  ✅ Created price: $${priceData.amount/100}/${priceData.interval} (${price.id})`)
    }

    return product
  } catch (error) {
    console.error(`❌ Failed to create product ${productData.name}:`, error)
    throw error
  }
}

async function seedStripeProducts() {
  console.log('🌱 Seeding Stripe products...')
  
  try {
    // Check if products already exist
    const existingProducts = await stripe.products.list({ limit: 100 })
    const productNames = existingProducts.data.map(p => p.name)
    
    for (const productData of subscriptionProducts) {
      if (productNames.includes(productData.name)) {
        console.log(`⏭️  Skipping ${productData.name} - already exists`)
        continue
      }
      
      await createProduct(productData)
    }
    
    console.log('✅ All products seeded successfully!')
    
    // Display final summary
    const allProducts = await stripe.products.list({ limit: 100 })
    const allPrices = await stripe.prices.list({ limit: 100 })
    
    console.log('\n📊 Summary:')
    console.log(`Products: ${allProducts.data.length}`)
    console.log(`Prices: ${allPrices.data.length}`)
    
  } catch (error) {
    console.error('❌ Failed to seed products:', error)
    process.exit(1)
  }
}

// Run the seeding
if (require.main === module) {
  seedStripeProducts()
}

export { seedStripeProducts }
