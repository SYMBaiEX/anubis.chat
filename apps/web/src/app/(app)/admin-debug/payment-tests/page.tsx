import { PaymentTestDashboard } from '@/components/test/payment-test-dashboard';

export default function PaymentTestsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Payment System Tests</h1>
        <p className="text-muted-foreground">
          Comprehensive testing suite for the Convex Auth + Solana payment integration
        </p>
      </div>
      
      <PaymentTestDashboard />
    </div>
  );
}