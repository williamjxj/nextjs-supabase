import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    // Use direct client with anon key to execute SQL
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔧 Attempting to fix webhook RLS policies...')

    // Try to execute SQL directly
    const sql = `
      -- Add permissive policies for webhook operations
      DROP POLICY IF EXISTS "Allow webhook operations for subscriptions" ON public.subscriptions;
      CREATE POLICY "Allow webhook operations for subscriptions"
        ON public.subscriptions FOR ALL
        USING (true);

      DROP POLICY IF EXISTS "Allow webhook operations for purchases" ON public.purchases;
      CREATE POLICY "Allow webhook operations for purchases"
        ON public.purchases FOR ALL
        USING (true);
    `

    // Try using the SQL editor approach
    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error('RPC exec_sql failed:', error)

      // Alternative: Try to create a test subscription to see current permissions
      const testResult = await supabase
        .from('subscriptions')
        .select('count')
        .limit(1)

      return NextResponse.json({
        success: false,
        error: 'Cannot execute SQL with current permissions',
        details: error,
        testQuery: testResult.error ? 'Failed' : 'Success',
        message:
          'You need to manually apply the RLS policy or get the correct service role key',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook RLS policies created successfully',
      data,
    })
  } catch (error) {
    console.error('Error in fix-webhook-rls:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
