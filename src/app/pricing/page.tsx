"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { checkoutWithStripe } from "@/lib/actions/subscription"
import { useProducts } from "@/hooks/use-products"
import { Check, Star, Zap, Crown } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { Tables } from "@/types/types_db"

type Price = Tables<"prices">

export default function PricingPage() {
  const [priceIdLoading, setPriceIdLoading] = useState<string>()
  const { products, loading, error } = useProducts()
  const router = useRouter()

  const handleStripeCheckout = async (price: Price) => {
    setPriceIdLoading(price.id)
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
        router.push("/auth/signin")
        return
      }
      await checkoutWithStripe({ price })
    } catch (error) {
      console.error("Error creating checkout session:", error)
    } finally {
      setPriceIdLoading(undefined)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading pricing plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-16">
        {/* Header Section - Krea.ai style */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Pricing Plans
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Choose the perfect plan for you</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get unlimited access to our premium gallery with subscription plans designed to fit your needs. Start with a
            7-day free trial on any plan.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-6xl mx-auto">
          {products.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="krea-card max-w-md mx-auto p-8">
                <p className="text-gray-600 text-lg">No pricing plans available at the moment.</p>
                <p className="text-gray-500 text-sm mt-2">Please check back later or contact support.</p>
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            {products.map((product, index) => {
              const price = product.prices?.[0]
              if (!price) return null

              const priceString = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: price.currency!,
                minimumFractionDigits: 0,
              }).format((price?.unit_amount || 0) / 100)

              const isPopular = product.name === "Premium Plan" || index === 1
              const isPremium = product.name === "Commercial Plan" || index === 2

              return (
                <div
                  key={product.id}
                  className={cn(
                    "krea-card relative p-8 transition-all duration-300 hover:shadow-xl",
                    isPopular && "ring-2 ring-blue-500 shadow-lg scale-105",
                    isPremium && "krea-gradient-purple text-white",
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
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className={cn("text-base mb-6", isPremium ? "text-purple-100" : "text-gray-600")}>
                        {product.description}
                      </p>
                    )}

                    <div className="mb-6">
                      <span className={cn("text-5xl font-bold", isPremium ? "text-white" : "text-gray-900")}>
                        {priceString}
                      </span>
                      {price.interval && (
                        <span
                          className={cn("text-lg font-medium ml-1", isPremium ? "text-purple-200" : "text-gray-500")}
                        >
                          /{price.interval}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4 mb-8">
                    {getFeatures(product.name || "").map((feature) => (
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
                    onClick={() => handleStripeCheckout(price)}
                    disabled={!!priceIdLoading}
                    className={cn(
                      "w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 shadow-sm hover:shadow-md",
                      isPremium
                        ? "bg-white text-purple-700 hover:bg-gray-50"
                        : isPopular
                          ? "krea-button-primary"
                          : "krea-button hover:bg-gray-100",
                      priceIdLoading === price.id && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {priceIdLoading === price.id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
                        Processing...
                      </div>
                    ) : (
                      "Start Free Trial"
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-16">
          <div className="krea-card max-w-2xl mx-auto p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">All plans include</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                7-day free trial
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Cancel anytime
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

function getFeatures(productName?: string): string[] {
  switch (productName?.toLowerCase()) {
    case "standard plan":
      return [
        "100 image uploads per month",
        "1GB storage space",
        "Standard support",
        "Basic editing tools",
        "Personal use license",
        "Mobile app access",
      ]
    case "premium plan":
      return [
        "1,000 image uploads per month",
        "10GB storage space",
        "Priority support",
        "Advanced editing tools",
        "Commercial use license",
        "Bulk operations",
        "Analytics dashboard",
        "API access",
      ]
    case "commercial plan":
      return [
        "Unlimited image uploads",
        "100GB storage space",
        "24/7 priority support",
        "All editing features",
        "Full commercial license",
        "Advanced API access",
        "Custom integrations",
        "Dedicated account manager",
        "White-label options",
      ]
    default:
      return ["Basic features included", "Standard support", "Personal use license", "Mobile app access"]
  }
}
