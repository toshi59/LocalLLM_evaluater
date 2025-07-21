'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EvaluationResult, LLMModel, Question } from '@/types';

export default function ResultsPage() {
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvaluations();
    fetchModels();
    fetchQuestions();
  }, []);

  useEffect(() => {
    fetchFilteredEvaluations();
  }, [selectedModelId, selectedQuestionId]);

  const fetchEvaluations = async () => {
    try {
      const response = await fetch('/api/evaluations/detailed');
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data);
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilteredEvaluations = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedModelId) params.append('modelId', selectedModelId);
      if (selectedQuestionId) params.append('questionId', selectedQuestionId);
      
      const response = await fetch(`/api/evaluations/detailed?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data);
      }
    } catch (error) {
      console.error('Error fetching filtered evaluations:', error);
    }
  };

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

  const calculateAverageScores = () => {
    if (evaluations.length === 0) return null;

    const totals = evaluations.reduce(
      (acc, evaluation) => ({
        accuracy: acc.accuracy + evaluation.scores.accuracy,
        completeness: acc.completeness + evaluation.scores.completeness,
        logic: acc.logic + evaluation.scores.logic,
        japanese: acc.japanese + evaluation.scores.japanese,
        overall: acc.overall + evaluation.scores.overall,
      }),
      { accuracy: 0, completeness: 0, logic: 0, japanese: 0, overall: 0 }
    );

    const count = evaluations.length;
    return {
      accuracy: (totals.accuracy / count).toFixed(1),
      completeness: (totals.completeness / count).toFixed(1),
      logic: (totals.logic / count).toFixed(1),
      japanese: (totals.japanese / count).toFixed(1),
      overall: (totals.overall / count).toFixed(1),
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-100';
    if (score >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const averageScores = calculateAverageScores();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold">評価結果</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border mb-8">
          <h2 className="text-xl font-semibold mb-4">フィルタ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                モデルで絞り込み
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全てのモデル</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                質問で絞り込み
              </label>
              <select
                value={selectedQuestionId}
                onChange={(e) => setSelectedQuestionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全ての質問</option>
                {questions.map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {averageScores && (
          <div className="bg-white rounded-lg shadow-md p-6 border mb-8">
            <h2 className="text-xl font-semibold mb-4">平均スコア ({evaluations.length}件)</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: 'accuracy', label: '正確性', value: averageScores.accuracy },
                { key: 'completeness', label: '網羅性', value: averageScores.completeness },
                { key: 'logic', label: '論理構成', value: averageScores.logic },
                { key: 'japanese', label: '日本語', value: averageScores.japanese },
                { key: 'overall', label: '総合', value: averageScores.overall },
              ].map((item) => (
                <div key={item.key} className="text-center">
                  <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                  <div className={`text-2xl font-bold px-3 py-2 rounded-full ${getScoreColor(Number(item.value))}`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {evaluations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border">
            <p className="text-gray-500 mb-4">評価結果がありません</p>
            <Link
              href="/evaluation"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-block"
            >
              評価を実行する
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="bg-white rounded-lg shadow-md p-6 border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{evaluation.question.title}</h3>
                    <div className="text-sm text-gray-600">
                      モデル: <span className="font-medium">{evaluation.model.name}</span> | 
                      評価日: {new Date(evaluation.evaluatedAt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">質問:</h4>
                    <div className="bg-gray-50 p-3 rounded-md text-sm">
                      {evaluation.question.content.length > 200 
                        ? `${evaluation.question.content.substring(0, 200)}...` 
                        : evaluation.question.content}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">回答:</h4>
                    <div className="bg-blue-50 p-3 rounded-md text-sm">
                      {evaluation.response.length > 200 
                        ? `${evaluation.response.substring(0, 200)}...` 
                        : evaluation.response}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {[
                    { key: 'accuracy', label: '正確性', value: evaluation.scores.accuracy },
                    { key: 'completeness', label: '網羅性', value: evaluation.scores.completeness },
                    { key: 'logic', label: '論理構成', value: evaluation.scores.logic },
                    { key: 'japanese', label: '日本語', value: evaluation.scores.japanese },
                    { key: 'overall', label: '総合', value: evaluation.scores.overall },
                  ].map((item) => (
                    <div key={item.key} className="text-center">
                      <div className="text-xs text-gray-600 mb-1">{item.label}</div>
                      <div className={`text-lg font-semibold px-2 py-1 rounded ${getScoreColor(item.value)}`}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {evaluation.comment && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">コメント:</h4>
                    <div className="bg-yellow-50 p-3 rounded-md text-sm text-gray-700">
                      {evaluation.comment}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}