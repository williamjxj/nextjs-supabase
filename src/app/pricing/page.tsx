"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { checkoutWithStripe } from "@/lib/actions/subscription-simplified"
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from "@/lib/subscription-config"
import { Check, Star, Zap, Crown } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export default function PricingPage() {
  const [loading, setLoading] = useState<string>()
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const router = useRouter()

  const handleStripeCheckout = async (planType: SubscriptionPlanType) => {
    setLoading(planType)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      await checkoutWithStripe({ planType, billingInterval })
    } catch (error) {
      console.error("Error creating checkout session:", error)
    } finally {
      setLoading(undefined)
    }
  }

  // Calculate yearly discount
  const getYearlyPrice = (monthlyPrice: number) => monthlyPrice * 10 // 2 months free
  const getYearlyDiscount = () => Math.round(((12 - 10) / 12) * 100) // ~17% off

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Pricing Plans
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Choose the perfect plan for you</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get unlimited access to our premium gallery with subscription plans designed to fit your needs.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4 bg-white rounded-full p-2 shadow-sm border">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={cn(
                "px-6 py-3 rounded-full font-medium transition-all duration-200",
                billingInterval === 'monthly'
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={cn(
                "px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center gap-2",
                billingInterval === 'yearly'
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Yearly
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Save {getYearlyDiscount()}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-3">
            {Object.entries(SUBSCRIPTION_PLANS).map(([planType, plan], index) => {
              const isPopular = planType === 'premium'
              const isPremium = planType === 'commercial'
              
              const monthlyPrice = plan.priceMonthly
              const yearlyPrice = getYearlyPrice(monthlyPrice)
              const displayPrice = billingInterval === 'monthly' ? monthlyPrice : yearlyPrice
              const pricePerMonth = billingInterval === 'monthly' ? monthlyPrice : yearlyPrice / 12

              return (
                <div
                  key={planType}
                  className={cn(
                    "relative p-8 transition-all duration-300 hover:shadow-xl bg-white rounded-2xl border",
                    isPopular && "ring-2 ring-blue-500 shadow-lg scale-105",
                    isPremium && "bg-gradient-to-br from-purple-900 to-pink-900 text-white border-purple-500",
                  )}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        <Crown className="w-4 h-4" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Premium Badge */}
                  {isPremium && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        <Zap className="w-4 h-4" />
                        Enterprise
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className={cn("text-2xl font-bold mb-3", isPremium ? "text-white" : "text-gray-900")}>
                      {plan.name}
                    </h3>

                    <p className={cn("text-base mb-6", isPremium ? "text-purple-100" : "text-gray-600")}>
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      <span className={cn("text-5xl font-bold", isPremium ? "text-white" : "text-gray-900")}>
                        ${pricePerMonth.toFixed(2)}
                      </span>
                      <span className={cn("text-lg font-medium ml-1", isPremium ? "text-purple-200" : "text-gray-500")}>
                        /month
                      </span>
                      {billingInterval === 'yearly' && (
                        <div className={cn("text-sm mt-2", isPremium ? "text-purple-200" : "text-gray-500")}>
                          Billed ${yearlyPrice}/year
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={cn("rounded-full p-1 mt-0.5", isPremium ? "bg-white/20" : "bg-green-100")}>
                          <Check className={cn("w-4 h-4", isPremium ? "text-white" : "text-green-600")} />
                        </div>
                        <span className={cn("text-base", isPremium ? "text-purple-100" : "text-gray-700")}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleStripeCheckout(planType as SubscriptionPlanType)}
                    disabled={!!loading}
                    className={cn(
                      "w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 shadow-sm hover:shadow-md",
                      isPremium
                        ? "bg-white text-purple-700 hover:bg-gray-50"
                        : isPopular
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-900 text-white hover:bg-gray-800",
                      loading === planType && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {loading === planType ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
                        Processing...
                      </div>
                    ) : (
                      "Get Started"
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl border max-w-2xl mx-auto p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">All plans include</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Cancel anytime
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Secure payments
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                24/7 support
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
