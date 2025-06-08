import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Gallery',
  description: 'Privacy policy for Gallery - Learn how we protect your data and privacy.',
}

export default function PrivacyPage() {
  return (
    <div className='container mx-auto px-4 py-8 max-w-4xl'>
      <div className='prose prose-gray max-w-none'>
        <h1 className='text-3xl font-bold mb-8'>Privacy Policy</h1>
        
        <p className='text-gray-600 mb-8'>
          <strong>Effective Date:</strong> June 8, 2025
        </p>

        <div className='space-y-8'>
          <section>
            <h2 className='text-2xl font-semibold mb-4'>1. Introduction</h2>
            <p className='text-gray-700 leading-relaxed'>
              Welcome to Gallery ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our image gallery service.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>2. Information We Collect</h2>
            
            <h3 className='text-xl font-medium mb-3'>2.1 Personal Information</h3>
            <ul className='list-disc pl-6 space-y-2 text-gray-700'>
              <li>Email address (required for account creation)</li>
              <li>Username or display name</li>
              <li>Profile information you choose to provide</li>
              <li>Payment information (processed securely through third-party providers)</li>
            </ul>

            <h3 className='text-xl font-medium mb-3 mt-6'>2.2 Content Information</h3>
            <ul className='list-disc pl-6 space-y-2 text-gray-700'>
              <li>Images and media files you upload</li>
              <li>Image metadata (file size, dimensions, upload date)</li>
              <li>Album and gallery organization data</li>
            </ul>

            <h3 className='text-xl font-medium mb-3 mt-6'>2.3 Technical Information</h3>
            <ul className='list-disc pl-6 space-y-2 text-gray-700'>
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Usage analytics and performance data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>3. How We Use Your Information</h2>
            <ul className='list-disc pl-6 space-y-2 text-gray-700'>
              <li><strong>Service Provision:</strong> To provide, maintain, and improve our gallery service</li>
              <li><strong>Account Management:</strong> To create and manage your user account</li>
              <li><strong>Storage & Organization:</strong> To store and organize your images securely</li>
              <li><strong>Communication:</strong> To send service-related notifications and updates</li>
              <li><strong>Support:</strong> To provide customer support and respond to inquiries</li>
              <li><strong>Security:</strong> To protect against fraud, abuse, and security threats</li>
              <li><strong>Analytics:</strong> To analyze usage patterns and improve our service</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>4. Information Sharing and Disclosure</h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-gray-700'>
              <li><strong>Service Providers:</strong> With trusted third-party services (hosting, payment processing, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>5. Data Security</h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-gray-700'>
              <li>Encryption of data in transit and at rest</li>
              <li>Secure cloud storage infrastructure</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication measures</li>
              <li>Backup and disaster recovery procedures</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>6. Your Rights and Choices</h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              You have the following rights regarding your personal information:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-gray-700'>
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Data Portability:</strong> Export your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>7. Data Retention</h2>
            <p className='text-gray-700 leading-relaxed'>
              We retain your information only as long as necessary to provide our services and comply with legal obligations. Images and account data are retained while your account is active and for a reasonable period after account deletion to allow for recovery.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>8. International Data Transfers</h2>
            <p className='text-gray-700 leading-relaxed'>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during international transfers.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>9. Children's Privacy</h2>
            <p className='text-gray-700 leading-relaxed'>
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>10. Changes to This Policy</h2>
            <p className='text-gray-700 leading-relaxed'>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date. Your continued use of our service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>11. Contact Us</h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className='bg-gray-50 p-4 rounded-lg'>
              <p className='text-gray-700'>
                <strong>Email:</strong> privacy@gallery.com<br />
                <strong>Address:</strong> Gallery Privacy Team<br />
                123 Tech Street, San Francisco, CA 94105
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
