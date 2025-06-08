'use client';

import { useEffect } from 'react';

export default function TestPage() {
  useEffect(() => {
    console.log('Test page loaded successfully!');
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-white text-2xl">Test Page</h1>
        <p className="text-gray-300 mt-2">Check the browser console for debug output.</p>
      </div>
    </div>
  );
}
