'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/api/supabase/supabaseClient';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        const response = await fetch('/api/init');
        const data = await response.json();
        
        if (!data.success) {
          setError(data.error || '初始化 Supabase 失败');
        }
      } catch (err: any) {
        setError(err.message || '初始化 Supabase 时出错');
      } finally {
        setInitializing(false);
      }
    };

    initializeSupabase();
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">正在初始化应用...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">初始化失败</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-gray-600 text-sm">
            请确保您已正确配置 Supabase 环境变量，并且 Supabase 项目已创建。
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
