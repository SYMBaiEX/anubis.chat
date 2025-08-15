/**
 * Subscription and Billing Types
 * Comprehensive type definitions for subscription management, billing, and payment processing
 * Strict TypeScript - No any, unknown, or void types allowed
 */

import type { ConvexId } from './convex-integration';
import type { Result } from './result';

// =============================================================================
// Core Subscription Types
// =============================================================================

export interface Subscription {
  _id: ConvexId<'subscriptions'>;
  _creationTime: number;
  walletAddress: string;
  teamId?: ConvexId<'teams'>;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: number;
  cancelReason?: CancellationReason;
  trialStart?: number;
  trialEnd?: number;
  discounts?: SubscriptionDiscount[];
  paymentMethod?: PaymentMethod;
  billingAddress?: BillingAddress;
  usage: SubscriptionUsage;
  limits: SubscriptionLimits;
  features: SubscriptionFeature[];
  addons?: SubscriptionAddon[];
  metadata?: SubscriptionMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  tier: SubscriptionTier;
  pricing: PlanPricing;
  features: PlanFeature[];
  limits: PlanLimits;
  availability: PlanAvailability;
  deprecated?: boolean;
  deprecationDate?: number;
  migrationPlan?: string;
}

export type SubscriptionTier =
  | 'free'
  | 'starter'
  | 'professional'
  | 'team'
  | 'enterprise'
  | 'custom';

export interface PlanPricing {
  basePrice: number;
  currency: string;
  interval: BillingInterval;
  usage: UsagePricing[];
  discounts?: PricingDiscount[];
  taxes?: TaxConfiguration;
  customPricing?: boolean;
}

export type BillingInterval = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface UsagePricing {
  metricName: string;
  tieredPricing?: TieredPricing[];
  flatRate?: number;
  freeAllowance?: number;
  overage?: OveragePricing;
}

export interface TieredPricing {
  upTo: number; // -1 for unlimited
  pricePerUnit: number;
  flatFee?: number;
}

export interface OveragePricing {
  pricePerUnit: number;
  minimumCharge?: number;
  gracePeriod?: number; // days
  warningThreshold?: number; // percentage
}

export interface PricingDiscount {
  type: DiscountType;
  value: number;
  duration?: number; // months, null for permanent
  conditions?: DiscountCondition[];
}

export type DiscountType =
  | 'percentage'
  | 'fixed_amount'
  | 'free_trial'
  | 'usage_credit';

export interface DiscountCondition {
  type: 'annual_billing' | 'volume' | 'loyalty' | 'referral' | 'custom';
  threshold?: number;
  operator?: 'gte' | 'lte' | 'eq';
}

export interface TaxConfiguration {
  taxInclusive: boolean;
  automaticTax: boolean;
  taxBehavior: 'inclusive' | 'exclusive' | 'unspecified';
  taxCode?: string;
}

export interface PlanFeature {
  id: string;
  name: string;
  description?: string;
  type: FeatureType;
  enabled: boolean;
  value?: FeatureValue;
  metadata?: FeatureMetadata;
}

export type FeatureType =
  | 'boolean'
  | 'numeric'
  | 'quota'
  | 'list'
  | 'configuration'
  | 'access_level';

export type FeatureValue =
  | boolean
  | number
  | string
  | string[]
  | Record<string, string | number | boolean>;

export interface FeatureMetadata {
  category?: string;
  priority?: number;
  dependencies?: string[];
  conflicts?: string[];
  beta?: boolean;
}

export interface PlanLimits {
  // Core usage limits
  maxTokensPerMonth?: number;
  maxTokensPerDay?: number;
  maxRequestsPerMinute?: number;
  maxRequestsPerHour?: number;
  maxRequestsPerDay?: number;
  maxRequestsPerMonth?: number;

  // Chat and messaging limits
  maxChats?: number;
  maxMessagesPerChat?: number;
  maxMessageLength?: number;
  maxAttachmentSize?: number;
  maxAttachmentsPerMessage?: number;

  // AI and model limits
  maxModelsAccess?: string[];
  maxTemperature?: number;
  maxContextLength?: number;
  maxToolCalls?: number;
  maxConcurrentRequests?: number;

