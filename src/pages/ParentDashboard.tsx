import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Bell, CheckCircle, XCircle, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface PaymentRequest {
  id: string;
  kid_name: string;
  amount: number;
  merchant_name: string;
  status: string;
  created_at: string;
  otp_code: string | null;
}

export default function ParentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/parent/auth");
        return;
      }
      
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/parent/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch payment requests
    const fetchPaymentRequests = async () => {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("parent_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching payment requests:", error);
        return;
      }

      setPaymentRequests(data || []);
    };

    fetchPaymentRequests();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("payment_requests_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_requests",
          filter: `parent_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Payment request update:", payload);
          
          if (payload.eventType === "INSERT") {
            const newRequest = payload.new as PaymentRequest;
            setPaymentRequests((prev) => [newRequest, ...prev]);
            
            // Show notification
            toast({
              title: "New Payment Request!",
              description: `${newRequest.kid_name} wants to pay ₹${newRequest.amount} to ${newRequest.merchant_name}`,
            });

            // Play notification sound (optional)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification("SafePay Kids - Payment Request", {
                body: `${newRequest.kid_name} requesting ₹${newRequest.amount}`,
                icon: "/favicon.ico",
              });
            }
          } else if (payload.eventType === "UPDATE") {
            setPaymentRequests((prev) =>
              prev.map((req) =>
                req.id === payload.new.id ? (payload.new as PaymentRequest) : req
              )
            );
          }
        }
      )
      .subscribe();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleApprove = async (requestId: string) => {
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const { error } = await supabase
      .from("payment_requests")
      .update({ otp_code: otp, status: "approved" })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to approve payment",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "OTP Generated",
      description: `OTP: ${otp} - Share this with your child to complete the payment`,
    });
  };

  const handleReject = async (requestId: string) => {
    const { error } = await supabase
      .from("payment_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Payment Rejected",
      description: "The payment request has been denied",
      variant: "destructive",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Parent Dashboard</h1>
            <p className="text-muted-foreground">Monitor and approve payment requests</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {paymentRequests.filter((r) => r.status === "pending").length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {paymentRequests.filter((r) => r.status === "approved").length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protected</p>
                <p className="text-2xl font-bold">{paymentRequests.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Payment Requests */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Recent Payment Requests</h2>
          
          {paymentRequests.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payment requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{request.merchant_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Requested by {request.kid_name}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(request.status)} className="flex items-center gap-1">
                      {getStatusIcon(request.status)}
                      {request.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-primary">₹{request.amount}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleString()}
                    </span>
                  </div>

                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleApprove(request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Send OTP
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReject(request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {request.status === "approved" && request.otp_code && (
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">OTP Code:</p>
                      <p className="text-2xl font-bold tracking-wider">{request.otp_code}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Share this code with your child to complete the payment
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}