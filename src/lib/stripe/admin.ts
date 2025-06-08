import Stripe from 'stripe'

// Enhanced server-side Stripe configuration based on Vercel template
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

// Stripe admin utilities for customer and subscription management
export class StripeAdmin {
  
  /**
   * Create or retrieve a Stripe customer
   */
  static async createCustomer(params: {
    email: string
    userId: string
    metadata?: Record<string, string>
  }): Promise<Stripe.Customer> {
    try {
      // Check if customer already exists
      const existingCustomers = await stripe.customers.list({
        email: params.email,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0]
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: params.email,
        metadata: {
          userId: params.userId,
          ...params.metadata,
        },
      })

      return customer
    } catch (error) {
      console.error('Error creating/retrieving customer:', error)
      throw error
    }
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(params: {
    customerId: string
    priceId: string
    successUrl: string
    cancelUrl: string
    metadata?: Record<string, string>
    trialPeriodDays?: number
  }): Promise<Stripe.Checkout.Session> {
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: params.customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      }

      if (params.trialPeriodDays) {
        sessionParams.subscription_data = {
          trial_period_days: params.trialPeriodDays,
        }
      }

      const session = await stripe.checkout.sessions.create(sessionParams)
      return session
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  /**
   * Create a customer portal session
   */
  static async createCustomerPortalSession(params: {
    customerId: string
    returnUrl: string
  }): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      })

      return session
    } catch (error) {
      console.error('Error creating customer portal session:', error)
      throw error
    }
  }

  /**
   * Retrieve a subscription with expanded data
   */
  static async getSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method', 'customer', 'items.data.price'],
      })
      return subscription
    } catch (error) {
      console.error('Error retrieving subscription:', error)
      return null
    }
  }

  /**
   * Update a subscription
   */
  static async updateSubscription(params: {
    subscriptionId: string
    priceId?: string
    quantity?: number
    metadata?: Record<string, string>
  }): Promise<Stripe.Subscription> {
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {}

      if (params.priceId) {
        const subscription = await stripe.subscriptions.retrieve(params.subscriptionId)
        const currentItem = subscription.items.data[0]
        
        updateParams.items = [
          {
            id: currentItem.id,
            price: params.priceId,
            quantity: params.quantity || 1,
          },
        ]
        updateParams.proration_behavior = 'create_prorations'
      }

      if (params.metadata) {
        updateParams.metadata = params.metadata
      }

      const subscription = await stripe.subscriptions.update(
        params.subscriptionId,
        updateParams
      )

      return subscription
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw error
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(params: {
    subscriptionId: string
    cancelAtPeriodEnd?: boolean
  }): Promise<Stripe.Subscription> {
    try {
      if (params.cancelAtPeriodEnd) {
        const subscription = await stripe.subscriptions.update(params.subscriptionId, {
          cancel_at_period_end: true,
        })
        return subscription
      } else {
        const subscription = await stripe.subscriptions.cancel(params.subscriptionId)
        return subscription
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw error
    }
  }

  /**
   * List all products with prices
   */
  static async getProducts(): Promise<Stripe.Product[]> {
    try {
      const products = await stripe.products.list({
        active: true,
        expand: ['data.default_price'],
      })
      return products.data
    } catch (error) {
      console.error('Error retrieving products:', error)
      throw error
    }
  }

  /**
   * Create or update a product
   */
  static async upsertProduct(params: {
    id?: string
    name: string
    description?: string
    metadata?: Record<string, string>
  }): Promise<Stripe.Product> {
    try {
      if (params.id) {
        // Update existing product
        const product = await stripe.products.update(params.id, {
          name: params.name,
          description: params.description,
          metadata: params.metadata,
        })
        return product
      } else {
        // Create new product
        const product = await stripe.products.create({
          name: params.name,
          description: params.description,
          metadata: params.metadata,
        })
        return product
      }
    } catch (error) {
      console.error('Error upserting product:', error)
      throw error
    }
  }

  /**
   * Create a price for a product
   */
  static async createPrice(params: {
    productId: string
    unitAmount: number
    currency: string
    interval: 'month' | 'year'
    intervalCount?: number
    metadata?: Record<string, string>
  }): Promise<Stripe.Price> {
    try {
      const price = await stripe.prices.create({
        product: params.productId,
        unit_amount: params.unitAmount,
        currency: params.currency,
        recurring: {
          interval: params.interval,
          interval_count: params.intervalCount || 1,
        },
        metadata: params.metadata,
      })
      return price
    } catch (error) {
      console.error('Error creating price:', error)
      throw error
    }
  }
}

export default StripeAdmin
