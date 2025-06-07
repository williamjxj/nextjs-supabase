'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, CreditCard, Image, Settings, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/use-subscription'
import { useSubscriptionAccess } from '@/hooks/use-subscription-access'

const accountNavItems = [
	{
		name: 'Profile',
		href: '/account/profile',
		icon: User,
	},
	{
		name: 'Subscriptions',
		href: '/account/subscriptions',
		icon: CreditCard,
	},
	{
		name: 'My Images',
		href: '/account/images',
		icon: Image,
	},
	{
		name: 'Settings',
		href: '/account/settings',
		icon: Settings,
	},
]

export default function AccountLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const pathname = usePathname()
		const router = useRouter()
	const [username, setUsername] = useState<string | null>(null)
	const [email, setEmail] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const { subscription, isActive, isGracePeriod } = useSubscription()
  const { currentTier } = useSubscriptionAccess()

  // Helper function to safely get tier name
  const getTierName = () => {
    if (!currentTier) return 'Standard';
    return currentTier.charAt(0).toUpperCase() + currentTier.slice(1);
  };

	useEffect(() => {
		async function getUser() {
			const { data, error } = await supabase.auth.getUser()

			if (error || !data.user) {
				// If not logged in, redirect to login
				router.push('/login')
				return
			}

			setEmail(data.user.email || null)

			// Get username from profile if available
			const { data: profile } = await supabase
				.from('profiles')
				.select('username')
				.eq('id', data.user.id)
				.single()

			if (profile) {
				setUsername(profile.username)
			} else {
				// Use email as fallback
				setUsername(data.user.email?.split('@')[0] || 'User')
			}

			setLoading(false)
		}

		getUser()
	}, [router])

	const handleLogout = async () => {
		await supabase.auth.signOut()
		router.push('/login')
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
				<div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="container mx-auto py-8 px-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div className="col-span-1">
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
							<div className="mb-6 text-center">
								<div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-3">
									<span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
										{username?.[0]?.toUpperCase() || 'U'}
									</span>
								</div>
								<h2 className="text-xl font-semibold text-gray-800 dark:text-white">
									{username || 'User'}
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									{email || ''}
								</p>

								{/* Subscription Badge */}
								{(isActive || isGracePeriod) && (
									<div className="mt-2">
										<span
											className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												currentTier === 'commercial'
													? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
													: currentTier === 'premium'
													? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
													: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
											}`}
										>
											{getTierName()}{' '}
											Member
											{isGracePeriod && ' (Cancelling)'}
										</span>
									</div>
								)}
							</div>

							<nav className="space-y-1">
								{accountNavItems.map((item) => {
									const isActive = pathname === item.href

									return (
										<Link
											key={item.name}
											href={item.href}
											className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
												isActive
													? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
													: 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/30'
											}`}
										>
											<item.icon
												className={`mr-3 h-5 w-5 ${
													isActive
														? 'text-blue-500 dark:text-blue-300'
														: 'text-gray-400 dark:text-gray-500'
												}`}
											/>
											{item.name}
										</Link>
									)
								})}

								<button
									onClick={handleLogout}
									className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-md dark:text-red-300 dark:hover:bg-red-900/20"
								>
									<LogOut className="mr-3 h-5 w-5 text-red-400 dark:text-red-400" />
									Logout
								</button>
							</nav>
						</div>
					</div>

					<div className="col-span-1 md:col-span-3">{children}</div>
				</div>
			</div>
		</div>
	)
}
