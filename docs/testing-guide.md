# Testing Guide for NextJS Supabase Gallery

## Overview

This guide provides comprehensive testing instructions for the NextJS Supabase Gallery application, covering authentication, subscription management, payment processing, and gallery functionality.

## Prerequisites

- Node.js 18+ installed
- Supabase CLI installed
- Local development environment set up
- All environment variables configured

## Testing Checklist

### ✅ Authentication Testing

#### Email Authentication
- [ ] **Sign Up Flow**
  - [ ] Valid email and password creates account
  - [ ] Email confirmation sent (check Supabase Inbucket)
  - [ ] Profile automatically created in database
  - [ ] Redirect to appropriate page after signup

- [ ] **Sign In Flow**
  - [ ] Valid credentials allow login
  - [ ] Invalid credentials show error
  - [ ] Session persists across page refreshes
  - [ ] Redirect to intended page after login

- [ ] **Sign Out Flow**
  - [ ] Sign out clears session
  - [ ] Redirect to login page
  - [ ] Protected pages require re-authentication

#### Social Authentication
- [ ] **Google Sign In**
  - [ ] Google OAuth flow works
  - [ ] Profile created/updated from Google data
  - [ ] Email matches Google account

- [ ] **GitHub Sign In**
  - [ ] GitHub OAuth flow works
  - [ ] Profile created/updated from GitHub data
  - [ ] Email matches GitHub account

#### Session Management
- [ ] **Session Persistence**
  - [ ] Session survives page refresh
  - [ ] Session survives browser close/reopen
  - [ ] Session expires appropriately

### ✅ Subscription Testing

#### Subscription Status
- [ ] **Free Tier Access**
  - [ ] Can view limited number of images
  - [ ] Cannot download images
  - [ ] Subscription prompts shown appropriately

- [ ] **Paid Subscription Access**
  - [ ] Can view unlimited images
  - [ ] Can download images based on plan
  - [ ] Features match subscription tier

#### Subscription Management
- [ ] **View Current Subscription**
  - [ ] Subscription details display correctly
  - [ ] Expiration date shown
  - [ ] Plan features listed

- [ ] **Subscription Renewal**
  - [ ] Renewal process works
  - [ ] Billing date updated
  - [ ] Continued access maintained

### ✅ Payment Processing

#### Stripe Integration
- [ ] **Subscription Creation**
  - [ ] Stripe checkout flow initiates
  - [ ] Payment form loads correctly
  - [ ] Test cards work (4242 4242 4242 4242)
  - [ ] Subscription created in database

- [ ] **Webhook Handling**
  - [ ] Webhook endpoint receives events
  - [ ] Subscription status updates
  - [ ] Payment failures handled

- [ ] **Error Handling**
  - [ ] Declined card shows error
  - [ ] Network errors handled gracefully
  - [ ] User feedback provided

#### PayPal Integration
- [ ] **Subscription Creation**
  - [ ] PayPal checkout flow initiates
  - [ ] PayPal login works
  - [ ] Subscription agreement created
  - [ ] Subscription created in database

- [ ] **Plan Management**
  - [ ] Dynamic plan creation works
  - [ ] Plan prices match configuration
  - [ ] Plan features correctly set

#### Crypto Payment Integration
- [ ] **Coinbase Commerce**
  - [ ] Charge creation works
  - [ ] Payment page loads
  - [ ] QR code displays
  - [ ] Payment detection works

### ✅ Gallery Functionality

#### Image Display
- [ ] **Gallery Grid**
  - [ ] Images load correctly
  - [ ] Responsive grid layout
  - [ ] Image quality appropriate
  - [ ] Loading states work

- [ ] **Image Viewer**
  - [ ] Full-size image opens
  - [ ] Image navigation works
  - [ ] Zoom functionality
  - [ ] Keyboard navigation

#### Image Management
- [ ] **Upload Functionality**
  - [ ] File upload works
  - [ ] Image processing completes
  - [ ] Metadata extracted
  - [ ] Thumbnails generated

- [ ] **Download Functionality**
  - [ ] Download links work
  - [ ] Download limits enforced
  - [ ] Download tracking works
  - [ ] File integrity maintained

#### Filtering and Search
- [ ] **Gallery Filters**
  - [ ] Category filters work
  - [ ] Date range filters work
  - [ ] Tag filters work
  - [ ] Multiple filters combine correctly

- [ ] **Search Functionality**
  - [ ] Text search works
  - [ ] Search results accurate
  - [ ] Search performance acceptable
  - [ ] No results state handled

### ✅ Database Operations

#### Data Integrity
- [ ] **User Profiles**
  - [ ] Profiles created automatically
  - [ ] Profile updates save correctly
  - [ ] RLS policies enforced

- [ ] **Subscriptions**
  - [ ] Subscription data accurate
  - [ ] Status updates correctly
  - [ ] Historical data preserved

- [ ] **Images**
  - [ ] Image metadata complete
  - [ ] File paths correct
  - [ ] User ownership enforced

#### Performance
- [ ] **Query Performance**
  - [ ] Gallery loads quickly
  - [ ] Search results fast
  - [ ] Pagination works smoothly

