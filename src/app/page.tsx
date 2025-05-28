import ImageUploader from '@/components/ImageUploader';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">图片上传与管理</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <ImageUploader />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">使用说明</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-2 flex-shrink-0">1</span>
                <span>在左侧选择一张图片文件 (JPG, PNG, GIF, WebP)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-2 flex-shrink-0">2</span>
                <span>点击"上传图片"按钮</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-2 flex-shrink-0">3</span>
                <span>上传成功后，图片缩略图将显示在下方</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-2 flex-shrink-0">4</span>
                <span>前往<a href="/gallery" className="text-blue-600 hover:underline">图库页面</a>查看所有上传的图片</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
