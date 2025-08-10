import { PaymentTestDashboard } from '@/components/test/payment-test-dashboard';

export default function PaymentTestsPage() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">
          Payment System Tests
        </h1>
        <p className="text-muted-foreground">
          Comprehensive testing suite for the Convex Auth + Solana payment
          integration
        </p>
      </div>

      <PaymentTestDashboard />
    </div>
  );
}
