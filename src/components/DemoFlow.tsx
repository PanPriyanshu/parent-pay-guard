import { useState, useEffect } from "react";
import { ArrowLeft, Smartphone, Lock, Fingerprint, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const otpSchema = z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric");

interface DemoFlowProps {
  onBack: () => void;
}

export const DemoFlow = ({ onBack }: DemoFlowProps) => {
  const [step, setStep] = useState<"initial" | "upi-pin" | "parent-auth" | "otp" | "success" | "rejected">("initial");
  const [upiPin, setUpiPin] = useState("");
  const [otp, setOtp] = useState("");
  const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);
  const [parentEmail, setParentEmail] = useState("");
  const { toast } = useToast();

  // Demo parent user ID - in production, this would come from authentication
  const DEMO_PARENT_ID = "00000000-0000-0000-0000-000000000000";

  const handleUpiPinSubmit = async () => {
    if (upiPin.length === 4) {
      // Check if we have a logged-in parent
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Create payment request for logged-in parent
        const { data, error } = await supabase
          .from("payment_requests")
          .insert({
            parent_id: session.user.id,
            kid_name: "Demo Kid",
            amount: 999,
            merchant_name: "Gaming App - Premium Battle Pass",
            upi_pin_entered: true,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating payment request:", error);
          toast({
            title: "Error",
            description: "Failed to create payment request. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setPaymentRequestId(data.id);
        setStep("parent-auth");
        toast({
          title: "UPI PIN Accepted",
          description: "Parent notification sent! Check the parent dashboard.",
        });
      } else {
        // Demo mode - no backend integration
        setStep("parent-auth");
        toast({
          title: "UPI PIN Accepted",
          description: "Requesting parent authorization... (Demo Mode - Login as parent to see real notifications)",
        });
      }
    }
  };

  const handleOtpRequest = () => {
    setStep("otp");
    toast({
      title: "OTP Sent",
      description: "Check parent's phone for verification code",
    });
  };

  const handleOtpSubmit = async () => {
    const validation = otpSchema.safeParse(otp);
    if (!validation.success) {
      toast({
        title: "Invalid OTP",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (paymentRequestId) {
      // Verify OTP against database
      const { data, error } = await supabase
        .from("payment_requests")
        .select("otp_code, status")
        .eq("id", paymentRequestId)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to verify OTP",
          variant: "destructive",
        });
        return;
      }

      if (data.status !== "approved" || data.otp_code !== otp) {
        toast({
          title: "Invalid OTP",
          description: "The OTP you entered is incorrect",
          variant: "destructive",
        });
        return;
      }

      // Mark as verified
      await supabase
        .from("payment_requests")
        .update({ otp_verified: true })
        .eq("id", paymentRequestId);
    }

    setStep("success");
    toast({
      title: "Payment Approved!",
      description: "Transaction completed securely",
      variant: "default",
    });
  };

  const handleReject = () => {
    setStep("rejected");
    toast({
      title: "Payment Rejected",
      description: "Parent denied the transaction",
      variant: "destructive",
    });
  };

  const handleFingerprint = () => {
    setTimeout(() => {
      setStep("success");
      toast({
        title: "Fingerprint Verified!",
        description: "Payment approved by parent",
        variant: "default",
      });
    }, 1500);
  };

  const resetDemo = () => {
    setStep("initial");
    setUpiPin("");
    setOtp("");
    setPaymentRequestId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Payment Protection Demo</h1>
          <p className="text-muted-foreground">Experience the double authentication flow</p>
        </div>

        {/* Initial Purchase Screen */}
        {step === "initial" && (
          <Card className="p-8">
            <div className="text-center mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Gaming App Purchase</h2>
              <p className="text-muted-foreground mb-4">Premium Battle Pass - ₹999</p>
            </div>

            <div className="space-y-4">
              <div className="bg-secondary/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Enter UPI PIN</p>
                <Input
                  type="password"
                  maxLength={4}
                  value={upiPin}
                  onChange={(e) => setUpiPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • •"
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleUpiPinSubmit}
                disabled={upiPin.length !== 4}
              >
                <Lock className="h-4 w-4 mr-2" />
                Proceed to Pay
              </Button>
            </div>
          </Card>
        )}

        {/* Parent Authentication Request */}
        {step === "parent-auth" && (
          <Card className="p-8">
            <div className="text-center mb-6">
              <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Lock className="h-10 w-10 text-accent" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Parent Authorization Required</h2>
              <p className="text-muted-foreground">Choose authentication method</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-secondary/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Transaction Details</p>
                <p className="text-muted-foreground text-sm">Gaming App - Premium Battle Pass</p>
                <p className="text-2xl font-bold mt-2">₹999</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                variant="gradient"
                onClick={handleOtpRequest}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Verify with OTP
              </Button>

              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={handleFingerprint}
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                Use Fingerprint
              </Button>

              <Button
                className="w-full"
                size="lg"
                variant="destructive"
                onClick={handleReject}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Payment
              </Button>
            </div>
          </Card>
        )}

        {/* OTP Verification */}
        {step === "otp" && (
          <Card className="p-8">
            <div className="text-center mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Enter OTP</h2>
              <p className="text-muted-foreground">Code sent to parent's phone</p>
            </div>

            <div className="space-y-4">
              <div className="bg-secondary/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">6-Digit OTP</p>
                <Input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                variant="success"
                onClick={handleOtpSubmit}
                disabled={otp.length !== 6}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Verify & Complete Payment
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={() => setStep("parent-auth")}
              >
                Back
              </Button>
            </div>
          </Card>
        )}

        {/* Success */}
        {step === "success" && (
          <Card className="p-8">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-accent" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-accent">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Transaction approved by parent and completed securely
              </p>

              <div className="bg-secondary/50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-semibold">₹999</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="font-semibold">Gaming App</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-accent font-semibold">Approved</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={resetDemo}>
                Try Another Demo
              </Button>
            </div>
          </Card>
        )}

        {/* Rejected */}
        {step === "rejected" && (
          <Card className="p-8">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-destructive">Payment Rejected</h2>
              <p className="text-muted-foreground mb-6">
                Parent denied the transaction. No money was deducted.
              </p>

              <div className="bg-secondary/50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-semibold">₹999</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="font-semibold">Gaming App</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-destructive font-semibold">Denied by Parent</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={resetDemo}>
                Try Another Demo
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
