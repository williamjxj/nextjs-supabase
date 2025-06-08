import { createClient } from '@/lib/supabase/server';
import { getSubscription } from '@/lib/actions/subscription';

export interface SubscriptionAccess {
  hasActiveSubscription: boolean;
  subscriptionType: string | null;
  downloadsRemaining?: number;
  imagesViewable?: number;
  canDownload: boolean;
  canViewGallery: boolean;
  accessLevel: 'free' | 'basic' | 'pro' | 'enterprise';
}

export async function checkSubscriptionAccess(): Promise<SubscriptionAccess> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      hasActiveSubscription: false,
      subscriptionType: null,
      canDownload: false,
      canViewGallery: false,
      accessLevel: 'free'
    };
  }

  const subscription = await getSubscription();

  if (!subscription || subscription.status !== 'active') {
    // Free tier access
    return {
      hasActiveSubscription: false,
      subscriptionType: null,
      imagesViewable: 10, // Free users can view 10 images
      downloadsRemaining: 0,
      canDownload: false,
      canViewGallery: true,
      accessLevel: 'free'
    };
  }

  // Determine access level based on subscription
  const productName = subscription.prices?.products?.name?.toLowerCase() || '';
  let accessLevel: SubscriptionAccess['accessLevel'] = 'basic';
  const imagesViewable = undefined; // Unlimited
  let downloadsRemaining = undefined; // Unlimited

  if (productName.includes('basic')) {
    accessLevel = 'basic';
    downloadsRemaining = 50; // Basic: 50 downloads per month
  } else if (productName.includes('pro')) {
    accessLevel = 'pro';
    downloadsRemaining = 200; // Pro: 200 downloads per month
  } else if (productName.includes('enterprise')) {
    accessLevel = 'enterprise';
    // Enterprise: unlimited
  }

  return {
    hasActiveSubscription: true,
    subscriptionType: productName,
    imagesViewable,
    downloadsRemaining,
    canDownload: true,
    canViewGallery: true,
    accessLevel
  };
}

export async function canAccessImage(imageId: string): Promise<boolean> {
  const access = await checkSubscriptionAccess();
  
  if (!access.canViewGallery) {
    return false;
  }

  // For free users, check if they've exceeded their view limit
  if (access.accessLevel === 'free' && access.imagesViewable !== undefined) {
    // This would require tracking image views in the database
    // For now, we'll allow all images to be viewed
    return true;
  }

  return true;
}

export async function canDownloadImage(imageId: string): Promise<boolean> {
  const access = await checkSubscriptionAccess();
  
  if (!access.canDownload) {
    return false;
  }

  // For limited plans, check download count
  if (access.downloadsRemaining !== undefined) {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      // Count downloads this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: downloads, error } = await supabase
        .from('image_downloads')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (error) {
        console.error('Error checking download count:', error);
        return false;
      }

      const downloadCount = downloads?.length || 0;
      return downloadCount < access.downloadsRemaining;
    }
  }

  return true;
}

export async function recordImageDownload(imageId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase
      .from('image_downloads')
      .insert({
        user_id: user.id,
        image_id: imageId,
        downloaded_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error recording image download:', error);
    }
  }
}
