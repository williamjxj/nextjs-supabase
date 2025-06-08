import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Gallery',
  description: 'Terms of service for Gallery - Learn about our terms and conditions.',
}

export default function TermsPage() {
  return (
    <div className='container mx-auto px-4 py-8 max-w-4xl'>
      <div className='prose prose-gray max-w-none'>
        <h1 className='text-3xl font-bold mb-8'>Terms of Service</h1>
        
        <p className='text-gray-600 mb-8'>
          <strong>Effective Date:</strong> June 8, 2025
        </p>

        <div className='space-y-8'>
          <section>
            <h2 className='text-2xl font-semibold mb-4'>1. Acceptance of Terms</h2>
            <p className='text-gray-700 leading-relaxed'>
              By accessing or using Gallery ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>2. Description of Service</h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              Gallery is a web-based image hosting and management service that allows users to:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-gray-700'>
              <li>Upload, store, and organize digital images</li>
              <li>Create and manage photo galleries</li>
              <li>Share images with others</li>
              <li>Purchase licenses for premium content</li>
              <li>Access premium features through subscription plans</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>3. User Accounts</h2>
            
            <h3 className='text-xl font-medium mb-3'>3.1 Account Creation</h3>
            <p className='text-gray-700 leading-relaxed mb-4'>
              To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
            </p>

            <h3 className='text-xl font-medium mb-3'>3.2 Account Security</h3>
            <p className='text-gray-700 leading-relaxed mb-4'>
              You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access to your account.
            </p>

            <h3 className='text-xl font-medium mb-3'>3.3 Account Termination</h3>
            <p className='text-gray-700 leading-relaxed'>
              We reserve the right to suspend or terminate your account at any time for violations of these Terms or for any other reason at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>4. Content and Usage Rights</h2>
            
            <h3 className='text-xl font-medium mb-3'>4.1 Your Content</h3>
            <p className='text-gray-700 leading-relaxed mb-4'>
              You retain ownership of any intellectual property rights in content you upload to the Service ("Your Content"). By uploading Your Content, you grant us a worldwide, non-exclusive license to use, store, and display Your Content solely for the purpose of providing the Service.
            </p>

            <h3 className='text-xl font-medium mb-3'>4.2 Content Restrictions</h3>
            <p className='text-gray-700 leading-relaxed mb-4'>You agree not to upload content that:</p>
            <ul className='list-disc pl-6 space-y-2 text-gray-700'>
              <li>Violates any law or regulation</li>
              <li>Infringes on the rights of others</li>
              <li>Contains harmful, offensive, or inappropriate material</li>
              <li>Includes malware, viruses, or other malicious code</li>
              <li>Violates privacy or publicity rights</li>
              <li>Contains spam or unauthorized commercial content</li>
            </ul>

            <h3 className='text-xl font-medium mb-3 mt-6'>4.3 Content Monitoring</h3>
            <p className='text-gray-700 leading-relaxed'>
              We reserve the right to review and remove any content that violates these Terms or is otherwise objectionable, but we are not obligated to monitor all content uploaded to the Service.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>5. Acceptable Use</h2>
            <p className='text-gray-700 leading-relaxed mb-4'>You agree not to:</p>
            <ul className='list-disc pl-6 space-y-2 text-gray-700'>
              <li>Use the Service for any unlawful purpose or activity</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated tools to access the Service without permission</li>
              <li>Impersonate others or provide false information</li>
              <li>Collect user information without consent</li>
              <li>Reverse engineer or attempt to extract source code</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>6. Subscription Plans and Payments</h2>
            
            <h3 className='text-xl font-medium mb-3'>6.1 Subscription Services</h3>
            <p className='text-gray-700 leading-relaxed mb-4'>
              We offer various subscription plans that provide access to premium features. Subscription fees are charged in advance and are non-refundable except as required by law.
            </p>

            <h3 className='text-xl font-medium mb-3'>6.2 Payment Terms</h3>
            <ul className='list-disc pl-6 space-y-2 text-gray-700'>
              <li>All fees are in USD unless otherwise specified</li>
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>Price changes will be communicated 30 days in advance</li>
              <li>Failed payments may result in service suspension</li>
            </ul>

            <h3 className='text-xl font-medium mb-3 mt-6'>6.3 Cancellation</h3>
            <p className='text-gray-700 leading-relaxed'>
              You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>7. Privacy and Data Protection</h2>
            <p className='text-gray-700 leading-relaxed'>
              Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>8. Intellectual Property</h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              The Service and its original content, features, and functionality are owned by Gallery and are protected by intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Service without explicit permission.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>9. Third-Party Services</h2>
            <p className='text-gray-700 leading-relaxed'>
              Our Service may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of third-party sites. Your use of third-party services is governed by their respective terms and policies.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>10. Disclaimers</h2>
            <div className='bg-yellow-50 border border-yellow-200 p-4 rounded-lg'>
              <p className='text-gray-700 leading-relaxed'>
                <strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.</strong> We disclaim all warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>11. Limitation of Liability</h2>
            <div className='bg-red-50 border border-red-200 p-4 rounded-lg'>
              <p className='text-gray-700 leading-relaxed'>
                TO THE FULLEST EXTENT PERMITTED BY LAW, GALLERY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>12. Indemnification</h2>
            <p className='text-gray-700 leading-relaxed'>
              You agree to indemnify and hold harmless Gallery and its affiliates from any claims, damages, losses, or expenses arising from your use of the Service, violation of these Terms, or infringement of any rights of another party.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>13. Governing Law</h2>
            <p className='text-gray-700 leading-relaxed'>
              These Terms are governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles. Any disputes shall be resolved in the courts of San Francisco County, California.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>14. Changes to Terms</h2>
            <p className='text-gray-700 leading-relaxed'>
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>15. Contact Information</h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              If you have any questions about these Terms, please contact us:
            </p>
            <div className='bg-gray-50 p-4 rounded-lg'>
              <p className='text-gray-700'>
                <strong>Email:</strong> legal@gallery.com<br />
                <strong>Address:</strong> Gallery Legal Team<br />
                123 Tech Street, San Francisco, CA 94105
              </p>
            </div>
          </section>

          <section className='border-t pt-8'>
            <p className='text-sm text-gray-500'>
              By using Gallery, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