  // Storage and documents
  maxStorageGB?: number;
  maxDocuments?: number;
  maxDocumentSize?: number;
  maxVectorStores?: number;
  maxKnowledgeBases?: number;

  // Team and collaboration
  maxTeamMembers?: number;
  maxSharedChats?: number;
  maxWorkflows?: number;
  maxAgents?: number;

  // API and integrations
  maxApiCalls?: number;
  maxWebhooks?: number;
  maxIntegrations?: number;
  maxCustomTools?: number;

  // Support and features
  supportLevel?: SupportLevel;
  retentionDays?: number;
  exportFrequency?: ExportFrequency;
  prioritySupport?: boolean;
}

export type SupportLevel =
  | 'community'
  | 'email'
  | 'priority'
  | 'dedicated'
  | 'enterprise';
export type ExportFrequency =
  | 'monthly'
  | 'weekly'
  | 'daily'
  | 'real_time'
  | 'on_demand';

export interface PlanAvailability {
  regions?: string[];
  userTypes?: UserType[];
  minimumCommitment?: number; // months
  publiclyAvailable: boolean;
  requiresApproval?: boolean;
  customOnboarding?: boolean;
}

export type UserType =
  | 'individual'
  | 'team'
  | 'organization'
  | 'enterprise'
  | 'non_profit';

export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export type CancellationReason =
  | 'user_requested'
  | 'payment_failed'
  | 'fraud'
  | 'violation'
  | 'downgrade'
  | 'migration'
  | 'other';

export interface SubscriptionDiscount {
  id: string;
  couponId?: string;
  promotionCode?: string;
  type: DiscountType;
  value: number;
  duration?: number;
  startDate?: number;
  endDate?: number;
  usageCount?: number;
  maxUsage?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface SubscriptionUsage {
  // Token usage
  tokensUsed: number;
  tokensLimit: number;
  tokensResetAt: number;

  // Request usage
  requestsUsed: number;
  requestsLimit: number;
  requestsResetAt: number;

  // Storage usage
  storageUsedGB: number;
  storageLimitGB: number;

  // Feature usage
  chatsUsed: number;
  chatsLimit: number;
  documentsUsed: number;
  documentsLimit: number;
  teamMembersUsed: number;
  teamMembersLimit: number;

  // API usage
  apiCallsUsed: number;
  apiCallsLimit: number;

  // Usage history
  dailyUsage?: DailyUsage[];
  monthlyUsage?: MonthlyUsage[];

  // Overage tracking
  overageCharges?: OverageCharge[];
  nextBillingAmount?: number;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  tokens: number;
  requests: number;
  storage: number;
  cost: number;
}

export interface MonthlyUsage {
  month: string; // YYYY-MM
  tokens: number;
  requests: number;
  averageStorage: number;
  cost: number;
  overageCharges: number;
}

export interface OverageCharge {
  metric: string;
  usage: number;
  allowance: number;
  overage: number;
  rate: number;
  amount: number;
  period: string;
}

export interface SubscriptionLimits extends PlanLimits {
  // Current period specific limits
  remainingTokens: number;
  remainingRequests: number;
  remainingStorage: number;

  // Rate limiting
  currentRateLimit: RateLimit;
  rateLimitResetAt: number;

