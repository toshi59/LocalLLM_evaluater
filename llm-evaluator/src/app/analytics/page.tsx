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
    if (score >= 4.5) return 'text-green-600 bg-green-100';
    if (score >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getBarWidth = (score: number, maxScore: number) => {
    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  };

  // スコア分布を計算
  const calculateScoreDistribution = () => {
    const distribution = {
      '5点': 0,
      '4点': 0,
      '3点': 0,
      '2点': 0,
      '1点': 0
    };
    
    evaluations.forEach(evaluation => {
      const overall = Math.round(evaluation.scores.overall);
      distribution[`${overall}点` as keyof typeof distribution]++;
    });
    
    return distribution;
  };

  // 時系列データを計算
  const calculateTimeSeriesData = () => {
    const sortedEvaluations = [...evaluations].sort((a, b) => 
      new Date(a.evaluatedAt).getTime() - new Date(b.evaluatedAt).getTime()
    );
    
    const monthlyData: { [key: string]: number[] } = {};
    
    sortedEvaluations.forEach(evaluation => {
      const date = new Date(evaluation.evaluatedAt);
      const monthKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(evaluation.scores.overall);
    });
    
    return Object.entries(monthlyData).map(([month, scores]) => ({
      month,
      average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      count: scores.length
    }));
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
            {/* 概要統計 */}
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="text-2xl mr-2">📊</span>
                概要統計
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center shadow-sm">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{evaluations.length}</div>
                  <div className="text-sm font-medium text-blue-700">総評価数</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center shadow-sm">
                  <div className="text-3xl font-bold text-green-600 mb-2">{modelStats.length}</div>
                  <div className="text-sm font-medium text-green-700">評価済みモデル</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center shadow-sm">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{questionStats.length}</div>
                  <div className="text-sm font-medium text-purple-700">評価済み質問</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl text-center shadow-sm">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {modelStats.length > 0 ? modelStats[0].averageScores.overall.toFixed(1) : '0.0'}
                  </div>
                  <div className="text-sm font-medium text-orange-700">最高平均スコア</div>
                </div>
              </div>
            </div>

            {/* スコア分布グラフ */}
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="text-2xl mr-2">📊</span>
                スコア分布
              </h2>
              {(() => {
                const distribution = calculateScoreDistribution();
                const maxCount = Math.max(...Object.values(distribution));
                return (
                  <div className="space-y-4">
                    {Object.entries(distribution).reverse().map(([score, count]) => {
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      const scoreNum = parseInt(score);
                      let barColor = 'bg-red-500';
                      if (scoreNum >= 5) barColor = 'bg-green-500';
                      else if (scoreNum >= 4) barColor = 'bg-yellow-500';
                      else if (scoreNum >= 3) barColor = 'bg-orange-500';
                      
                      return (
                        <div key={score} className="flex items-center">
                          <div className="w-16 text-sm font-medium text-gray-700">{score}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-8 mx-4 relative">
                            <div
                              className={`${barColor} h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-medium`}
                              style={{ width: `${Math.max(percentage, 5)}%` }}
                            >
                              {count > 0 && count}
                            </div>
                          </div>
                          <div className="w-20 text-sm text-gray-600">
                            {((count / evaluations.length) * 100).toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* 時系列データ */}
            {(() => {
              const timeSeriesData = calculateTimeSeriesData();
              if (timeSeriesData.length <= 1) return null;
              
              const maxAverage = Math.max(...timeSeriesData.map(d => d.average));
              const minAverage = Math.min(...timeSeriesData.map(d => d.average));
              
              return (
                <div className="bg-white rounded-lg shadow-md p-6 border">
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <span className="text-2xl mr-2">📈</span>
                    月別パフォーマンス推移
                  </h2>
                  <div className="space-y-4">
                    {timeSeriesData.map((data, index) => {
                      const heightPercentage = maxAverage > minAverage 
                        ? ((data.average - minAverage) / (maxAverage - minAverage)) * 100
                        : 50;
                      
                      return (
                        <div key={data.month} className="flex items-end">
                          <div className="w-20 text-sm font-medium text-gray-700 mb-2">
                            {data.month}
                          </div>
                          <div className="flex-1 mx-4">
                            <div className="flex items-end justify-center h-32 bg-gray-100 rounded-lg p-2 relative">
                              <div
                                className="bg-blue-500 rounded-t-md flex items-end justify-center text-white text-xs font-medium min-w-[40px]"
                                style={{ 
                                  height: `${Math.max(heightPercentage, 10)}%`,
                                  paddingBottom: '4px'
                                }}
                              >
                                {data.average.toFixed(1)}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 text-center mt-1">
                              {data.count}件
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* モデル性能比較 */}
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="text-2xl mr-2">🏆</span>
                モデル性能ランキング
              </h2>
              {modelStats.length === 0 ? (
                <p className="text-gray-500">データがありません</p>
              ) : (
                <div className="space-y-6">
                  {modelStats.map((stat, index) => {
                    let rankBadge = '';
                    let rankColor = '';
                    if (index === 0) {
                      rankBadge = '🥇';
                      rankColor = 'bg-yellow-100 text-yellow-800';
                    } else if (index === 1) {
                      rankBadge = '🥈';
                      rankColor = 'bg-gray-100 text-gray-800';
                    } else if (index === 2) {
                      rankBadge = '🥉';
                      rankColor = 'bg-orange-100 text-orange-800';
                    } else {
                      rankColor = 'bg-blue-100 text-blue-800';
                    }
                    
                    return (
                      <div key={stat.modelId} className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${rankColor}`}>
                              {rankBadge} #{index + 1}
                            </span>
                            <h3 className="text-lg font-bold text-gray-800">{stat.modelName}</h3>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{stat.averageScores.overall.toFixed(1)}</div>
                            <div className="text-xs text-gray-500">{stat.count}件の評価</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { key: 'accuracy', label: '正確性', value: stat.averageScores.accuracy, color: 'bg-blue-500' },
                            { key: 'completeness', label: '網羅性', value: stat.averageScores.completeness, color: 'bg-green-500' },
                            { key: 'logic', label: '論理構成', value: stat.averageScores.logic, color: 'bg-purple-500' },
                            { key: 'japanese', label: '日本語', value: stat.averageScores.japanese, color: 'bg-orange-500' },
                          ].map((item) => (
                            <div key={item.key} className="text-center">
                              <div className="text-xs text-gray-600 mb-2 font-medium">{item.label}</div>
                              <div className="relative">
                                <div className="w-16 h-16 mx-auto mb-1 relative">
                                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 32 32">
                                    <circle
                                      cx="16"
                                      cy="16"
                                      r="14"
                                      fill="none"
                                      stroke="#e5e7eb"
                                      strokeWidth="3"
                                    />
                                    <circle
                                      cx="16"
                                      cy="16"
                                      r="14"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      strokeDasharray={`${(item.value / 5) * 87.96} 87.96`}
                                      className={item.color.replace('bg-', 'text-')}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-bold text-gray-700">
                                      {item.value.toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 難易度分析 */}
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="text-2xl mr-2">🎯</span>
                質問難易度分析
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800 font-medium">
                  💡 平均スコアが低い質問ほど難しい質問と考えられます
                </p>
              </div>
              {questionStats.length === 0 ? (
                <p className="text-gray-500">データがありません</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {questionStats.slice(0, 10).map((stat, index) => {
                      let difficultyIcon = '🔴'; // 難しい
                      let difficultyText = '難しい';
                      let difficultyColor = 'bg-red-100 text-red-800';
                      let barColor = 'bg-red-500';
                      
                      if (stat.averageScores.overall >= 4) {
                        difficultyIcon = '🟢'; // 簡単
                        difficultyText = '簡単';
                        difficultyColor = 'bg-green-100 text-green-800';
                        barColor = 'bg-green-500';
                      } else if (stat.averageScores.overall >= 3) {
                        difficultyIcon = '🟡'; // 普通
                        difficultyText = '普通';
                        difficultyColor = 'bg-yellow-100 text-yellow-800';
                        barColor = 'bg-yellow-500';
                      }
                      
                      return (
                        <div key={stat.questionId} className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-medium text-gray-800 text-sm leading-tight flex-1 mr-3">
                              {stat.questionTitle}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${difficultyColor}`}>
                              {difficultyIcon} {difficultyText}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs text-gray-600">
                              <span>平均スコア</span>
                              <span>{stat.count}件の評価</span>
                            </div>
                            
                            <div className="flex items-center">
                              <div className="w-12 text-sm font-bold text-gray-800">
                                {stat.averageScores.overall.toFixed(1)}
                              </div>
                              <div className="flex-1 bg-gray-200 rounded-full h-4 ml-2">
                                <div
                                  className={`${barColor} h-4 rounded-full flex items-center justify-center`}
                                  style={{ width: `${getBarWidth(stat.averageScores.overall, 5)}%` }}
                                >
                                  {stat.averageScores.overall >= 2 && (
                                    <span className="text-white text-xs font-medium">
                                      {stat.averageScores.overall.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* ミニグラフ: 評価項目別 */}
                            <div className="grid grid-cols-4 gap-1 mt-2">
                              {[
                                { key: 'accuracy', label: '正', value: stat.averageScores.accuracy },
                                { key: 'completeness', label: '網', value: stat.averageScores.completeness },
                                { key: 'logic', label: '論', value: stat.averageScores.logic },
                                { key: 'japanese', label: '日', value: stat.averageScores.japanese },
                              ].map((item) => (
                                <div key={item.key} className="text-center">
                                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                                  <div className="h-2 bg-gray-200 rounded-full">
                                    <div
                                      className="h-2 bg-blue-400 rounded-full"
                                      style={{ width: `${(item.value / 5) * 100}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs font-medium text-gray-600 mt-1">
                                    {item.value.toFixed(1)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {questionStats.length > 10 && (
                    <div className="text-center mt-6">
                      <p className="text-sm text-gray-500 bg-gray-100 py-2 px-4 rounded-full inline-block">
                        📄 他 {questionStats.length - 10} 件の質問があります
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}