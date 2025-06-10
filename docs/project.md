# Project Document: App Review and Enhancement Proposal

## Request for App Review and Enhancement Proposal

I would like assistance with researching and analyzing the current application, particularly in preparation for improving its architecture and functionality. Below are the key features I aim to implement, along with proposed changes to the existing database schema.

## Target Features

### Authentication (Sign In/Sign Up)
- Support for email/password and social login options (Google, Facebook, etc.) using Supabase Auth.

### Payment System
Users can:
- Purchase individual images via one-time checkout.
- Subscribe to monthly or yearly membership plans for premium access.

### Unified User Identity
- `user.id` from `auth.users` will serve as the primary foreign key across all authentication, image, and payment-related tables.

## Proposed Database Changes
To streamline and simplify the schema:

### Tables to Remove
- `public.users` (replace with `auth.users` from Supabase)
- `products`
- `prices`
- `image_downloads`
- `customers`

### Tables to Retain and Adjust
- `images`
- `purchases`
- `subscriptions`

Schema restructuring and definition adjustments are encouraged to better align with the simplified feature set and improve maintainability.
