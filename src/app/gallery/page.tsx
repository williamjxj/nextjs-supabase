'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/api/supabase/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';

interface ImageItem {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  url: string;
  created_at: string;
}

export default function Gallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // 加载图片列表
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setImages(data || []);
    } catch (err: any) {
      setError(`获取图片失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 删除图片
  const deleteImage = async (id: string, filePath: string) => {
    try {
      setDeleting(id);
      setError(null);

      // 从存储中删除文件
      const { error: storageError } = await supabase
        .storage
        .from('images')
        .remove([filePath]);

      if (storageError) {
        throw storageError;
      }

      // 从数据库中删除记录
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', id);

      if (dbError) {
        throw dbError;
      }

      // 更新状态
      setImages(images.filter(img => img.id !== id));
    } catch (err: any) {
      setError(`删除失败: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">图片库</h1>
        <Link 
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          上传新图片
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">暂无上传的图片</p>
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            上传第一张图片
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-48 w-full">
                <Image
                  src={image.url}
                  alt={image.file_name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-gray-800 mb-1 truncate" title={image.file_name}>
                  {image.file_name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {formatFileSize(image.file_size)} • {new Date(image.created_at).toLocaleDateString()}
                </p>
                
                <div className="flex space-x-2">
                  <a
                    href={image.url}
                    download={image.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md text-center transition-colors"
                  >
                    下载
                  </a>
                  
                  <button
                    onClick={() => deleteImage(image.id, image.file_path)}
                    disabled={deleting === image.id}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md text-center transition-colors
                      ${deleting === image.id 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                      }`}
                  >
                    {deleting === image.id ? '删除中...' : '删除'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
