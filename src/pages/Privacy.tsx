import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground">
              Last updated: January 1, 2025
            </p>
          </div>

          <Card>
            <CardContent className="p-8 prose prose-lg max-w-none">
              <h2>1. Introduction</h2>
              <p>
                Kivro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our 
                digital addressing service.
              </p>

              <h2>2. Information We Collect</h2>
              <h3>2.1 Information You Provide</h3>
              <ul>
                <li>Phone number (required for address creation)</li>
                <li>Location coordinates (when you create an address)</li>
                <li>Account information (name, email address)</li>
                <li>Payment information (for paid services)</li>
                <li>Communications with our support team</li>
              </ul>

              <h3>2.2 Information Automatically Collected</h3>
              <ul>
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (features used, time spent in app)</li>
                <li>Location data (when using location services)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul>
                <li>Provide and maintain our addressing service</li>
                <li>Create and manage your Kivro addresses</li>
                <li>Process payments and send receipts</li>
                <li>Send service-related notifications</li>
                <li>Improve our services and develop new features</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2>4. Information Sharing and Disclosure</h2>
              <p>We may share your information with:</p>
              <ul>
                <li><strong>Courier Partners:</strong> Location coordinates and delivery instructions (only when you initiate a delivery)</li>
                <li><strong>Service Providers:</strong> Third-party companies that help us operate our service</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale</li>
              </ul>

              <h2>5. Your Privacy Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Restrict processing of your information</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>

              <h2>6. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your information against unauthorized 
                access, alteration, disclosure, or destruction. This includes encryption, secure servers, 
                and regular security assessments.
              </p>

              <h2>7. Data Retention</h2>
              <p>
                We retain your information only as long as necessary to provide our services and comply 
                with legal obligations. When you delete your account, we will remove your personal 
                information within 30 days.
              </p>

              <h2>8. International Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than Somalia. 
                We ensure appropriate safeguards are in place to protect your information.
              </p>

              <h2>9. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to improve your experience. You can control 
                cookie settings through your browser preferences.
              </p>

              <h2>10. Children's Privacy</h2>
              <p>
                Our service is not intended for children under 13. We do not knowingly collect personal 
                information from children under 13.
              </p>

              <h2>11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by posting the new policy on our website and updating the "Last updated" date.
              </p>

              <h2>12. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <ul>
                <li>Email: privacy@kivro.so</li>
                <li>Phone: +252 61 234 5678</li>
                <li>Address: Mogadishu, Somalia</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;