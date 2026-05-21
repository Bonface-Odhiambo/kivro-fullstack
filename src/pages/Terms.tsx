import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent } from '@/components/ui/card';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
            <p className="text-xl text-muted-foreground">
              Last updated: January 1, 2025
            </p>
          </div>

          <Card>
            <CardContent className="p-8 prose prose-lg max-w-none">
              <h2>1. Agreement to Terms</h2>
              <p>
                By accessing or using Kivro's digital addressing service ("Service"), you agree to be 
                bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not 
                use our Service.
              </p>

              <h2>2. Description of Service</h2>
              <p>
                Kivro provides a digital addressing system that allows users to create precise, 
                shareable addresses for any location. Our service includes address generation, 
                sharing capabilities, and integration with delivery networks.
              </p>

              <h2>3. User Accounts</h2>
              <h3>3.1 Account Creation</h3>
              <ul>
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must be at least 13 years old to use our Service</li>
                <li>One account per person is allowed</li>
              </ul>

              <h3>3.2 Account Responsibilities</h3>
              <ul>
                <li>Keep your login credentials secure</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>You are responsible for all activities under your account</li>
              </ul>

              <h2>4. Acceptable Use</h2>
              <p>You agree to use our Service only for lawful purposes. You may not:</p>
              <ul>
                <li>Create addresses for illegal activities</li>
                <li>Share false or misleading location information</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use our Service to harass or harm others</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Create excessive addresses beyond reasonable personal use</li>
              </ul>

              <h2>5. Privacy and Data Protection</h2>
              <p>
                Your privacy is important to us. Please review our Privacy Policy, which explains 
                how we collect, use, and protect your information.
              </p>

              <h2>6. Payment Terms</h2>
              <h3>6.1 Paid Services</h3>
              <ul>
                <li>Some features require payment as described in our pricing</li>
                <li>Payments are processed securely through third-party providers</li>
                <li>All fees are non-refundable unless otherwise stated</li>
              </ul>

              <h3>6.2 Billing</h3>
              <ul>
                <li>Subscription fees are billed in advance</li>
                <li>You authorize us to charge your payment method</li>
                <li>We may suspend service for non-payment</li>
              </ul>

              <h2>7. Intellectual Property</h2>
              <p>
                Kivro and its contents are protected by copyright, trademark, and other intellectual 
                property laws. You may not copy, modify, distribute, or create derivative works 
                without our written permission.
              </p>

              <h2>8. Service Availability</h2>
              <ul>
                <li>We strive for high availability but cannot guarantee uninterrupted service</li>
                <li>We may perform maintenance that temporarily affects service</li>
                <li>We reserve the right to modify or discontinue features</li>
              </ul>

              <h2>9. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, KIVRO SHALL NOT BE LIABLE for any indirect, 
                incidental, special, consequential, or punitive damages, or any loss of profits or 
                revenues, whether incurred directly or indirectly.
              </p>

              <h2>10. Indemnification</h2>
              <p>
                You agree to indemnify and hold Kivro harmless from any claims, damages, or expenses 
                arising from your use of our Service or violation of these Terms.
              </p>

              <h2>11. Termination</h2>
              <h3>11.1 By You</h3>
              <p>You may terminate your account at any time by contacting us.</p>
              
              <h3>11.2 By Us</h3>
              <p>We may terminate or suspend your account if you violate these Terms.</p>

              <h2>12. Dispute Resolution</h2>
              <p>
                Any disputes arising from these Terms shall be resolved through binding arbitration 
                in accordance with Somali law.
              </p>

              <h2>13. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. We will notify users of material changes via 
                email or through our Service. Continued use constitutes acceptance of new Terms.
              </p>

              <h2>14. Governing Law</h2>
              <p>
                These Terms are governed by the laws of Somalia. Any legal proceedings shall be 
                conducted in the appropriate courts of Somalia.
              </p>

              <h2>15. Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions 
                will remain in full force and effect.
              </p>

              <h2>16. Contact Information</h2>
              <p>
                For questions about these Terms, please contact us at:
              </p>
              <ul>
                <li>Email: legal@kivro.so</li>
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

export default Terms;