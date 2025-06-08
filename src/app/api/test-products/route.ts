import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase/client';

export async function GET() {
  try {
    console.log('API Route: Testing Supabase connection...');
    
    // Test simple query
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    console.log('API Route: Products query result:', products, error);

    return NextResponse.json({
      success: true,
      products,
      error,
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    });
  } catch (err) {
    console.error('API Route: Exception:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}