  // Burst allowances
  burstTokensUsed?: number;
  burstTokensLimit?: number;
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  concurrentRequests: number;
  burstAllowance?: number;
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  enabled: boolean;
  value?: FeatureValue;
  usageCount?: number;
  usageLimit?: number;
  lastUsed?: number;
}

export interface SubscriptionAddon {
  id: string;
  addonId: string;
  name: string;
  description?: string;
  pricing: AddonPricing;
  quantity: number;
  enabled: boolean;
  addedAt: number;
  expiresAt?: number;
}

export interface AddonPricing {
  type: 'one_time' | 'recurring' | 'usage_based';
  amount: number;
  currency: string;
  interval?: BillingInterval;
  usagePricing?: UsagePricing[];
}

export interface SubscriptionMetadata {
  source?: string; // How the subscription was created
  campaign?: string; // Marketing campaign
  referrer?: string; // Referral source
  salesPerson?: string; // For enterprise sales
  contractId?: string; // For custom contracts
  migrationFrom?: string; // Previous plan
  customFields?: Record<string, string | number | boolean>;
}

// =============================================================================
// Payment and Billing Types
// =============================================================================

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  isDefault: boolean;
  status: PaymentMethodStatus;
  card?: CardDetails;
  crypto?: CryptoDetails;
  bankAccount?: BankAccountDetails;
  wallet?: WalletDetails;
  billing?: BillingAddress;
  metadata?: PaymentMethodMetadata;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

export type PaymentMethodType =
  | 'card'
  | 'crypto'
  | 'bank_transfer'
  | 'wallet'
  | 'ach'
  | 'sepa'
  | 'wire';

export type PaymentMethodStatus =
  | 'active'
  | 'pending'
  | 'expired'
  | 'failed'
  | 'blocked'
  | 'requires_action';

export interface CardDetails {
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  funding: 'credit' | 'debit' | 'prepaid' | 'unknown';
  country?: string;
  threeDSecure?: ThreeDSecureStatus;
}

export type ThreeDSecureStatus =
  | 'required'
  | 'optional'
  | 'not_supported'
  | 'recommended';

export interface CryptoDetails {
  currency: string;
  network: string;
  address?: string;
  supportedNetworks: string[];
  minimumAmount?: number;
  confirmationBlocks?: number;
}

export interface BankAccountDetails {
  routingNumber: string;
  last4: string;
  accountType: 'checking' | 'savings';
  bankName?: string;
  country: string;
  currency: string;
}

export interface WalletDetails {
  walletAddress: string;
  walletType: 'phantom' | 'solflare' | 'metamask' | 'coinbase' | 'other';
  network: string;
  verified: boolean;
  balance?: WalletBalance;
}

export interface WalletBalance {
  amount: number;
  currency: string;
  lastUpdated: number;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  taxId?: string;
}

export interface PaymentMethodMetadata {
  fingerprint?: string;
  riskScore?: number;
  verificationStatus?: VerificationStatus;
  lastVerified?: number;
  failureCount?: number;
  lastFailure?: number;
}

export type VerificationStatus =
  | 'pending'
  | 'verified'
  | 'failed'
  | 'requires_action'
  | 'not_required';

export interface Invoice {
  _id: ConvexId<'invoices'>;
  _creationTime: number;
  subscriptionId: ConvexId<'subscriptions'>;
  walletAddress: string;
  number: string;
  status: InvoiceStatus;
  description?: string;
  currency: string;
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  dueDate: number;
  paidAt?: number;
  voidedAt?: number;
  periodStart: number;
  periodEnd: number;
  items: InvoiceItem[];
  discounts?: InvoiceDiscount[];
  taxes?: InvoiceTax[];
  payments?: InvoicePayment[];
  attempts?: PaymentAttempt[];
  metadata?: InvoiceMetadata;
  createdAt: number;
  updatedAt: number;
}

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible'
  | 'partially_paid';

export interface InvoiceItem {
  id: string;
  type: InvoiceItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  currency: string;
  period?: InvoicePeriod;
  usageRecord?: UsageRecord;
  taxes?: InvoiceItemTax[];
  discounts?: InvoiceItemDiscount[];
  metadata?: Record<string, string | number | boolean>;
}

export type InvoiceItemType =
  | 'subscription'
  | 'usage'
  | 'addon'
  | 'one_time'
  | 'adjustment'
  | 'credit'
  | 'tax'
  | 'discount';

export interface InvoicePeriod {
  start: number;
  end: number;
}

export interface UsageRecord {
  metric: string;
  quantity: number;
  unitPrice: number;
  tierBreakdown?: TierUsage[];
}

export interface TierUsage {
  tier: number;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceItemTax {
  name: string;
  rate: number;
  amount: number;
  jurisdiction?: string;
}

export interface InvoiceItemDiscount {
  name: string;
  type: DiscountType;
  value: number;
  amount: number;
}

export interface InvoiceDiscount {
  couponId?: string;
  discountId?: string;
  name: string;
  type: DiscountType;
  value: number;
  amount: number;
}

export interface InvoiceTax {
  name: string;
  rate: number;
  amount: number;
  jurisdiction?: string;
  taxId?: string;
}

export interface InvoicePayment {
  id: string;
  paymentIntentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paidAt?: number;
  failedAt?: number;
  failureReason?: string;
  refunds?: PaymentRefund[];
}

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'requires_action';

export interface PaymentRefund {
  id: string;
  amount: number;
  currency: string;
  reason?: RefundReason;
  status: RefundStatus;
  requestedAt: number;
  processedAt?: number;
  failedAt?: number;
  failureReason?: string;
}

export type RefundReason =
  | 'duplicate'
  | 'fraudulent'
  | 'requested_by_customer'
  | 'service_issue'
  | 'other';

export type RefundStatus = 'pending' | 'succeeded' | 'failed' | 'canceled';

export interface PaymentAttempt {
  id: string;
  attemptNumber: number;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  attemptedAt: number;
  failedAt?: number;
  failureCode?: string;
  failureMessage?: string;
  nextAttemptAt?: number;
}

export interface InvoiceMetadata {
  billingReason?: string;
  customFields?: Record<string, string | number | boolean>;
  notes?: string;
  tags?: string[];
}

// =============================================================================
// Billing Events and Webhooks Types
// =============================================================================

export interface BillingEvent {
  id: string;
  type: BillingEventType;
  subscriptionId?: ConvexId<'subscriptions'>;
  invoiceId?: ConvexId<'invoices'>;
  paymentMethodId?: string;
  data: BillingEventData;
  timestamp: number;
  processed: boolean;
  processedAt?: number;
  webhooksSent?: WebhookDelivery[];
}

export type BillingEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.deleted'
  | 'subscription.trial_will_end'
  | 'subscription.pending_update_expired'
  | 'invoice.created'
  | 'invoice.finalized'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'invoice.updated'
  | 'payment_method.attached'
  | 'payment_method.detached'
  | 'payment_method.updated'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'charge.succeeded'
  | 'charge.failed'
  | 'charge.dispute.created';

export type BillingEventData =
  | SubscriptionEventData
  | InvoiceEventData
  | PaymentEventData
  | PaymentMethodEventData;

export interface SubscriptionEventData {
  subscription: Subscription;
  previousAttributes?: Partial<Subscription>;
}

export interface InvoiceEventData {
  invoice: Invoice;
  previousAttributes?: Partial<Invoice>;
}

export interface PaymentEventData {
  paymentIntent: PaymentIntent;
  charge?: Charge;
}

export interface PaymentMethodEventData {
  paymentMethod: PaymentMethod;
  previousAttributes?: Partial<PaymentMethod>;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: number;
  confirmedAt?: number;
  failedAt?: number;
  metadata?: Record<string, string>;
}

export interface Charge {
  id: string;
  amount: number;
  currency: string;
  status: ChargeStatus;
  paymentMethod: PaymentMethod;
  captured: boolean;
  refunded: boolean;
  refunds?: PaymentRefund[];
  disputeStatus?: DisputeStatus;
  createdAt: number;
}

export type ChargeStatus = 'pending' | 'succeeded' | 'failed';

export type DisputeStatus =
  | 'warning_needs_response'
  | 'warning_under_review'
  | 'warning_closed'
  | 'needs_response'
  | 'under_review'
  | 'charge_refunded'
  | 'won'
  | 'lost';

export interface WebhookDelivery {
  id: string;
  eventId: string;
  url: string;
  httpStatus?: number;
  requestHeaders: Record<string, string>;
  requestBody: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  attempts: number;
  deliveredAt?: number;
  failedAt?: number;
  nextAttemptAt?: number;
  errorMessage?: string;
}

// =============================================================================
// Analytics and Reporting Types
// =============================================================================

export interface BillingAnalytics {
  period: AnalyticsPeriod;
  revenue: RevenueMetrics;
  subscriptions: SubscriptionMetrics;
  usage: UsageMetrics;
  churn: ChurnMetrics;
  cohorts: CohortAnalysis[];
  forecasting: RevenueForecasting;
}

export interface AnalyticsPeriod {
  start: number;
  end: number;
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface RevenueMetrics {
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  revenueGrowth: number;
  averageRevenuePerUser: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  revenueByPlan: Record<string, number>;
  revenueByRegion: Record<string, number>;
}

export interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  subscriptionGrowthRate: number;
  averageSubscriptionLength: number;
  subscriptionsByTier: Record<SubscriptionTier, number>;
  trialToSubscriptionRate: number;
}

export interface UsageMetrics {
  totalUsage: Record<string, number>;
  averageUsagePerUser: Record<string, number>;
  usageGrowth: Record<string, number>;
  topUsageMetrics: UsageMetric[];
  usageByTier: Record<SubscriptionTier, Record<string, number>>;
}

export interface UsageMetric {
  metric: string;
  totalUsage: number;
  uniqueUsers: number;
  averagePerUser: number;
  growth: number;
}

export interface ChurnMetrics {
  churnRate: number;
  churnRateByTier: Record<SubscriptionTier, number>;
  reasonsForChurn: Record<CancellationReason, number>;
  churnPredictionAccuracy?: number;
  retentionRate: number;
  lifetimeValue: number;
}

export interface CohortAnalysis {
  cohortMonth: string;
  initialSize: number;
  retentionRates: number[]; // By month
  revenueRates: number[]; // By month
  lifetimeValue: number;
}

export interface RevenueForecasting {
  nextMonthPrediction: number;
  nextQuarterPrediction: number;
  confidence: number;
  factors: ForecastingFactor[];
}

export interface ForecastingFactor {
  factor: string;
  impact: number; // -1 to 1
  confidence: number; // 0 to 1
}

// =============================================================================
// Request/Response Types
// =============================================================================

export interface CreateSubscriptionRequest {
  planId: string;
  walletAddress: string;
  teamId?: ConvexId<'teams'>;
  paymentMethodId?: string;
  couponCode?: string;
  trialDays?: number;
  addons?: string[];
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionRequest {
  planId?: string;
  cancelAtPeriodEnd?: boolean;
  paymentMethodId?: string;
  couponCode?: string;
  addons?: SubscriptionAddonUpdate[];
  metadata?: Record<string, string>;
}

export interface SubscriptionAddonUpdate {
  addonId: string;
  quantity?: number;
  action: 'add' | 'remove' | 'update';
}

export interface CreatePaymentMethodRequest {
  type: PaymentMethodType;
  isDefault?: boolean;
  card?: CreateCardRequest;
  crypto?: CreateCryptoRequest;
  bankAccount?: CreateBankAccountRequest;
  billing?: BillingAddress;
}

export interface CreateCardRequest {
  number: string;
  expiryMonth: number;
  expiryYear: number;
  cvc: string;
}

export interface CreateCryptoRequest {
  currency: string;
  network: string;
}

export interface CreateBankAccountRequest {
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  country: string;
}

export interface UsageReportRequest {
  subscriptionId: ConvexId<'subscriptions'>;
  usageRecords: UsageReportRecord[];
  timestamp?: number;
}

export interface UsageReportRecord {
  metric: string;
  quantity: number;
  action?: 'increment' | 'set';
  metadata?: Record<string, string | number>;
}

// =============================================================================
// Error and Result Types
// =============================================================================

export type BillingResult<T> = Result<T, BillingError>;
export type AsyncBillingResult<T> = Promise<BillingResult<T>>;

export interface BillingError {
  code: BillingErrorCode;
  message: string;
  details?: Record<string, string | number | boolean>;
  retryable: boolean;
  suggestion?: string;
}

export type BillingErrorCode =
  | 'PAYMENT_FAILED'
  | 'CARD_DECLINED'
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_PAYMENT_METHOD'
  | 'SUBSCRIPTION_NOT_FOUND'
  | 'PLAN_NOT_FOUND'
  | 'USAGE_LIMIT_EXCEEDED'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_COUPON'
  | 'TRIAL_EXPIRED'
  | 'BILLING_FAILED'
  | 'TAX_CALCULATION_FAILED'
  | 'WEBHOOK_DELIVERY_FAILED'
  | 'FRAUD_DETECTED'
  | 'COMPLIANCE_VIOLATION'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';
