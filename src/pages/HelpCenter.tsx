import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, Book, Phone } from 'lucide-react';

const categories = [
  {
    icon: <Book className="w-8 h-8 text-primary" />,
    title: "Getting Started",
    description: "Learn the basics of using Kivro addresses",
    articles: 12
  },
  {
    icon: <MessageCircle className="w-8 h-8 text-primary" />,
    title: "Account & Settings",
    description: "Manage your account and preferences",
    articles: 8
  },
  {
    icon: <Phone className="w-8 h-8 text-primary" />,
    title: "Troubleshooting",
    description: "Common issues and solutions",
    articles: 15
  }
];

const popularArticles = [
  "How to create your first Kivro address",
  "Sharing your address with couriers",
  "Understanding Kivro address codes",
  "Privacy and security settings",
  "Billing and subscription management",
  "Mobile app installation guide"
];

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-6">Help Center</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Find answers to your questions and learn how to make the most of Kivro.
            </p>
            
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search for help articles..." 
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {category.icon}
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4">{category.description}</p>
                  <p className="text-sm text-primary font-medium">{category.articles} articles</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            <section>
              <h2 className="text-3xl font-bold mb-6">Popular Articles</h2>
              <div className="space-y-4">
                {popularArticles.map((article, index) => (
                  <Card key={index} className="hover:shadow-sm transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium hover:text-primary transition-colors">
                        {article}
                      </h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="w-6 h-6 text-primary mr-2" />
                    Live Chat Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Get instant help from our support team. Available 24/7 for urgent issues.
                  </p>
                  <Button className="w-full">Start Chat</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="w-6 h-6 text-primary mr-2" />
                    Phone Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Speak directly with our support team. Available Monday-Friday, 9 AM - 5 PM EAT.
                  </p>
                  <Button variant="outline" className="w-full">+252 61 234 5678</Button>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6">Contact Support</h2>
              <Card>
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Can't find what you're looking for?</h3>
                      <p className="text-muted-foreground mb-6">
                        Our support team is here to help. Send us a message and we'll get back to you as soon as possible.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <strong>Email:</strong> support@kivro.so
                        </div>
                        <div>
                          <strong>Response time:</strong> Within 24 hours
                        </div>
                        <div>
                          <strong>Languages:</strong> English, Somali, Swahili
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Input placeholder="Your Name" />
                      <Input placeholder="Your Email" />
                      <Input placeholder="Subject" />
                      <textarea 
                        className="w-full p-3 border rounded-md resize-none h-32" 
                        placeholder="Describe your issue..."
                      ></textarea>
                      <Button className="w-full">Send Message</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HelpCenter;