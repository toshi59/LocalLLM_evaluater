'use client';

import { useState } from 'react';

export default function Home() {
  const [expandedInstructions, setExpandedInstructions] = useState(false);
  const [expandedEvaluationCriteria, setExpandedEvaluationCriteria] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">LLM評価システム</h1>
          <p className="text-xl text-gray-600 mb-8">
            ローカルLLMを体系的に評価・比較するための包括的なWebアプリケーション
          </p>
        </div>

        {/* 主な機能 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">主な機能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <span className="text-blue-600 text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">LLMモデル管理</h3>
                  <p className="text-gray-600 text-sm">ローカルLLMモデルの登録・管理</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-2">
                  <span className="text-green-600 text-lg">❓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">質問バンク</h3>
                  <p className="text-gray-600 text-sm">評価用質問の作成・整理</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-full p-2">
                  <span className="text-purple-600 text-lg">📝</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">自動評価</h3>
                  <p className="text-gray-600 text-sm">GPT-4oによる5項目の自動評価</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-orange-100 rounded-full p-2">
                  <span className="text-orange-600 text-lg">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">結果分析</h3>
                  <p className="text-gray-600 text-sm">フィルタリング機能付きの詳細結果表示</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-red-100 rounded-full p-2">
                  <span className="text-red-600 text-lg">📈</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">統計ダッシュボード</h3>
                  <p className="text-gray-600 text-sm">パフォーマンス比較と統計情報</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-gray-100 rounded-full p-2">
                  <span className="text-gray-600 text-lg">⚙️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">カスタム設定</h3>
                  <p className="text-gray-600 text-sm">評価LLM・プロンプトの編集可能</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 使用手順 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">使用手順</h2>
            <button
              onClick={() => setExpandedInstructions(!expandedInstructions)}
              className="text-gray-600 hover:text-gray-800 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:border-gray-400"
              title={expandedInstructions ? "折りたたむ" : "展開"}
            >
              {expandedInstructions ? '−' : '+'}
            </button>
          </div>
          {expandedInstructions && (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">設定を行う</h3>
                  <p className="text-gray-600 text-sm mb-2">設定ページでOpenAI APIキーを設定し、評価プロンプトをカスタマイズします。</p>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">設定ページ</span>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">モデルと質問を登録</h3>
                  <p className="text-gray-600 text-sm mb-2">評価したいLLMモデルと質問を登録します。</p>
                  <div className="space-x-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">LLMモデル管理</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">質問管理</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">評価を実行</h3>
                  <p className="text-gray-600 text-sm mb-2">モデルと質問を選択し、LLMの回答をペーストしてGPT-4oで自動評価します。</p>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">評価実行</span>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">結果を分析</h3>
                  <p className="text-gray-600 text-sm mb-2">評価結果を確認し、CSVエクスポートや統計分析でモデルのパフォーマンスを比較します。</p>
                  <div className="space-x-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">評価結果</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">統計・分析</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 評価項目 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">評価項目の詳細</h2>
            <button
              onClick={() => setExpandedEvaluationCriteria(!expandedEvaluationCriteria)}
              className="text-gray-600 hover:text-gray-800 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:border-gray-400"
              title={expandedEvaluationCriteria ? "折りたたむ" : "展開"}
            >
              {expandedEvaluationCriteria ? '−' : '+'}
            </button>
          </div>
          {expandedEvaluationCriteria && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-800 mb-2">🎯 正確性 (Accuracy)</h3>
                    <p className="text-gray-600 text-sm">事実の正確さ、情報の信頼性を評価します。誤った情報や根拠の薄弱な内容が含まれていないかをチェックします。</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-gray-800 mb-2">📋 網羅性 (Completeness)</h3>
                    <p className="text-gray-600 text-sm">質問に対する回答の完全性、必要な情報の網羅度を評価します。重要なポイントが漏れていないかを確認します。</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-gray-800 mb-2">🔗 論理構成 (Logic)</h3>
                    <p className="text-gray-600 text-sm">論理的な構造と議論の流れを評価します。情報が体系的に整理され、理解しやすい構成になっているかをチェックします。</p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-semibold text-gray-800 mb-2">🇯🇵 日本語 (Japanese)</h3>
                    <p className="text-gray-600 text-sm">日本語の自然さ、文法、表現の適切さを評価します。誤字脱字や不自然な表現がないか、読みやすい日本語になっているかをチェックします。</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 rounded-full p-2">
                    <span className="text-red-600 text-lg">🏆</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">総合評価 (Overall)</h3>
                    <p className="text-gray-600 text-sm">上記4項目の平均値で自動計算されます。全体的な品質と有用性を表します。</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <h3 className="font-semibold text-gray-800 mb-4">評価スケール</h3>
                <div className="flex justify-center space-x-8 text-sm">
                  <div className="text-center">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold mb-1">5</div>
                    <div className="text-gray-600">優秀</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold mb-1">4</div>
                    <div className="text-gray-600">良好</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold mb-1">3</div>
                    <div className="text-gray-600">平均的</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold mb-1">2</div>
                    <div className="text-gray-600">平均以下</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold mb-1">1</div>
                    <div className="text-gray-600">不良</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
