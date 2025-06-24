'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '../components/global/ThemeToggle';
import packageJson from '../../package.json';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  const PrivacyPolicyContent = () => (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Introduction</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Welcome to Sprintro. We respect your privacy and are committed to protecting your personal data. 
          This privacy policy explains how we collect, use, and safeguard your information when you use our planning poker estimation tool.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Information We Collect</h2>
        
        <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Information You Provide</h3>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
          <li>Your name when joining a planning poker session</li>
          <li>Room passwords you create (encrypted and stored securely)</li>
          <li>Estimation votes during planning sessions</li>
        </ul>

        <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Automatically Collected Information</h3>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
          <li>Session data necessary for real-time collaboration</li>
          <li>Basic analytics data (room creation, participant counts, voting rounds)</li>
          <li>Technical information such as browser type and device information</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">How We Use Your Information</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">We use the information we collect to:</p>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
          <li>Provide and maintain our planning poker service</li>
          <li>Enable real-time collaboration during estimation sessions</li>
          <li>Improve our service through analytics and usage patterns</li>
          <li>Ensure the security and integrity of our platform</li>
          <li>Communicate with you about service updates or issues</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Data Storage and Security</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Your data is stored securely using Google Firebase, which provides enterprise-grade security and encryption. 
          We implement appropriate technical and organizational measures to protect your personal information against 
          unauthorized access, alteration, disclosure, or destruction.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Planning poker sessions are temporary by nature. Room data is automatically cleaned up after periods of inactivity, 
          and no voting data is retained longer than necessary for the session.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Data Sharing and Disclosure</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          We do not sell, trade, or otherwise transfer your personal information to third parties. We may share 
          information only in the following circumstances:
        </p>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
          <li>With other participants in your planning poker session (names and votes as intended by the service)</li>
          <li>When required by law or to protect our rights and safety</li>
          <li>With service providers who assist in operating our platform (subject to strict confidentiality agreements)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Cookies and Local Storage</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          We use local storage in your browser to remember your preferences (such as theme settings) and to maintain 
          your session state. This information is stored locally on your device and is not transmitted to our servers 
          unless necessary for the service functionality.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Your Rights</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">You have the right to:</p>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate personal information</li>
          <li>Request deletion of your personal information</li>
          <li>Object to processing of your personal information</li>
          <li>Request restriction of processing your personal information</li>
          <li>Request transfer of your personal information</li>
        </ul>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Since our service is designed for temporary sessions, most data is automatically removed when sessions end. 
          You can also leave any room at any time to remove your participation data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Children's Privacy</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Our service is not directed to children under the age of 13. We do not knowingly collect personal 
          information from children under 13. If you become aware that a child has provided us with personal 
          information, please contact us so we can take appropriate action.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Changes to This Privacy Policy</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          We may update this privacy policy from time to time. We will notify you of any changes by posting the 
          new privacy policy on this page and updating the "Last updated" date. You are advised to review this 
          privacy policy periodically for any changes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          If you have any questions about this privacy policy or our data practices, please contact us at:
        </p>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Email:</strong> privacy@Sprintro.dev<br />
            <strong>GitHub:</strong> <a href="https://github.com/your-username/Sprintro" className="text-blue-600 dark:text-blue-400 hover:underline">Report an issue</a>
          </p>
        </div>
      </section>
    </div>
  );

  const TermsOfServiceContent = () => (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          By accessing and using Sprintro ("the Service"), you accept and agree to be bound by the terms 
          and provision of this agreement. If you do not agree to these terms, you should not use this service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Description of Service</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Sprintro is a web-based agile estimation tool that allows teams to collaboratively estimate 
          the effort required for development tasks. The service provides real-time voting capabilities, 
          room management, and various estimation scales.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          The service is provided free of charge and is intended for professional and educational use in 
          software development and project management contexts.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. User Responsibilities</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">As a user of this service, you agree to:</p>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
          <li>Use the service only for lawful purposes and in accordance with these terms</li>
          <li>Provide accurate information when creating or joining planning sessions</li>
          <li>Respect other participants and maintain professional conduct</li>
          <li>Not attempt to interfere with or disrupt the service</li>
          <li>Not use the service to share inappropriate, offensive, or illegal content</li>
          <li>Not attempt to gain unauthorized access to other users' sessions or data</li>
          <li>Keep room passwords secure and only share them with intended participants</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Prohibited Activities</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">You may not use the service to:</p>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
          <li>Violate any applicable laws or regulations</li>
          <li>Transmit any harmful, offensive, or inappropriate content</li>
          <li>Attempt to reverse engineer, modify, or create derivative works of the service</li>
          <li>Use automated tools to access the service without permission</li>
          <li>Impersonate other users or provide false information</li>
          <li>Attempt to overwhelm the service with excessive requests</li>
          <li>Share login credentials or room access with unauthorized parties</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Privacy and Data</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Your privacy is important to us. Our collection and use of personal information is governed by our 
          Privacy Policy (see the Privacy tab above), which is incorporated by reference into these terms.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          You acknowledge that planning sessions are collaborative by nature and that your name and votes 
          may be visible to other participants in your session as intended by the service functionality.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Service Availability</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          We strive to provide a reliable service, but we cannot guarantee uninterrupted access. The service 
          may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          We reserve the right to modify, suspend, or discontinue the service at any time without prior notice. 
          We will make reasonable efforts to provide advance notice of significant changes when possible.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Intellectual Property</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          The Sprintro service, including its design, functionality, and content, is protected by 
          copyright and other intellectual property laws. You may not copy, modify, distribute, or create 
          derivative works without explicit permission.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          You retain ownership of any content you create or share through the service, but you grant us 
          a limited license to process and display this content as necessary to provide the service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Disclaimers</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          The service is provided "as is" without any warranties, express or implied. We do not warrant that:
        </p>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
          <li>The service will be uninterrupted or error-free</li>
          <li>All features will work perfectly at all times</li>
          <li>The service will meet your specific requirements</li>
          <li>Any data or content will be permanently stored or backed up</li>
          <li>The service will be compatible with all devices or browsers</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Limitation of Liability</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, 
          special, consequential, or punitive damages, including but not limited to loss of profits, 
          data, or business opportunities.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Our total liability for any claims related to the service shall not exceed the amount you 
          have paid us for the service (which is currently zero, as the service is free).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Contact Information</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          If you have any questions about these terms of service, please contact us at:
        </p>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Email:</strong> legal@Sprintro.dev<br />
            <strong>GitHub:</strong> <a href="https://github.com/your-username/Sprintro" className="text-blue-600 dark:text-blue-400 hover:underline">Report an issue</a>
          </p>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <img 
              src="/logo.png" 
              alt="Sprintro Logo" 
              className="w-8 h-8 rounded-lg"
            />
            Sprintro
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Legal Content */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                activeTab === 'privacy'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                activeTab === 'terms'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              Terms of Service
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Content Area */}
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {activeTab === 'privacy' ? <PrivacyPolicyContent /> : <TermsOfServiceContent />}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <p>Sprintro v{packageJson.version}</p>
            <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
