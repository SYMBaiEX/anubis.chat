# ISIS Chat Upgrade System

A comprehensive upgrade modal and feature gating system designed for ISIS Chat's SOL-based subscription model.

## Overview

The upgrade system provides a seamless way for users to upgrade their subscription tiers using Solana (SOL) payments. It includes smart upgrade prompts, feature gating, and a beautiful modal interface that matches the ISIS Chat theme perfectly.

## Architecture

### Core Components

1. **UpgradeModal** (`upgrade-modal.tsx`) - The main modal component
2. **UpgradeProvider** (`upgrade-wrapper.tsx`) - Context provider and FeatureGate component  
3. **useUpgradeModal** (`use-upgrade-modal.ts`) - Hook for modal state management
4. **useFeatureGate** - Hook for feature access control

### System Integration

- **Convex Backend**: Integrates with `subscriptions.ts` for payment processing
- **Solana**: SOL-based payments with blockchain verification
- **Theme System**: Matches existing ISIS Chat design language
- **Authentication**: Works with wallet-based auth system

## Subscription Tiers

### Free Tier
- 50 messages/month
- Basic models only (GPT-4o-mini, DeepSeek-chat)
- No premium features

### Pro Tier (0.05 SOL/month ≈ $12)
- 1,500 messages/month
- 100 premium messages (GPT-4o, Claude 3.5)
- Document uploads
- Chat history
- Basic agents

### Pro+ Tier (0.1 SOL/month ≈ $25)
- 3,000 messages/month  
- 300 premium messages
- Large file uploads (50MB+)
- API access
- Advanced agents
- Priority support

## Usage Examples

### Basic Setup

First, wrap your app with the UpgradeProvider:

```tsx
// In your main layout or providers file
import { UpgradeProvider } from '@/components/auth/upgrade-wrapper';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <UpgradeProvider>
      {children}
    </UpgradeProvider>
  );
}
```

### Manual Upgrade Triggers

```tsx
import { useUpgrade } from '@/components/auth/upgrade-wrapper';

function MyComponent() {
  const { openUpgradeModal } = useUpgrade();

  return (
    <Button 
      onClick={() => openUpgradeModal({ 
        tier: 'pro', 
        trigger: 'manual' 
      })}
    >
      Upgrade to Pro
    </Button>
  );
}
```

### Feature Gating with Components

```tsx
import { FeatureGate } from '@/components/auth/upgrade-wrapper';

function APISettings() {
  return (
    <FeatureGate feature="api_access">
      <div className="api-settings">
        {/* This content only shows for Pro+ users */}
        <h3>API Configuration</h3>
        <input placeholder="API Key" />
      </div>
    </FeatureGate>
  );
}
```

### Programmatic Feature Checks

```tsx
import { useFeatureGate } from '@/hooks/use-upgrade-modal';

function FileUpload() {
  const { requireFeature } = useFeatureGate();

  const handleFileUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB
      if (!requireFeature('large_files')) {
        return; // Upgrade modal will be shown automatically
      }
    }
    
    // Process file upload
    uploadFile(file);
  };

  return (
    <input 
      type="file" 
      onChange={(e) => handleFileUpload(e.target.files?.[0])} 
    />
  );
}
```

## Payment Flow

1. **User triggers upgrade** (manually or through feature gate)
2. **Modal opens** with tier selection and pricing
3. **Payment instructions** show SOL amount and wallet address
4. **User sends SOL** via their Phantom/Solflare wallet
5. **Blockchain verification** confirms the transaction
6. **Subscription activated** with immediate access to features
7. **Success confirmation** with transaction link

## Feature Mapping

| Feature | Free | Pro | Pro+ |
|---------|------|-----|------|
| Basic Chat | ✅ | ✅ | ✅ |
| Premium Models | ❌ | ✅ (100/month) | ✅ (300/month) |
| Document Upload | ❌ | ✅ | ✅ |
| Large Files (50MB+) | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Advanced Agents | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

## Trigger Types

- **`manual`** - User clicks upgrade button
- **`limit_reached`** - User hits message limit
- **`feature_request`** - User tries to access premium feature
- **`premium_model_request`** - User tries to use premium AI model
- **`usage_milestone`** - User reaches usage threshold (75%, 90%)

## Customization

### Custom Payment Address

Update the payment address in `upgrade-modal.tsx`:

```tsx
// Replace with your actual Solana wallet address
const PAYMENT_ADDRESS = "YOUR_SOLANA_WALLET_ADDRESS";
```

### Custom Pricing

Update pricing in `upgrade-modal.tsx` and `subscriptions.ts`:

```tsx
const TIER_CONFIG = {
  pro: {
    priceSOL: 0.05, // Your custom price
    priceUSD: 12,   // Approximate USD value
    // ... other config
  }
};
```

### Custom Features

Add new features to the feature mapping:

```tsx
const featureRequirements = {
  'your_custom_feature': 'pro_plus',
  // ... other features
};
```

## Styling

The system uses Tailwind CSS and follows the existing ISIS Chat design system:

- **Colors**: Blue for Pro tier, Purple for Pro+
- **Icons**: Lucide React icons (Zap, Shield, Crown)
- **Typography**: Consistent with app font sizes and weights
- **Dark Mode**: Full dark mode support
- **Animations**: Smooth transitions and hover effects

## Error Handling

- **Payment failures** show clear error messages
- **Network issues** provide retry options
- **Invalid amounts** are caught before processing
- **Transaction verification** handles blockchain delays
- **User feedback** for all states (loading, success, error)

## Security Considerations

- **Address Verification**: Users must send to exact address
- **Amount Verification**: Exact SOL amounts required
- **Transaction Verification**: Blockchain confirmation required
- **No Private Keys**: System never handles private keys
- **Rate Limiting**: Prevents spam payment attempts

## Testing

See `upgrade-usage-examples.tsx` for comprehensive testing examples that demonstrate all features and edge cases.

## Backend Integration

The system integrates with these Convex functions:

- `processPayment` - Creates payment record and updates subscription
- `confirmPayment` - Confirms blockchain transaction
- `getSubscriptionStatus` - Gets current user subscription
- `trackMessageUsage` - Tracks usage for limits

## Future Enhancements

- **Multiple Payment Methods**: Add support for USDC, credit cards
- **Annual Subscriptions**: Discounted yearly plans
- **Team Plans**: Multi-user subscriptions
- **Usage Analytics**: Detailed usage dashboards
- **Automatic Renewals**: Blockchain-based auto-renewals
- **Referral System**: Referral bonuses for upgrades

## Support

For implementation help or questions:

1. Check the usage examples in `upgrade-usage-examples.tsx`
2. Review the TypeScript interfaces for proper typing
3. Test with the development payment flow before production
4. Monitor Convex logs for payment processing issues

The upgrade system is designed to be maintainable, extensible, and user-friendly while providing a smooth path from free to paid tiers.