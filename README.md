# NextJS Supabase Gallery

A modern, subscription-based image gallery application built with Next.js, Supabase, TypeScript, and multiple payment providers.

## ✨ Features

### Core Functionality

- 🖼️ **Modern Image Gallery** - Responsive masonry layout with enhanced viewer
- 🔐 **Multi-Auth Support** - Email, Google, GitHub authentication
- 💳 **Multiple Payment Providers** - Stripe, PayPal, and Cryptocurrency payments
- 📱 **Responsive Design** - Mobile-first, adaptive UI
- ⚡ **Real-time Updates** - Live subscription and payment status sync

### Subscription System

- 🎯 **Tiered Access** - Free, Standard, Premium, and Commercial plans
- 📊 **Usage Tracking** - Download limits and access control
- 🔄 **Auto-renewal** - Seamless subscription management
- 💰 **Flexible Billing** - Monthly and yearly options

### Technical Features

- 🚀 **Next.js 14** - App Router, Server Components
- 🗄️ **Supabase** - PostgreSQL, Authentication, Storage, RLS
- 🎨 **Tailwind CSS** - Modern, responsive styling
- 📝 **TypeScript** - Full type safety
- 🔒 **Security** - Row Level Security, API protection
- ⚡ **Performance** - Image optimization, caching

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- NPM/Yarn
- Supabase CLI
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd nextjs-supabase-gallery
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start Supabase locally**

   ```bash
   npx supabase start
   ```

5. **Run database migrations**

   ```bash
   npx supabase db reset
   ```

6. **Start the development server**

```bash
# Just use the default .env file
$ npm run dev

# Use .env.local for local Docker Supabase
$ npm run dev:local
```

7. **Open the application**
   ```bash
   open http://localhost:3000
   ```

## 📚 Documentation

### Setup & Configuration

- [🔧 Environment Setup](docs/setup.md)
- [🗄️ Supabase Configuration](docs/supabase.md)
- [🧪 Testing Guide](docs/testing-guide.md)

### Project Documentation

- [📋 Project Requirements](docs/PRD.md)
- [💳 Payment System](docs/payment.md)
- [📊 Project Analysis](docs/project-analysis.md)
- [🏗️ Architecture](docs/project.md)

### Development

- [🤝 Contributing](docs/contributions.md)
- [📝 TODOs](docs/todos.md)

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking

# Database
npx supabase start      # Start local Supabase
npx supabase stop       # Stop local Supabase
npx supabase db reset   # Reset database with migrations
npx supabase studio     # Open Supabase Studio

# Testing
npm run test            # Run unit tests
npm run test:e2e        # Run end-to-end tests
npm run test:integration # Run integration tests

# Environment
npm run env:check       # Validate environment variables
npm run env:report      # Generate environment report
```

### Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Authentication routes
│   │   ├── (payment)/      # Payment routes
│   │   ├── api/            # API routes
│   │   └── ...
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── gallery/       # Gallery components
│   │   ├── ui/            # UI components
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and configurations
│   │   ├── supabase/     # Supabase client/server
│   │   ├── utils/        # Utility functions
│   │   └── ...
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── supabase/              # Supabase configuration
│   ├── migrations/        # Database migrations
│   └── config.toml        # Supabase config
├── docs/                  # Project documentation
├── scripts/               # Utility scripts
└── ...
```

## 🔧 Configuration

### Environment Variables

Required variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# App
APP_URL=http://localhost:3000
```

Optional payment providers:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Crypto (Coinbase Commerce)
COINBASE_COMMERCE_API_KEY=your_coinbase_api_key
```

### Database Schema

The application uses a PostgreSQL database with the following main tables:

- `profiles` - User profile information
- `subscriptions` - User subscription data
- `images` - Image metadata and storage info
- `downloads` - Download tracking and limits

Row Level Security (RLS) is enabled for data protection.

## 🔒 Security

### Authentication

- Supabase Auth with multiple providers
- Session-based authentication
- Secure password policies

### Data Protection

- Row Level Security (RLS) policies
- API route protection
- Input validation and sanitization

### Payment Security

- PCI-compliant payment processing
- Webhook signature validation
- Secure API key management

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# All tests
npm run test:all
```

### Test Coverage

- Authentication flows
- Payment processing
- Subscription management
- Gallery functionality
- API endpoints

See [Testing Guide](docs/testing-guide.md) for comprehensive testing instructions.

## 📈 Performance

### Optimizations

- Image optimization with Next.js
- Lazy loading and virtualization
- Database query optimization
- CDN integration for static assets

### Monitoring

- Error tracking and logging
- Performance metrics
- User analytics (optional)

## 🚀 Deployment

### Vercel (Recommended)

1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Manual Deployment

1. Build the application: `npm run build`
2. Start production server: `npm run start`
3. Configure reverse proxy (nginx/Apache)

### Database

- Production Supabase instance
- Environment-specific migrations
- Backup and recovery procedures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

See [Contributing Guide](docs/contributions.md) for detailed instructions.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](https://your-demo-url.com)
- [Documentation](https://your-docs-url.com)
- [Issue Tracker](https://github.com/your-repo/issues)
- [Changelog](CHANGELOG.md)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Stripe](https://stripe.com/) - Payment processing
- [PayPal](https://paypal.com/) - Payment processing
- [Coinbase Commerce](https://commerce.coinbase.com/) - Crypto payments

---

**Built with ❤️ using Next.js and Supabase**
