import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  LogOut, 
  IndianRupee, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Users,
  Loader2,
  RotateCcw,
  Play,
  Undo2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PaymentRequest {
  id: string;
  kid_name: string;
  merchant_name: string;
  amount: number;
  status: string;
  upi_pin_entered: boolean;
  otp_verified: boolean;
  admin_credited: boolean;
  payment_completed: boolean;
  payment_reverted: boolean;
  game_company: string | null;
  created_at: string;
  otp_code: string | null;
}

const AdminDashboard = () => {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCredited: 0,
    totalCompleted: 0,
    totalReverted: 0,
    pendingCount: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
    fetchPayments();
    
    const channel = supabase
      .channel("admin-payments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_requests",
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/admin");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      await supabase.auth.signOut();
      navigate("/admin");
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as PaymentRequest[];
      setPayments(typedData);

      const credited = typedData.filter(p => p.admin_credited).reduce((sum, p) => sum + Number(p.amount), 0);
      const completed = typedData.filter(p => p.payment_completed).reduce((sum, p) => sum + Number(p.amount), 0);
      const reverted = typedData.filter(p => p.payment_reverted).reduce((sum, p) => sum + Number(p.amount), 0);
      const pending = typedData.filter(p => p.admin_credited && !p.payment_completed && !p.payment_reverted).length;

      setStats({
        totalCredited: credited,
        totalCompleted: completed,
        totalReverted: reverted,
        pendingCount: pending,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPayment = async (paymentId: string) => {
    setProcessingId(paymentId);
    try {
      const { error } = await supabase
        .from("payment_requests")
        .update({ 
          payment_completed: true, 
          otp_verified: true,
          status: 'completed' 
        })
        .eq("id", paymentId);

      if (error) throw error;

      toast({
        title: "Payment Processed",
        description: "Payment has been marked as completed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevertPayment = async (paymentId: string) => {
    setProcessingId(paymentId);
    try {
      const { error } = await supabase
        .from("payment_requests")
        .update({ 
          payment_reverted: true, 
          admin_credited: false,
          status: 'reverted' 
        })
        .eq("id", paymentId);

      if (error) throw error;

      toast({
        title: "Payment Reverted",
        description: "Payment has been reverted to user",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetData = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("payment_requests")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

      if (error) throw error;

      toast({
        title: "Data Reset",
        description: "All payment data has been cleared",
      });
      fetchPayments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const getStatusBadge = (payment: PaymentRequest) => {
    if (payment.payment_completed) {
      return <Badge className="bg-green-500">Completed</Badge>;
    }
    if (payment.payment_reverted) {
      return <Badge variant="destructive">Reverted</Badge>;
    }
    if (payment.admin_credited) {
      return <Badge className="bg-yellow-500">Pending OTP</Badge>;
    }
    if (payment.upi_pin_entered) {
      return <Badge className="bg-blue-500">UPI Entered</Badge>;
    }
    return <Badge variant="secondary">Initiated</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isPending = (payment: PaymentRequest) => {
    return payment.admin_credited && !payment.payment_completed && !payment.payment_reverted;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Secure Play Payment Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all payment records. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetData} className="bg-destructive hover:bg-destructive/90">
                    Reset All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-blue-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                Total Credited
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-500">₹{stats.totalCredited.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Completed Payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">₹{stats.totalCompleted.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border-red-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Reverted Amount
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">₹{stats.totalReverted.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-500">{stats.pendingCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Payment Requests
            </CardTitle>
            <CardDescription>
              Real-time view of all payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payment requests yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Game/Merchant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>UPI Pin</TableHead>
                      <TableHead>OTP Verified</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.kid_name}</TableCell>
                        <TableCell>{payment.merchant_name}</TableCell>
                        <TableCell className="font-semibold">₹{Number(payment.amount).toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(payment)}</TableCell>
                        <TableCell>
                          {payment.upi_pin_entered ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.otp_verified ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(payment.created_at)}
                        </TableCell>
                        <TableCell>
                          {isPending(payment) && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleProcessPayment(payment.id)}
                                disabled={processingId === payment.id}
                              >
                                {processingId === payment.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-1" />
                                    Process
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRevertPayment(payment.id)}
                                disabled={processingId === payment.id}
                              >
                                {processingId === payment.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Undo2 className="w-4 h-4 mr-1" />
                                    Revert
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
