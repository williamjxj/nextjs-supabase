'use client'

import { useState } from 'react'
import { getOAuthDebugInfo, testGoogleOAuth } from '@/utils/oauth-test'

export default function OAuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  
  const handleShowDebugInfo = () => {
    const info = getOAuthDebugInfo()
    setDebugInfo(info)
    console.log('OAuth Debug Info:', info)
  }
  
  const handleTestOAuth = async () => {
    const result = await testGoogleOAuth()
    setTestResult(result)
    console.log('OAuth Test Result:', result)
  }
  
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">OAuth Configuration Debugger</h3>
      
      <div className="space-y-4">
        <button
          onClick={handleShowDebugInfo}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Show Debug Info
        </button>
        
        <button
          onClick={handleTestOAuth}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Test Google OAuth
        </button>
      </div>
      
      {debugInfo && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border">
          <h4 className="font-medium mb-2">Configuration Info:</h4>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
      
      {testResult && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border">
          <h4 className="font-medium mb-2">Test Result:</h4>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Expected Redirect URI:</h4>
        <code className="text-sm bg-gray-100 dark:bg-gray-800 p-1 rounded">
          http://127.0.0.1:54321/auth/v1/callback
        </code>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
          Make sure this exact URI is added to your Google Cloud Console OAuth 2.0 Client ID configuration.
        </p>
      </div>
    </div>
  )
}
