'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LLMModel, Question, EvaluationScores } from '@/types';

export default function EvaluationPage() {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [scores, setScores] = useState<EvaluationScores>({
    accuracy: 3,
    completeness: 3,
    logic: 3,
    japanese: 3,
    overall: 3,
  });
  const [comment, setComment] = useState<string>('');
  const [showEvaluation, setShowEvaluation] = useState(false);

  useEffect(() => {
    fetchModels();
    fetchQuestions();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/questions');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleGetResponse = async () => {
    if (!selectedModelId || !selectedQuestionId) {
      alert('モデルと質問を選択してください');
      return;
    }

    const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
    if (!selectedQuestion) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: selectedModelId,
          message: selectedQuestion.content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResponse(data.response);
        setShowEvaluation(true);
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Error getting LLM response:', error);
      alert('LLMとの通信でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!response) {
      alert('評価するレスポンスがありません');
      return;
    }

    try {
      const evaluationResponse = await fetch('/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: selectedQuestionId,
          modelId: selectedModelId,
          response,
          scores,
          comment,
        }),
      });

      if (evaluationResponse.ok) {
        alert('評価を保存しました');
        setResponse('');
        setComment('');
        setScores({
          accuracy: 3,
          completeness: 3,
          logic: 3,
          japanese: 3,
          overall: 3,
        });
        setShowEvaluation(false);
      } else {
        const error = await evaluationResponse.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('評価の保存でエラーが発生しました');
    }
  };

  const handleScoreChange = (key: keyof EvaluationScores, value: number) => {
    setScores({ ...scores, [key]: value });
  };

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
  const selectedModel = models.find(m => m.id === selectedModelId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold">評価実行</h1>
        </div>

        {!showEvaluation ? (
          <div className="bg-white rounded-lg shadow-md p-6 border">
            <h2 className="text-xl font-semibold mb-6">評価設定</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LLMモデルを選択
                </label>
                {models.length === 0 ? (
                  <div className="text-gray-500 text-sm">
                    モデルが登録されていません。
                    <Link href="/models" className="text-blue-600 hover:underline ml-1">
                      モデル管理ページ
                    </Link>
                    で追加してください。
                  </div>
                ) : (
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">モデルを選択</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  質問を選択
                </label>
                {questions.length === 0 ? (
                  <div className="text-gray-500 text-sm">
                    質問が登録されていません。
                    <Link href="/questions" className="text-blue-600 hover:underline ml-1">
                      質問管理ページ
                    </Link>
                    で追加してください。
                  </div>
                ) : (
                  <select
                    value={selectedQuestionId}
                    onChange={(e) => setSelectedQuestionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">質問を選択</option>
                    {questions.map((question) => (
                      <option key={question.id} value={question.id}>
                        {question.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {selectedQuestion && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">選択された質問:</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">{selectedQuestion.title}</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedQuestion.content}</p>
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleGetResponse}
                disabled={!selectedModelId || !selectedQuestionId || isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'LLMに問い合わせ中...' : 'LLMの回答を取得'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold mb-4">LLMの回答</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">質問:</h3>
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <h4 className="font-medium mb-2">{selectedQuestion?.title}</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedQuestion?.content}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    回答 ({selectedModel?.name}):
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold mb-6">評価</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                  { key: 'accuracy', label: '正確性', color: 'blue' },
                  { key: 'completeness', label: '網羅性', color: 'green' },
                  { key: 'logic', label: '論理構成', color: 'purple' },
                  { key: 'japanese', label: '日本語', color: 'orange' },
                  { key: 'overall', label: '総合', color: 'red' },
                ].map((item) => (
                  <div key={item.key} className="text-center">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {item.label}
                    </label>
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <label key={value} className="flex items-center">
                          <input
                            type="radio"
                            name={item.key}
                            value={value}
                            checked={scores[item.key as keyof EvaluationScores] === value}
                            onChange={() => handleScoreChange(item.key as keyof EvaluationScores, value)}
                            className="mr-2"
                          />
                          <span className="text-sm">{value}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  コメント（オプション）
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="評価の理由や詳細なフィードバックを記入してください"
                />
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleSubmitEvaluation}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  評価を保存
                </button>
                <button
                  onClick={() => setShowEvaluation(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  戻る
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}