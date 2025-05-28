'use client';

import { useState } from 'react';
import { supabase } from '@/app/api/supabase/supabaseClient';
import Image from 'next/image';

export default function ImageUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // 验证文件类型
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('请选择有效的图片文件 (JPG, PNG, GIF, WebP)');
        setFile(null);
        return;
      }
      
      // 验证文件大小 (5MB 限制)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('文件大小不能超过 5MB');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  // 上传图片到 Supabase
  const uploadImage = async () => {
    if (!file) {
      setError('请先选择一个文件');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // 创建唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // 上传到 Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 获取公共 URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // 保存到数据库
      const { error: dbError } = await supabase
        .from('images')
        .insert([
          {
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            url: publicUrl,
          },
        ]);

      if (dbError) {
        throw dbError;
      }

      // 设置上传成功的图片 URL
      setUploadedImage(publicUrl);
      
      // 重置文件选择，允许用户上传另一张图片
      setFile(null);
      
      // 清空文件输入框，允许重新选择同一文件
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err: any) {
      setError(`上传失败: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">上传图片</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择图片
        </label>
        <input
          id="file-input"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          disabled={uploading}
        />
        <p className="mt-1 text-xs text-gray-500">支持 JPG, PNG, GIF, WebP 格式，最大 5MB</p>
      </div>

      {file && (
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">已选择: {file.name}</p>
          <p className="text-xs text-gray-500">
            大小: {(file.size / 1024).toFixed(2)} KB | 类型: {file.type}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <button
        onClick={uploadImage}
        disabled={!file || uploading}
        className={`w-full py-2 px-4 rounded-md text-white font-medium 
          ${!file || uploading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors`}
      >
        {uploading ? '上传中...' : '上传图片'}
      </button>

      {uploadedImage && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-800 mb-3">上传成功!</h3>
          <div className="relative h-48 w-full rounded-md overflow-hidden border border-gray-200">
            <Image
              src={uploadedImage}
              alt="Uploaded image"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div className="mt-4 text-center">
            <a 
              href="/gallery" 
              className="text-blue-600 hover:underline"
            >
              查看所有图片
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
