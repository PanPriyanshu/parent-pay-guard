import { Shield, Lock, Smartphone, Users, CheckCircle2, ArrowRight, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { DemoFlow } from "@/components/DemoFlow";

const Index = () => {
  const [showDemo, setShowDemo] = useState(false);

  if (showDemo) {
    return <DemoFlow onBack={() => setShowDemo(false)} />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/30 py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Shield className="h-4 w-4" />
              Advanced Payment Protection
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              SafePay for Kids
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Double authentication layer for UPI payments. Protect your wallet from unauthorized purchases by kids.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                variant="gradient"
                onClick={() => setShowDemo(true)}
                className="group"
              >
                Try Demo
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="p-6 border-2 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Double Authentication</h3>
              <p className="text-muted-foreground">
                After UPI pin, require parent approval via OTP or fingerprint before payment completes.
              </p>
            </Card>

            <Card className="p-6 border-2 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
              <p className="text-muted-foreground">
                Get instant notifications for every payment attempt. Review and approve from anywhere.
              </p>
            </Card>

            <Card className="p-6 border-2 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Family Profiles</h3>
              <p className="text-muted-foreground">
                Manage multiple kids profiles with individual spending limits and approval settings.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">
              Extra security layer in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                1
              </div>
              <Card className="p-6 pt-10 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Kid Initiates Payment</h3>
                <p className="text-muted-foreground">
                  Child enters UPI PIN to make a purchase in any app
                </p>
              </Card>
            </div>

            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                2
              </div>
              <Card className="p-6 pt-10 text-center">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Fingerprint className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Parent Authentication</h3>
                <p className="text-muted-foreground">
                  Parent receives instant request for OTP or fingerprint verification
                </p>
              </Card>
            </div>

            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                3
              </div>
              <Card className="p-6 pt-10 text-center">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Payment Completes</h3>
                <p className="text-muted-foreground">
                  Only after parent approval, the payment is processed securely
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Ready to Secure Your Family's Payments?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Try our demo to see how double authentication protects against unauthorized purchases
          </p>
          <Button 
            size="lg" 
            variant="gradient"
            onClick={() => setShowDemo(true)}
            className="shadow-lg"
          >
            Experience the Demo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
