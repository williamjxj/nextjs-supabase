import { createClient } from '@supabase/supabase-js'

// 创建 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 创建存储桶和数据库表的辅助函数
export async function initSupabase() {
  try {
    // 检查并创建 images 存储桶
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets()

    if (bucketsError) throw bucketsError

    const imagesBucketExists = buckets.some(bucket => bucket.name === 'images')

    if (!imagesBucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket(
        'images',
        {
          public: true, // 允许公开访问
          fileSizeLimit: 5242880, // 5MB 限制
        }
      )

      if (createBucketError) throw createBucketError
    }

    // Check if images table exists (migrations should handle table creation)
    const { data: testData, error: tableError } = await supabase
      .from('images')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === '42P01') {
      throw new Error(
        'Images table does not exist. Please run database migrations: supabase db push'
      )
    }

    return { success: true }
  } catch (error) {
    console.error('初始化 Supabase 失败:', error)
    return { success: false, error }
  }
}