- [ ] **Database Migrations**
  - [ ] Migrations run successfully
  - [ ] Schema matches expectations
  - [ ] No data loss occurs

### ✅ API Endpoints

#### Authentication APIs
- [ ] **POST /api/auth/signup**
  - [ ] Creates user account
  - [ ] Returns appropriate response
  - [ ] Handles errors correctly

- [ ] **POST /api/auth/signin**
  - [ ] Authenticates user
  - [ ] Sets session correctly
  - [ ] Returns user data

#### Subscription APIs
- [ ] **GET /api/subscriptions/sync**
  - [ ] Returns current subscription
  - [ ] Authentication required
  - [ ] Data format correct

- [ ] **POST /api/subscriptions/sync**
  - [ ] Updates subscription status
  - [ ] Validates input data
  - [ ] Returns success response

#### Payment APIs
- [ ] **POST /api/stripe/checkout/subscription**
  - [ ] Creates Stripe session
  - [ ] Returns checkout URL
  - [ ] Handles errors

- [ ] **POST /api/paypal/subscription**
  - [ ] Creates PayPal subscription
  - [ ] Returns approval URL
  - [ ] Handles errors

- [ ] **POST /api/crypto/subscription**
  - [ ] Creates crypto charge
  - [ ] Returns payment URL
  - [ ] Handles errors

### ✅ Error Handling

#### User-Facing Errors
- [ ] **Authentication Errors**
  - [ ] Clear error messages
  - [ ] Appropriate error codes
  - [ ] User guidance provided

- [ ] **Payment Errors**
  - [ ] Card declined messages
  - [ ] Network error handling
  - [ ] Retry mechanisms

- [ ] **Subscription Errors**
  - [ ] Access denied messages
  - [ ] Upgrade prompts
  - [ ] Clear next steps

#### System Errors
- [ ] **API Errors**
  - [ ] Consistent error format
  - [ ] Proper HTTP status codes
  - [ ] Error logging works

- [ ] **Database Errors**
  - [ ] Connection issues handled
  - [ ] Query errors logged
  - [ ] Fallback behavior

### ✅ Security Testing

#### Authentication Security
- [ ] **Session Security**
  - [ ] Sessions expire appropriately
  - [ ] Session hijacking prevented
  - [ ] CSRF protection active

- [ ] **Password Security**
  - [ ] Password requirements enforced
  - [ ] Passwords properly hashed
  - [ ] Password reset secure

#### Data Security
- [ ] **RLS Policies**
  - [ ] Users can only access own data
  - [ ] Subscription data protected
  - [ ] Image access controlled

- [ ] **API Security**
  - [ ] Authentication required
  - [ ] Input validation works
  - [ ] Rate limiting active

### ✅ Performance Testing

#### Load Testing
- [ ] **Concurrent Users**
  - [ ] Multiple users can authenticate
  - [ ] Gallery loads under load
  - [ ] Database performance stable

- [ ] **Image Loading**
  - [ ] Images load efficiently
  - [ ] CDN integration works
  - [ ] Caching effective

#### Scalability
- [ ] **Database Scaling**
  - [ ] Queries optimized
  - [ ] Indexes effective
  - [ ] Connection pooling works

- [ ] **File Storage**
  - [ ] File uploads handle large files
  - [ ] Storage quotas enforced
  - [ ] Cleanup processes work

## Manual Testing Scripts

### Authentication Test Script
```bash
# Test user signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test user signin
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Subscription Test Script
```bash
# Check subscription status
curl -X GET http://localhost:3000/api/subscriptions/sync \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update subscription
curl -X POST http://localhost:3000/api/subscriptions/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"subscriptionId":"sub_123","status":"active","planType":"premium"}'
```

## Automated Testing

### Unit Tests
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Run API tests
npm run test:api

# Run database tests
npm run test:db
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- --spec="auth.spec.ts"

# Run headless
npm run test:e2e:headless
```

## Test Data

### Test User Accounts
- **Free User**: `free@test.com` / `password123`
- **Premium User**: `premium@test.com` / `password123`
- **Admin User**: `admin@test.com` / `password123`

### Test Payment Methods
- **Stripe Test Card**: `4242 4242 4242 4242`
- **Declined Card**: `4000 0000 0000 0002`
- **PayPal Sandbox**: Use PayPal sandbox credentials
- **Crypto Test**: Use Coinbase Commerce test mode

## Troubleshooting

### Common Issues
1. **Authentication fails**: Check Supabase configuration
2. **Payments fail**: Verify API keys and webhook setup
3. **Images don't load**: Check storage configuration
4. **Database errors**: Verify migrations and RLS policies

### Debug Commands
```bash
# Check environment variables
npm run env:check

# Validate database schema
npm run db:validate

# Check API health
curl http://localhost:3000/api/health

# View logs
npm run logs
```

## Reporting Issues

When reporting issues, include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment details
- Error messages and logs
- Screenshots if applicable

## Test Completion

- [ ] All authentication tests pass
- [ ] All subscription tests pass
- [ ] All payment tests pass
- [ ] All gallery tests pass
- [ ] All API tests pass
- [ ] All security tests pass
- [ ] All performance tests pass
- [ ] Documentation updated
- [ ] Issues reported and tracked
