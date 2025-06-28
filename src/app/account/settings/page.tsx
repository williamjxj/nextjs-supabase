'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import {
  Settings,
  Bell,
  Shield,
  ArrowLeft,
  Save,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
  }, [user, loading, router])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // This would save the settings
      showToast('Settings saved successfully!', 'success', 'Success')
    } catch (error) {
      showToast('Failed to save settings', 'error', 'Error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      // This would delete the account
      showToast(
        'Account deletion requested. Please check your email.',
        'info',
        'Account Deletion'
      )
    } catch (error) {
      showToast('Failed to delete account', 'error', 'Error')
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex items-center gap-4 mb-8'>
          <Link href='/account'>
            <Button variant='outline' size='sm'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Account
            </Button>
          </Link>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Account Settings
            </h1>
            <p className='text-gray-600'>
              Manage your preferences and security
            </p>
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Settings Form */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Notifications */}
            <Card className='p-6'>
              <div className='flex items-center gap-3 mb-6'>
                <Bell className='w-5 h-5 text-blue-600' />
                <h2 className='text-xl font-semibold text-gray-900'>
                  Notifications
                </h2>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium text-gray-900'>
                      Email Notifications
                    </p>
                    <p className='text-sm text-gray-600'>
                      Receive updates about your account
                    </p>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={settings.emailNotifications}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          emailNotifications: e.target.checked,
                        })
                      }
                      className='sr-only peer'
                    />
                    <div className='w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600'></div>
                  </label>
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium text-gray-900'>
                      Marketing Emails
                    </p>
                    <p className='text-sm text-gray-600'>
                      Receive promotional content and updates
                    </p>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={settings.marketingEmails}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          marketingEmails: e.target.checked,
                        })
                      }
                      className='sr-only peer'
                    />
                    <div className='w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600'></div>
                  </label>
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium text-gray-900'>Security Alerts</p>
                    <p className='text-sm text-gray-600'>
                      Get notified about security events
                    </p>
                  </div>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={settings.securityAlerts}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          securityAlerts: e.target.checked,
                        })
                      }
                      className='sr-only peer'
                    />
                    <div className='w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600'></div>
                  </label>
                </div>
              </div>

              <div className='pt-4 border-t mt-6'>
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className='w-full sm:w-auto'
                >
                  {saving ? (
                    <>
                      <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='w-4 h-4 mr-2' />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Security */}
            <Card className='p-6'>
              <div className='flex items-center gap-3 mb-6'>
                <Shield className='w-5 h-5 text-green-600' />
                <h2 className='text-xl font-semibold text-gray-900'>
                  Security
                </h2>
              </div>

              <div className='space-y-4'>
                <div>
                  <p className='font-medium text-gray-900 mb-2'>Password</p>
                  <p className='text-sm text-gray-600 mb-4'>
                    Change your password to keep your account secure
                  </p>
                  <Button variant='outline'>Change Password</Button>
                </div>

                <div className='pt-4 border-t'>
                  <p className='font-medium text-gray-900 mb-2'>
                    Two-Factor Authentication
                  </p>
                  <p className='text-sm text-gray-600 mb-4'>
                    Add an extra layer of security to your account
                  </p>
                  <Button variant='outline'>Enable 2FA</Button>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className='p-6 border-red-200'>
              <div className='flex items-center gap-3 mb-6'>
                <AlertTriangle className='w-5 h-5 text-red-600' />
                <h2 className='text-xl font-semibold text-red-900'>
                  Danger Zone
                </h2>
              </div>

              <div className='bg-red-50 rounded-lg p-4'>
                <p className='font-medium text-red-900 mb-2'>Delete Account</p>
                <p className='text-sm text-red-700 mb-4'>
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
                <Button
                  variant='outline'
                  onClick={handleDeleteAccount}
                  className='border-red-300 text-red-700 hover:bg-red-50'
                >
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete Account
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Quick Actions
              </h3>
              <div className='space-y-3'>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </div>
            </Card>

            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Need Help?
              </h3>
              <p className='text-gray-600 mb-4'>
                Contact support for account security questions.
              </p>
              <Button variant='outline' className='w-full'>
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
