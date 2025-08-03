'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LLMModel, Question, EvaluationScores, EvaluationComments, EvaluationPrompt, EvaluationEnvironment, Evaluator } from '@/types';

export default function EvaluationPage() {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [environments, setEnvironments] = useState<EvaluationEnvironment[]>([]);
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [processingTime, setProcessingTime] = useState<number | undefined>(undefined);
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
    fetchEnvironments();
    fetchEvaluators();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(Array.isArray(data) ? data : []);
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
        setQuestions(Array.isArray(data) ? data : []);
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
        setPrompts(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedPromptId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const fetchEnvironments = async () => {
    try {
      const response = await fetch('/api/evaluation-environments');
      if (response.ok) {
        const data = await response.json();
        const environmentsData = Array.isArray(data) ? data : [];
        setEnvironments(environmentsData);
        // デフォルトで最初の環境を選択
        if (environmentsData.length > 0 && !selectedEnvironmentId) {
          setSelectedEnvironmentId(environmentsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
    }
  };

  const fetchEvaluators = async () => {
    try {
      const response = await fetch('/api/evaluators');
      if (response.ok) {
        const data = await response.json();
        const evaluatorsData = Array.isArray(data) ? data : [];
        setEvaluators(evaluatorsData);
        // デフォルトで最初の評価者を選択
        if (evaluatorsData.length > 0 && !selectedEvaluatorId) {
          setSelectedEvaluatorId(evaluatorsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching evaluators:', error);
    }
  };

  const handleProceedToEvaluation = () => {
    if (!selectedModelId || !selectedQuestionId || !selectedEnvironmentId) {
      alert('モデル、質問、評価環境を選択してください');
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
          environmentId: selectedEnvironmentId,
          evaluator: evaluators.find(e => e.id === selectedEvaluatorId)?.name || '',
          processingTime,
        }),
      });

      if (evaluationResponse.ok) {
        alert('評価を保存しました');
        setResponse('');
        setSelectedEvaluatorId('');
        setProcessingTime(undefined);
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
                {!Array.isArray(models) || models.length === 0 ? (
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
                {!Array.isArray(questions) || questions.length === 0 ? (
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
                  評価環境を選択
                </label>
                {!Array.isArray(environments) || environments.length === 0 ? (
                  <div className="text-gray-500 text-sm">
                    評価環境が登録されていません。
                    <Link href="/environments" className="text-blue-600 hover:underline ml-1">
                      評価環境管理ページ
                    </Link>
                    で追加してください。
                  </div>
                ) : (
                  <select
                    value={selectedEnvironmentId}
                    onChange={(e) => setSelectedEnvironmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">評価環境を選択</option>
                    {environments.map((environment) => (
                      <option key={environment.id} value={environment.id}>
                        {environment.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  評価者
                </label>
                {!Array.isArray(evaluators) || evaluators.length === 0 ? (
                  <div className="text-gray-500 text-sm">
                    評価者が登録されていません。
                    <Link href="/evaluators" className="text-blue-600 hover:underline ml-1">
                      評価者管理ページ
                    </Link>
                    で追加してください。
                  </div>
                ) : (
                  <select
                    value={selectedEvaluatorId}
                    onChange={(e) => setSelectedEvaluatorId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">評価者を選択</option>
                    {evaluators.map((evaluator) => (
                      <option key={evaluator.id} value={evaluator.id}>
                        {evaluator.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  評価プロンプト
                </label>
                {!Array.isArray(prompts) || prompts.length === 0 ? (
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

            {selectedEnvironmentId && environments.find(env => env.id === selectedEnvironmentId) && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">選択された評価環境:</h3>
                <div className="bg-blue-50 p-4 rounded-md">
                  {(() => {
                    const selectedEnv = environments.find(env => env.id === selectedEnvironmentId);
                    return selectedEnv ? (
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-800">{selectedEnv.name}</h4>
                        <div className="text-sm text-blue-700">
                          <div><span className="font-medium">処理スペック:</span> {selectedEnv.processingSpec}</div>
                          <div><span className="font-medium">実行アプリ:</span> {selectedEnv.executionApp}</div>
                          {selectedEnv.description && (
                            <div><span className="font-medium">説明:</span> {selectedEnv.description}</div>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleProceedToEvaluation}
                disabled={!selectedModelId || !selectedQuestionId || !selectedEnvironmentId}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      処理時間（秒）
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={processingTime || ''}
                      onChange={(e) => setProcessingTime(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 5.2"
                    />
                  </div>
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