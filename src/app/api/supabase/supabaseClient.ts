import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 创建存储桶和数据库表的辅助函数
export async function initSupabase() {
  try {
    // 检查并创建 images 存储桶
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) throw bucketsError;
    
    const imagesBucketExists = buckets.some(bucket => bucket.name === 'images');
    
    if (!imagesBucketExists) {
      const { error: createBucketError } = await supabase
        .storage
        .createBucket('images', {
          public: true, // 允许公开访问
          fileSizeLimit: 5242880, // 5MB 限制
        });
      
      if (createBucketError) throw createBucketError;
    }
    
    // 检查并创建 images 数据库表
    const { error: tableError } = await supabase.rpc('create_images_table_if_not_exists');
    if (tableError) {
      // 如果 RPC 不存在，尝试直接创建表
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
      `);
      
      if (createTableError) throw createTableError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('初始化 Supabase 失败:', error);
    return { success: false, error };
  }
}
