import { redirect } from 'next/navigation';
import { checkoutWithStripe, createStripePortal, getSubscription, getUserDetails } from '@/lib/actions/subscription';
import { createClient } from '@/lib/supabase/server';
import CustomerPortalForm from './CustomerPortalForm';
import Pricing from '@/components/ui/pricing';

export default async function Account() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const [subscription, userDetails] = await Promise.all([
    getSubscription(),
    getUserDetails()
  ]);

  return (
    <section className="mb-32 bg-black">
      <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 sm:pt-24 lg:px-8">
        <div className="sm:align-center sm:flex sm:flex-col">
          <h1 className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            Account
          </h1>
          <p className="max-w-2xl m-auto mt-5 text-xl text-zinc-200 sm:text-center sm:text-2xl">
            We partnered with Stripe for simplified billing.
          </p>
        </div>
      </div>
      <div className="p-4">
        <CustomerPortalForm subscription={subscription} />
        {!subscription && (
          <div className="mt-8">
            <Pricing variant="compact" />
          </div>
        )}
      </div>
    </section>
  );
}
