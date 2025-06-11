"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { checkoutWithStripe } from "@/lib/actions/subscription-simplified"
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from "@/lib/subscription-config"
import { Check, Star, Zap, Crown } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export default function MembershipPage() {
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
  const getYearlyDiscount = () => {
    const monthlyTotal = Object.values(SUBSCRIPTION_PLANS)[0].priceMonthly * 12
    const yearlyPrice = Object.values(SUBSCRIPTION_PLANS)[0].priceYearly
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100)
  }

  const getYearlyPrice = (monthlyPrice: number) => {
    const discount = getYearlyDiscount() / 100
    return monthlyPrice * 12 * (1 - discount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Choose Your <span className="text-blue-600">Membership</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
                    "relative rounded-2xl border-2 bg-white p-8 shadow-lg transition-all duration-200 hover:shadow-xl",
                    isPopular
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : isPremium
                        ? "border-purple-500 bg-gradient-to-br from-purple-600 to-purple-700 text-white"
                        : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Premium Badge */}
                  {isPremium && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-white text-purple-700 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Crown className="w-4 h-4" />
                        Premium
                      </div>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                      {planType === 'standard' && <Zap className={cn("w-8 h-8", isPremium ? "text-purple-200" : "text-blue-500")} />}
                      {planType === 'premium' && <Star className={cn("w-8 h-8", isPremium ? "text-purple-200" : "text-blue-500")} />}
                      {planType === 'commercial' && <Crown className={cn("w-8 h-8", isPremium ? "text-purple-200" : "text-purple-500")} />}
                    </div>
                    <h3 className={cn("text-2xl font-bold mb-2", isPremium ? "text-white" : "text-gray-900")}>
                      {plan.name}
                    </h3>
                    <p className={cn("text-sm", isPremium ? "text-purple-100" : "text-gray-600")}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-8">
                    <div className="flex items-end justify-center gap-1 mb-2">
                      <span className={cn("text-4xl font-bold", isPremium ? "text-white" : "text-gray-900")}>
                        ${displayPrice.toFixed(2)}
                      </span>
                      <span className={cn("text-base", isPremium ? "text-purple-100" : "text-gray-600")}>
                        /{billingInterval === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingInterval === 'yearly' && (
                      <p className={cn("text-sm", isPremium ? "text-purple-200" : "text-gray-500")}>
                        ${pricePerMonth.toFixed(2)}/month billed annually
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className={cn("w-5 h-5 flex-shrink-0 mt-0.5", isPremium ? "text-purple-200" : "text-green-500")} />
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
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      `Get ${plan.name}`
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            All plans include 7-day free trial • Cancel anytime • No setup fees
          </p>
        </div>
      </div>
    </div>
  )
}