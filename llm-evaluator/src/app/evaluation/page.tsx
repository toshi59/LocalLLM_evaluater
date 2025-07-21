'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LLMModel, Question, EvaluationScores, EvaluationComments, EvaluationPrompt } from '@/types';

export default function EvaluationPage() {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [scores, setScores] = useState<EvaluationScores>({
    accuracy: 3,
    completeness: 3,
    logic: 3,
    japanese: 3,
    overall: 3,
  });
  const [comments, setComments] = useState<EvaluationComments>({
    accuracy: '',
    completeness: '',
    logic: '',
    japanese: '',
    overall: ''
  });
  const [prompts, setPrompts] = useState<EvaluationPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [isAutoEvaluating, setIsAutoEvaluating] = useState(false);
  const [evaluationCompleted, setEvaluationCompleted] = useState(false);

  useEffect(() => {
    fetchModels();
    fetchQuestions();
    fetchPrompts();
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

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/evaluator/prompts');
      if (response.ok) {
        const data = await response.json();
        setPrompts(data);
        if (data.length > 0) {
          setSelectedPromptId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const handleProceedToEvaluation = () => {
    if (!selectedModelId || !selectedQuestionId) {
      alert('モデルと質問を選択してください');
      return;
    }
    setShowEvaluation(true);
  };

  const handleEvaluateResponse = async () => {
    if (!response.trim()) {
      alert('回答内容を入力してください');
      return;
    }

    const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
    if (!selectedQuestion) {
      alert('質問が選択されていません');
      return;
    }

    // 自動評価を実行
    await handleAutoEvaluate(response);
  };

  const handleAutoEvaluate = async (llmResponse: string) => {
    const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
    if (!selectedQuestion || !selectedPromptId) return;

    setIsAutoEvaluating(true);
    try {
      const response = await fetch('/api/evaluator/auto-evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionContent: selectedQuestion.content,
          llmResponse: llmResponse,
          promptId: selectedPromptId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setScores(data.scores);
        setComments(data.comments || {
          accuracy: '',
          completeness: '',
          logic: '',
          japanese: '',
          overall: ''
        });
        setEvaluationCompleted(true);
      } else {
        const errorText = await response.text();
        console.error('Auto-evaluation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        alert(`自動評価でエラーが発生しました: ${response.status} ${response.statusText}\n${errorText}`);
      }
    } catch (error) {
      console.error('Error in auto-evaluation:', error);
      alert(`自動評価でエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAutoEvaluating(false);
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
          comments,
        }),
      });

      if (evaluationResponse.ok) {
        alert('評価を保存しました');
        setResponse('');
        setComments({
          accuracy: '',
          completeness: '',
          logic: '',
          japanese: '',
          overall: ''
        });
        setScores({
          accuracy: 3,
          completeness: 3,
          logic: 3,
          japanese: 3,
          overall: 3,
        });
        setEvaluationCompleted(false);
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

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 bg-green-100';
    if (score >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  評価プロンプト
                </label>
                {prompts.length === 0 ? (
                  <div className="text-gray-500 text-sm">
                    評価プロンプトが登録されていません。
                  </div>
                ) : (
                  <select
                    value={selectedPromptId}
                    onChange={(e) => setSelectedPromptId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {prompts.map((prompt) => (
                      <option key={prompt.id} value={prompt.id}>
                        {prompt.name}
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
                onClick={handleProceedToEvaluation}
                disabled={!selectedModelId || !selectedQuestionId}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                評価画面に進む
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold mb-4">回答入力・評価</h2>
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
                    {selectedModel?.name}の回答を入力:
                  </h3>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                    placeholder="LLMの回答をここにペーストしてください..."
                  />
                  <div className="mt-4">
                    <button
                      onClick={handleEvaluateResponse}
                      disabled={isAutoEvaluating || !response.trim()}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isAutoEvaluating ? 'GPT-4oで評価中...' : '評価実行'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {evaluationCompleted && (
              <div className="bg-white rounded-lg shadow-md p-6 border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">評価結果</h2>
                  {isAutoEvaluating && (
                    <div className="flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      GPT-4oで自動評価中...
                    </div>
                  )}
                </div>
                
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { key: 'accuracy', label: '正確性', color: 'blue' },
                  { key: 'completeness', label: '網羅性', color: 'green' },
                  { key: 'logic', label: '論理構成', color: 'purple' },
                  { key: 'japanese', label: '日本語', color: 'orange' },
                ].map((item) => (
                  <div key={item.key} className="text-center">
                    <div className="text-lg font-semibold mb-2">{item.label}</div>
                    <div className={`text-3xl font-bold mb-2 px-4 py-2 rounded-lg ${getScoreColor(scores[item.key as keyof EvaluationScores])}`}>
                      {scores[item.key as keyof EvaluationScores]}
                    </div>
                    <div className="text-sm text-gray-600">
                      {comments[item.key as keyof EvaluationComments] || 'コメントなし'}
                    </div>
                  </div>
                ))}
              </div>

              {/* 総合評価 */}
              <div className="mt-8 text-center bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-semibold mb-2">総合評価</div>
                <div className={`text-4xl font-bold mb-2 px-6 py-3 rounded-lg inline-block ${getScoreColor(scores.overall)}`}>
                  {scores.overall}
                </div>
                <div className="text-sm text-gray-600">
                  {comments.overall || '他項目の平均値で自動計算'}
                </div>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}