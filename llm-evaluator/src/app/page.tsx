import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">LLM評価システム</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            href="/models" 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border"
          >
            <h2 className="text-xl font-semibold mb-2">LLMモデル管理</h2>
            <p className="text-gray-600">ローカルLLMモデルの追加・設定・管理</p>
          </Link>

          <Link 
            href="/questions" 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border"
          >
            <h2 className="text-xl font-semibold mb-2">質問管理</h2>
            <p className="text-gray-600">評価用質問の作成・編集・管理</p>
          </Link>

          <Link 
            href="/evaluation" 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border"
          >
            <h2 className="text-xl font-semibold mb-2">評価実行</h2>
            <p className="text-gray-600">LLMの回答を評価・採点</p>
          </Link>

          <Link 
            href="/results" 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border"
          >
            <h2 className="text-xl font-semibold mb-2">評価結果</h2>
            <p className="text-gray-600">評価結果の表示・比較・分析</p>
          </Link>

          <Link 
            href="/analytics" 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border"
          >
            <h2 className="text-xl font-semibold mb-2">統計・分析</h2>
            <p className="text-gray-600">パフォーマンス統計とトレンド分析</p>
          </Link>
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">評価項目</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-semibold">正</span>
              </div>
              <p className="text-sm">正確性</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-semibold">網</span>
              </div>
              <p className="text-sm">網羅性</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-semibold">論</span>
              </div>
              <p className="text-sm">論理構成</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-orange-600 font-semibold">日</span>
              </div>
              <p className="text-sm">日本語</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-red-600 font-semibold">総</span>
              </div>
              <p className="text-sm">総合</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
