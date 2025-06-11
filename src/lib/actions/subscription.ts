'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { createOrRetrieveCustomer } from '@/utils/supabase/admin_vercel';
import { getURL } from '@/lib/utils/helpers';
import { getRedirectToErrorPage, getRedirectToSuccessPage } from '@/lib/utils/helpers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { Tables } from '@/types/types_db';

type Price = Tables<'prices'>;

interface CheckoutParams {
  price: Price;
  redirectPath?: string;
}

export async function checkoutWithStripe({ price, redirectPath = '/account' }: CheckoutParams) {
  try {
    // Get the user from Supabase auth
    const supabase = await createClient();
    const {
      error,
      data: { user }
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error(error);
      throw new Error('You must be signed in to checkout.');
    }

    // Retrieve or create the customer in Stripe
    const customer = await createOrRetrieveCustomer({
      uuid: user.id || '',
      email: user.email || ''
    });

    let params: any = {
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer,
      line_items: [
        {
          price: price.id,
          quantity: 1
        }
      ],
      cancel_url: getURL(),
      success_url: getURL('/account')
    };

    console.log(
      'Trial period days for price:',
      price,
      price.trial_period_days
    );

    if (price.type === 'recurring') {
      params = {
        ...params,
        mode: 'subscription',
        subscription_data: {
          trial_period_days: price.trial_period_days ?? undefined
        }
      };
    } else if (price.type === 'one_time') {
      params = {
        ...params,
        mode: 'payment'
      };
    }

    // Create a checkout session in Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.create(params);
    } catch (err) {
      console.error(err);
      throw new Error('Unable to create checkout session.');
    }

    // Instead of returning, redirect the user to the checkout page
    if (session) {
      redirect(session.url ?? '/');
    } else {
      throw new Error('Unable to create checkout session.');
    }
  } catch (error) {
    if (error instanceof Error) {
      return getRedirectToErrorPage(redirectPath, error.message);
    } else {
      return getRedirectToErrorPage(
        redirectPath,
        'An unknown error occurred.'
      );
    }
  }
}

export async function createStripePortal(currentPath: string) {
  try {
    const supabase = await createClient();
    const {
      error,
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      if (error) {
        console.error(error);
      }
      throw new Error('You must be signed in to access the customer portal.');
    }

    const customer = await createOrRetrieveCustomer({
      uuid: user.id || '',
      email: user.email || ''
    });

    if (!customer) {
      throw new Error('Could not get customer.');
    }

    try {
      const { url } = await stripe.billingPortal.sessions.create({
        customer,
        return_url: getURL('/account')
      });
      if (!url) {
        throw new Error('Could not create billing portal');
      }
      redirect(url);
    } catch (err) {
      console.error(err);
      throw new Error('Could not create billing portal');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return getRedirectToErrorPage(currentPath, error.message);
    } else {
      console.error(error);
      return getRedirectToErrorPage(
        currentPath,
        'An unknown error occurred.'
      );
    }
  }
}

export async function getSubscription() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: subscription } = await (await supabase)
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .eq('user_id', user.id)
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  return subscription;
}

export async function getUserDetails() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: userDetails } = await (await supabase)
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return userDetails;
}

export async function updateUserName(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in to update your name.');
  }

  const fullName = formData.get('fullName') as string;

  const { error } = await (await supabase)
    .from('users')
    .update({ full_name: fullName })
    .eq('id', user.id);

  if (error) {
    throw new Error('Failed to update name.');
  }

  revalidatePath('/account');
  return { message: 'Name updated successfully!' };
}

export async function updateUserEmail(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in to update your email.');
  }

  const newEmail = formData.get('email') as string;

  const { error } = await supabase.auth.updateUser({
    email: newEmail
  });

  if (error) {
    throw new Error('Failed to update email.');
  }

  revalidatePath('/account');
  return { message: 'Check your email to confirm the change!' };
}
