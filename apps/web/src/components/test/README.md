# Payment System Test Suite

Comprehensive testing framework for the Convex Auth + Solana payment system integration.

## Overview

This test suite provides comprehensive validation and debugging tools for the ISIS Chat payment system, which integrates Convex Auth for user authentication with Solana blockchain payments for subscription management.

## Architecture

The payment system consists of several key components:

1. **Convex Auth** - Handles user authentication using Solana wallet signatures
2. **Subscription Management** - Tracks user subscription tiers and usage limits
3. **Solana Payment Processing** - Processes SOL payments for subscription upgrades
4. **Usage Tracking** - Monitors API usage and enforces tier limits
5. **Feature Gating** - Controls access to premium features based on subscription

## Test Components

### PaymentTestDashboard (`payment-test-dashboard.tsx`)
Main dashboard providing unified access to all testing tools with real-time system health monitoring.

**Features:**
- System health status monitoring
- Quick access to all test suites
- Real-time subscription and usage stats
- Environment configuration display

### PaymentIntegrationTest (`payment-integration-test.tsx`)
Core integration testing suite that validates all major system functionality.

**Test Categories:**
- **Authentication Tests**: User auth, wallet consistency, profile validation
- **Subscription Tests**: Status retrieval, usage limits, feature gating
- **Model Access Tests**: Standard and premium model access validation
- **Usage Tracking Tests**: Message and premium usage tracking
- **Payment Tests**: Payment simulation, validation, API endpoints
- **Security Tests**: Unauthorized access protection, data validation

### PaymentValidationSuite (`payment-validation-suite.tsx`)
Advanced validation testing for security vulnerabilities and edge cases.

**Test Categories:**
- **Security Validation**: 
  - Unauthorized payment access protection
  - Payment amount manipulation prevention
  - Transaction signature validation
  - Wallet address spoofing protection
  - Subscription tier bypass prevention
  - Usage limit bypass protection

- **Edge Case Testing**:
  - Payment boundary conditions
  - Concurrent payment handling
  - Subscription expiry scenarios
  - Zero balance handling
  - Maximum usage scenarios
  - Data consistency checks

- **Performance Validation**:
  - API response time monitoring
  - Database query performance
  - Concurrent request handling

### PaymentDevTools (`payment-dev-tools.tsx`)
Development utilities for testing and debugging during development.

**Features:**
- Manual usage tracking (standard and premium messages)
- Detailed usage tracking with token counts
- Test payment processing
- Usage scenario simulation
- Usage reset utilities (dev only)

### WalletIntegrationTest (`wallet-integration-test.tsx`)
Tests for wallet connection and Solana integration components.

**Test Coverage:**
- Wallet connection status
- Authentication flow validation
- User ID consistency
- Balance fetching
- Solana Agent initialization
- Agent balance consistency

## Usage Guide

### Quick Start

1. **Access the Test Dashboard**
   ```
   Navigate to: /admin-debug/payment-tests
   ```

2. **Connect Your Wallet**
   - Use a test wallet with some devnet SOL
   - Authenticate through the wallet connection flow

3. **Run Integration Tests**
   - Go to the "Integration Tests" tab
   - Click "Run All Tests" to execute the full test suite
   - Review results and any failures

### Development Testing

1. **Use Dev Tools Carefully**
   - Dev tools modify real user data
   - Always test on devnet first
   - Use the usage reset function to clean up test data

2. **Test Payment Flows**
   - Use small amounts (0.001-0.01 SOL) for testing
   - Test both valid and invalid payment scenarios
   - Verify proper error handling

3. **Validate Security**
   - Run the validation suite regularly
   - Ensure all critical security tests pass
   - Monitor for new vulnerabilities

### Test Scenarios

#### Happy Path Testing
1. Connect wallet and authenticate
2. Check subscription status and limits
3. Track some usage (within limits)
4. Process a test payment
5. Verify subscription upgrade

#### Edge Case Testing
1. Test with expired subscriptions
2. Test at usage limits
3. Test with invalid payment amounts
4. Test concurrent requests
5. Test boundary conditions

#### Security Testing
1. Test unauthorized access attempts
2. Test payment tampering scenarios
3. Test signature validation
4. Test tier bypass attempts
5. Test rate limiting

## Configuration

### Environment Variables

Required environment variables for testing:
```bash
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com  # Use devnet for testing
NEXT_PUBLIC_TREASURY_WALLET=<treasury_wallet_address>
CONVEX_URL=<your_convex_url>
CONVEX_AUTH_ADAPTER=<convex_auth_config>
```

### Test Data

The test suite uses the following test data patterns:
- Test transaction signatures: `test_${timestamp}_${random}`
- Test wallet addresses: Real connected wallet or test addresses
- Test amounts: Small values (0.001-0.1 SOL) for safety

## Security Considerations

### Test Environment Security
- Never use production wallets for testing
- Use devnet SOL for all payment tests
- Keep test private keys secure
- Don't commit sensitive test data

### Production Testing
- Run validation suite before deployments
- Monitor all security test results
- Test edge cases thoroughly
- Validate error handling

## Troubleshooting

### Common Issues

**Authentication Fails**
- Ensure wallet is connected
- Check if using correct network (devnet/mainnet)
- Verify Convex Auth configuration

**Payment Tests Fail**
- Verify treasury wallet address
- Check SOL balance in test wallet
- Ensure RPC endpoint is responsive
- Validate payment amounts match tier prices

**Subscription Data Issues**
- Check Convex database connection
- Verify schema is up to date
- Check for data consistency issues

**Performance Issues**
- Monitor API response times
- Check database query performance
- Verify network connectivity

### Debug Tips

1. **Check Browser Console**: Most errors are logged to browser console
2. **Review Network Tab**: Check API request/response details
3. **Monitor Test Results**: Pay attention to failed test details
4. **Use Dev Tools**: Reset usage data when testing limits
5. **Test Incrementally**: Test one component at a time for easier debugging

## Best Practices

### Testing Workflow
1. Always test on devnet first
2. Run integration tests before validation tests
3. Use dev tools to simulate different scenarios
4. Reset test data between test sessions
5. Document any issues found

### Security Testing
1. Run security validation regularly
2. Test all critical paths
3. Validate error handling
4. Monitor for new attack vectors
5. Keep security tests up to date

### Performance Testing
1. Monitor response times
2. Test under load
3. Verify database performance
4. Check memory usage
5. Validate error rates

## Contributing

When adding new tests:

1. Follow existing test patterns
2. Include proper error handling
3. Add comprehensive validation
4. Document test purpose and expected outcomes
5. Test both success and failure cases

## Support

For issues with the test suite:
1. Check this README for troubleshooting
2. Review console logs for errors
3. Test with minimal configuration
4. Create detailed issue reports with test results