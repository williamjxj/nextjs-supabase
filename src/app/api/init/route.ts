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

    // 检查数据库表是否存在
    const { data, error } = await supabase.from('images').select('id').limit(1)

    if (error && error.code === '42P01') {
      // 表不存在的错误代码
      // 创建 images 表
      const { error: createTableError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS images (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          file_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          file_type TEXT NOT NULL,
          url TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      if (createTableError) {
        return NextResponse.json(
          { error: createTableError.message },
          { status: 500 }
        )
      }
    } else if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Supabase 初始化成功' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
