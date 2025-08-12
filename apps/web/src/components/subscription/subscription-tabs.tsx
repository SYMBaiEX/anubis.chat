'use client';

import { CreditCard, Crown, Plus } from 'lucide-react';
import { useState } from 'react';
import MessageCreditsModal from '@/components/auth/message-credits-modal';
import { UpgradeModal } from '@/components/auth/upgrade-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUpgradeModal } from '@/hooks/use-upgrade-modal';
import { useSubscription } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';

interface SubscriptionTabsProps {
  // Props from existing subscription page
  subscription: any;
  limits: any;
  selectedPlan: 'free' | 'pro' | 'pro_plus';
  onSelectPlan: (plan: 'free' | 'pro' | 'pro_plus') => void;
  preview: {
    standardPreview: { id: string; name: string }[];
    premiumPreview: { id: string; name: string }[];
    standardTotal: number;
    premiumTotal: number;
  };
}

const MESSAGE_CREDIT_PACK = {
  standardCredits: 150,
  premiumCredits: 25,
  priceSOL: 0.025,
  priceUSD: 3.50,
};

export function SubscriptionTabs({
  subscription,
  limits,
  selectedPlan,
  onSelectPlan,
  preview,
}: SubscriptionTabsProps) {
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const { isOpen, openModal, closeModal, suggestedTier } = useUpgradeModal();

  const formatTierLabel = (tier: string): string => {
    switch (tier) {
      case 'pro_plus':
        return 'Pro+';
      case 'pro':
        return 'Pro';
      case 'free':
        return 'Free';
      default:
        return tier;
    }
  };

  const renderSubscriptionTab = () => (
    <div className="space-y-6">
      {/* Current subscription status */}
      <Card className="p-4 ring-1 ring-primary/10 transition hover:ring-primary/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'rounded-lg p-2',
              subscription.tier === 'pro_plus' ? 'bg-purple-100 dark:bg-purple-900' :
              subscription.tier === 'pro' ? 'bg-blue-100 dark:bg-blue-900' :
              'bg-slate-100 dark:bg-slate-800'
            )}>
              <Crown className={cn(
                'h-5 w-5',
                subscription.tier === 'pro_plus' ? 'text-purple-600 dark:text-purple-400' :
                subscription.tier === 'pro' ? 'text-blue-600 dark:text-blue-400' :
                'text-slate-600 dark:text-slate-400'
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-base sm:text-lg">
                {formatTierLabel(subscription.tier)} Plan
              </h3>
              <p className="text-muted-foreground text-xs leading-snug sm:text-sm">
                {subscription.tier === 'free' && 'Basic features with limited access'}
                {subscription.tier === 'pro' && 'Enhanced features with premium models'}
                {subscription.tier === 'pro_plus' && 'Full access including premium models'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => openModal({
              tier: subscription.tier === 'pro' ? 'pro_plus' : 'pro',
              trigger: 'manual',
            })}
            size="sm"
            variant={subscription.tier === 'pro_plus' ? 'outline' : 'default'}
          >
            {subscription.tier === 'free' && 'Upgrade'}
            {subscription.tier === 'pro' && 'Upgrade to Pro+'}
            {subscription.tier === 'pro_plus' && 'Manage Billing'}
          </Button>
        </div>
      </Card>

      {/* Plans comparison */}
      <Card className="p-4 ring-1 ring-border/50 transition hover:ring-primary/20 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-base sm:text-lg">Available Plans</h3>
          {(subscription.tier === 'free' || subscription.tier === 'pro') && (
            <Button 
              onClick={() => openModal({ tier: 'pro_plus', trigger: 'manual' })} 
              size="sm"
            >
              Upgrade to Pro+
            </Button>
          )}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Free Plan */}
            <div>
              <input
                checked={selectedPlan === 'free'}
                className="sr-only"
                id="plan-free"
                name="plan"
                onChange={() => onSelectPlan('free')}
                type="radio"
              />
              <label
                className={cn(
                  'group block cursor-pointer rounded-xl border p-4 transition-all h-full min-h-[10rem]',
                  selectedPlan === 'free'
                    ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-transparent ring-1 ring-primary/40'
                    : 'border-border hover:shadow-sm hover:ring-1 hover:ring-primary/20'
                )}
                htmlFor="plan-free"
              >
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold tracking-tight">Free</div>
                      {subscription.tier === 'free' && (
                        <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                          Current
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-foreground text-sm">$0</div>
                    <div className="text-[11px] text-muted-foreground">Forever</div>
                  </div>
                </div>
              </label>
            </div>

            {/* Pro Plan */}
            <div>
              <input
                checked={selectedPlan === 'pro'}
                className="sr-only"
                id="plan-pro"
                name="plan"
                onChange={() => onSelectPlan('pro')}
                type="radio"
              />
              <label
                className={cn(
                  'group block cursor-pointer rounded-xl border p-4 transition-all h-full min-h-[10rem]',
                  selectedPlan === 'pro'
                    ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-transparent ring-1 ring-primary/40'
                    : 'border-border hover:shadow-sm hover:ring-1 hover:ring-primary/20'
                )}
                htmlFor="plan-pro"
              >
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 text-blue-500">⚡</div>
                        <div className="font-semibold tracking-tight">Pro</div>
                      </div>
                      {subscription.tier === 'pro' && (
                        <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                          Current
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-foreground text-sm">0.05 SOL</div>
                    <div className="text-[11px] text-muted-foreground">per month</div>
                  </div>
                </div>
              </label>
            </div>

            {/* Pro+ Plan */}
            <div>
              <input
                checked={selectedPlan === 'pro_plus'}
                className="sr-only"
                id="plan-pro-plus"
                name="plan"
                onChange={() => onSelectPlan('pro_plus')}
                type="radio"
              />
              <label
                className={cn(
                  'group block cursor-pointer rounded-xl border p-4 transition-all h-full min-h-[10rem]',
                  selectedPlan === 'pro_plus'
                    ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-transparent ring-1 ring-primary/40'
                    : 'border-border hover:shadow-sm hover:ring-1 hover:ring-primary/20'
                )}
                htmlFor="plan-pro-plus"
              >
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-purple-500" />
                        <div className="font-semibold tracking-tight">Pro+</div>
                      </div>
                      {(subscription.tier === 'pro_plus' || subscription.tier === 'admin') && (
                        <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                          Current
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-foreground text-sm">0.1 SOL</div>
                    <div className="text-[11px] text-muted-foreground">per month</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Features preview */}
          <div>
            <h4 className="mb-2 font-medium">
              Features for{' '}
              {selectedPlan === 'pro_plus'
                ? 'Pro+'
                : selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
            </h4>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">Messages/month</div>
                <div className="font-medium">
                  {selectedPlan === 'free' && '50'}
                  {selectedPlan === 'pro' && '500'}
                  {selectedPlan === 'pro_plus' && '1,000'}
                </div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">Premium messages</div>
                <div className="font-medium">
                  {selectedPlan === 'free' && '—'}
                  {selectedPlan === 'pro' && '100'}
                  {selectedPlan === 'pro_plus' && '300'}
                </div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">Standard models</div>
                <div className="font-medium">{preview.standardTotal}</div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">Premium models</div>
                <div className="font-medium">{preview.premiumTotal}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderCreditsTab = () => (
    <div className="space-y-6">
      {/* Current credits balance */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base sm:text-lg">Current Credit Balance</h3>
          <Button 
            onClick={() => setIsCreditsModalOpen(true)}
            size="sm"
            className="bg-gradient-to-r from-green-500 to-green-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Buy Credits
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center rounded-lg border p-4">
            <div className="font-bold text-2xl text-green-600">
              {subscription.messageCredits || 0}
            </div>
            <div className="text-muted-foreground text-sm">Standard Credits</div>
            <div className="text-muted-foreground text-xs mt-1">
              Used after plan messages
            </div>
          </div>
          <div className="text-center rounded-lg border p-4">
            <div className="font-bold text-2xl text-green-600">
              {subscription.premiumMessageCredits || 0}
            </div>
            <div className="text-muted-foreground text-sm">Premium Credits</div>
            <div className="text-muted-foreground text-xs mt-1">
              Used after plan premium messages
            </div>
          </div>
        </div>
      </Card>

      {/* Message credit pack info */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 p-2">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Message Credit Pack</h3>
              <p className="text-muted-foreground text-sm">
                Get additional messages without upgrading
              </p>
            </div>
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
            Best Value
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="font-bold text-2xl text-green-700 dark:text-green-300">
              {MESSAGE_CREDIT_PACK.standardCredits}
            </div>
            <div className="text-green-600 text-sm dark:text-green-400">Standard Messages</div>
          </div>
          <div className="text-center rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="font-bold text-2xl text-green-700 dark:text-green-300">
              {MESSAGE_CREDIT_PACK.premiumCredits}
            </div>
            <div className="text-green-600 text-sm dark:text-green-400">Premium Messages</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div>
            <div className="font-semibold">Price per pack</div>
            <div className="text-muted-foreground text-sm">
              No subscription required
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xl">{MESSAGE_CREDIT_PACK.priceSOL} SOL</div>
            <div className="text-muted-foreground text-sm">≈ ${MESSAGE_CREDIT_PACK.priceUSD} USD</div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="text-sm text-muted-foreground">
            ✓ Credits never expire<br />
            ✓ Stack with your plan messages<br />
            ✓ Used after plan messages are consumed<br />
            ✓ Support referral commissions
          </div>

          <Button 
            onClick={() => setIsCreditsModalOpen(true)}
            className="w-full bg-gradient-to-r from-green-500 to-green-600"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Purchase Message Credits
          </Button>
        </div>
      </Card>

      {/* How it works */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">How Message Consumption Works</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start space-x-2">
            <div className="font-bold text-blue-600 min-w-[20px]">1.</div>
            <div>Your <strong>plan messages</strong> are used first (50 for Free, 500 for Pro, 1000 for Pro+)</div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="font-bold text-green-600 min-w-[20px]">2.</div>
            <div>When plan messages run out, <strong>purchased credits</strong> are used automatically</div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="font-bold text-purple-600 min-w-[20px]">3.</div>
            <div>Premium messages follow the same pattern: plan premium first, then premium credits</div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscriptions" className="flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span>Subscription Plans</span>
          </TabsTrigger>
          <TabsTrigger value="credits" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Message Credits</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscriptions" className="mt-6">
          {renderSubscriptionTab()}
        </TabsContent>
        
        <TabsContent value="credits" className="mt-6">
          {renderCreditsTab()}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <UpgradeModal
        isOpen={isOpen}
        onClose={closeModal}
        suggestedTier={suggestedTier}
        trigger="manual"
      />

      <MessageCreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
      />
    </>
  );
}

export default SubscriptionTabs;