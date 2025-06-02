import { NextResponse } from 'next/server'
import { supabase } from '@/app/api/supabase/supabaseClient'

// 初始化 Supabase 存储桶和数据库表
export async function GET() {
  try {
    // 检查并创建 images 存储桶
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({ error: bucketsError.message }, { status: 500 })
    }

    const imagesBucketExists = buckets.some(bucket => bucket.name === 'images')

    if (!imagesBucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket(
        'images',
        {
          public: true, // 允许公开访问
          fileSizeLimit: 5242880, // 5MB 限制
        }
      )

      if (createBucketError) {
        return NextResponse.json(
          { error: createBucketError.message },
          { status: 500 }
        )
      }
    }

    // Check if database table exists (migrations should handle table creation)
    const { data, error } = await supabase.from('images').select('id').limit(1)

    // Note: Table creation should be handled by migrations, not programmatically
    if (error && error.code === '42P01') {
      return NextResponse.json(
        {
          error:
            'Images table does not exist. Please run database migrations: supabase db push',
          code: 'TABLE_NOT_FOUND',
        },
        { status: 500 }
      )
    } else if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Supabase 初始化成功' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
