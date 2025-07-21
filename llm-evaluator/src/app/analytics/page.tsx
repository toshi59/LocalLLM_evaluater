'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EvaluationResult, LLMModel, Question } from '@/types';

interface ModelStats {
  modelId: string;
  modelName: string;
  count: number;
  averageScores: {
    accuracy: number;
    completeness: number;
    logic: number;
    japanese: number;
    overall: number;
  };
}

interface QuestionStats {
  questionId: string;
  questionTitle: string;
  count: number;
  averageScores: {
    accuracy: number;
    completeness: number;
    logic: number;
    japanese: number;
    overall: number;
  };
}

export default function AnalyticsPage() {
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvaluations();
  }, []);

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

  const calculateModelStats = (): ModelStats[] => {
    const modelMap = new Map<string, {
      modelName: string;
      evaluations: EvaluationResult[];
    }>();

    evaluations.forEach(evaluation => {
      const key = evaluation.modelId;
      if (!modelMap.has(key)) {
        modelMap.set(key, {
          modelName: evaluation.model.name,
          evaluations: []
        });
      }
      modelMap.get(key)!.evaluations.push(evaluation);
    });

    return Array.from(modelMap.entries()).map(([modelId, data]) => {
      const { modelName, evaluations } = data;
      const count = evaluations.length;
      
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

      return {
        modelId,
        modelName,
        count,
        averageScores: {
          accuracy: totals.accuracy / count,
          completeness: totals.completeness / count,
          logic: totals.logic / count,
          japanese: totals.japanese / count,
          overall: totals.overall / count,
        }
      };
    }).sort((a, b) => b.averageScores.overall - a.averageScores.overall);
  };

  const calculateQuestionStats = (): QuestionStats[] => {
    const questionMap = new Map<string, {
      questionTitle: string;
      evaluations: EvaluationResult[];
    }>();

    evaluations.forEach(evaluation => {
      const key = evaluation.questionId;
      if (!questionMap.has(key)) {
        questionMap.set(key, {
          questionTitle: evaluation.question.title,
          evaluations: []
        });
      }
      questionMap.get(key)!.evaluations.push(evaluation);
    });

    return Array.from(questionMap.entries()).map(([questionId, data]) => {
      const { questionTitle, evaluations } = data;
      const count = evaluations.length;
      
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

      return {
        questionId,
        questionTitle,
        count,
        averageScores: {
          accuracy: totals.accuracy / count,
          completeness: totals.completeness / count,
          logic: totals.logic / count,
          japanese: totals.japanese / count,
          overall: totals.overall / count,
        }
      };
    }).sort((a, b) => a.averageScores.overall - b.averageScores.overall);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-100';
    if (score >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getBarWidth = (score: number, maxScore: number) => {
    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  const modelStats = calculateModelStats();
  const questionStats = calculateQuestionStats();
  const maxModelScore = Math.max(...modelStats.map(s => s.averageScores.overall), 5);
  const maxQuestionScore = Math.max(...questionStats.map(s => s.averageScores.overall), 5);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold">統計・分析</h1>
        </div>

        {evaluations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border">
            <p className="text-gray-500 mb-4">分析するデータがありません</p>
            <Link
              href="/evaluation"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-block"
            >
              評価を実行する
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold mb-4">概要</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{evaluations.length}</div>
                  <div className="text-sm text-gray-600">総評価数</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{modelStats.length}</div>
                  <div className="text-sm text-gray-600">評価済みモデル数</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{questionStats.length}</div>
                  <div className="text-sm text-gray-600">評価済み質問数</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {modelStats.length > 0 ? modelStats[0].averageScores.overall.toFixed(1) : '0.0'}
                  </div>
                  <div className="text-sm text-gray-600">最高平均スコア</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold mb-4">モデル別パフォーマンス</h2>
              {modelStats.length === 0 ? (
                <p className="text-gray-500">データがありません</p>
              ) : (
                <div className="space-y-4">
                  {modelStats.map((stat) => (
                    <div key={stat.modelId} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{stat.modelName}</h3>
                        <div className="text-sm text-gray-600">評価数: {stat.count}</div>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-4">
                        {[
                          { key: 'accuracy', label: '正確性', value: stat.averageScores.accuracy },
                          { key: 'completeness', label: '網羅性', value: stat.averageScores.completeness },
                          { key: 'logic', label: '論理構成', value: stat.averageScores.logic },
                          { key: 'japanese', label: '日本語', value: stat.averageScores.japanese },
                          { key: 'overall', label: '総合', value: stat.averageScores.overall },
                        ].map((item) => (
                          <div key={item.key}>
                            <div className="text-xs text-gray-600 mb-1">{item.label}</div>
                            <div className="flex items-center">
                              <div className="w-12 text-sm font-medium">
                                {item.value.toFixed(1)}
                              </div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${getBarWidth(item.value, maxModelScore)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h2 className="text-xl font-semibold mb-4">質問別難易度分析</h2>
              <p className="text-sm text-gray-600 mb-4">
                平均スコアが低い質問ほど難しい質問と考えられます
              </p>
              {questionStats.length === 0 ? (
                <p className="text-gray-500">データがありません</p>
              ) : (
                <div className="space-y-4">
                  {questionStats.slice(0, 10).map((stat) => (
                    <div key={stat.questionId} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium truncate flex-1 mr-4">{stat.questionTitle}</h3>
                        <div className="text-sm text-gray-600">評価数: {stat.count}</div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-16 text-sm font-medium">
                          平均: {stat.averageScores.overall.toFixed(1)}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 ml-2">
                          <div
                            className={`h-3 rounded-full ${
                              stat.averageScores.overall >= 4 
                                ? 'bg-green-500' 
                                : stat.averageScores.overall >= 3 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${getBarWidth(stat.averageScores.overall, maxQuestionScore)}%` }}
                          ></div>
                        </div>
                        <div className="w-20 text-xs text-gray-600 ml-2">
                          {stat.averageScores.overall >= 4 
                            ? '簡単' 
                            : stat.averageScores.overall >= 3 
                            ? '普通' 
                            : '難しい'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {questionStats.length > 10 && (
                    <p className="text-sm text-gray-500 text-center">
                      ...他 {questionStats.length - 10} 件
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}