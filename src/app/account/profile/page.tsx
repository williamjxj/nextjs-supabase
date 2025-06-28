'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { User, Mail, Calendar, ArrowLeft, Save, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      setFormData({
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
      })
    }
  }, [user, loading, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      // This would update the user profile
      showToast('Profile updated successfully!', 'success', 'Success')
    } catch (error) {
      showToast('Failed to update profile', 'error', 'Error')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
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
              Profile Settings
            </h1>
            <p className='text-gray-600'>Manage your personal information</p>
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Profile Form */}
          <div className='lg:col-span-2'>
            <Card className='p-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                Personal Information
              </h2>

              <div className='space-y-6'>
                {/* Avatar */}
                <div className='flex items-center gap-6'>
                  <div className='w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center'>
                    <User className='w-8 h-8 text-gray-500' />
                  </div>
                  <div>
                    <Button variant='outline' size='sm'>
                      <Camera className='w-4 h-4 mr-2' />
                      Change Photo
                    </Button>
                    <p className='text-sm text-gray-500 mt-1'>
                      JPG, GIF or PNG. 1MB max.
                    </p>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Full Name
                  </label>
                  <input
                    type='text'
                    value={formData.fullName}
                    onChange={e =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Enter your full name'
                  />
                </div>

                {/* Email */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Email Address
                  </label>
                  <input
                    type='email'
                    value={formData.email}
                    disabled
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500'
                  />
                  <p className='text-sm text-gray-500 mt-1'>
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                {/* Member Since */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Member Since
                  </label>
                  <div className='flex items-center gap-2 text-gray-900'>
                    <Calendar className='w-4 h-4 text-gray-500' />
                    {formatDate(user.created_at)}
                  </div>
                </div>

                {/* Save Button */}
                <div className='pt-4 border-t'>
                  <Button
                    onClick={handleSave}
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
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Account Info
              </h3>
              <div className='space-y-3'>
                <div className='flex items-center gap-3'>
                  <Mail className='w-4 h-4 text-gray-500' />
                  <div>
                    <p className='text-sm font-medium text-gray-900'>Email</p>
                    <p className='text-sm text-gray-600'>{user.email}</p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <User className='w-4 h-4 text-gray-500' />
                  <div>
                    <p className='text-sm font-medium text-gray-900'>User ID</p>
                    <p className='text-sm text-gray-600 font-mono'>
                      {user.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Need Help?
              </h3>
              <p className='text-gray-600 mb-4'>
                Contact support for account-related questions.
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
