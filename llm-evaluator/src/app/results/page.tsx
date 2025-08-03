'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { EvaluationResult } from '@/types';
import { useEvaluationData, useFilteredEvaluations, useDeleteEvaluation } from '@/hooks/useEvaluationData';

export default function ResultsPage() {
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [expandedEvaluations, setExpandedEvaluations] = useState<Set<string>>(new Set());
  const [expandedEnvironments, setExpandedEnvironments] = useState<Set<string>>(new Set());

  // React Queryを使用してデータを取得とキャッシュ
  const { data, isLoading, error } = useEvaluationData();
  const { data: filteredEvaluations } = useFilteredEvaluations(selectedModelId, selectedQuestionId);
  const deleteEvaluationMutation = useDeleteEvaluation();

  // フィルタが適用されている場合はフィルタ済みデータ、そうでなければ全データを使用
  const evaluations = filteredEvaluations || data?.evaluations || [];
  const models = data?.models || [];
  const questions = data?.questions || [];

  // メモ化された平均スコア計算
  const averageScores = useMemo(() => {
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
  }, [evaluations]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (selectedModelId) params.append('modelId', selectedModelId);
      if (selectedQuestionId) params.append('questionId', selectedQuestionId);
      
      const response = await fetch(`/api/evaluations/export?${params.toString()}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `evaluation_results_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('CSVエクスポートでエラーが発生しました');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('CSVエクスポートでエラーが発生しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteEvaluation = useCallback(async (evaluationId: string) => {
    if (!confirm('この評価結果を削除しますか？')) return;

    try {
      await deleteEvaluationMutation.mutateAsync(evaluationId);
      alert('評価結果を削除しました');
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      alert(`削除でエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }, [deleteEvaluationMutation]);

  // メモ化されたモデル×質問のマトリックスデータ計算
  const matrixData = useMemo(() => {
    const matrix: { [modelId: string]: { [questionId: string]: number | null } } = {};
    const countMatrix: { [modelId: string]: { [questionId: string]: number } } = {};
    
    // 評価済みのモデルと質問のみを取得
    const evaluatedModelIds = new Set(evaluations.map(e => e.modelId));
    const evaluatedQuestionIds = new Set(evaluations.map(e => e.questionId));
    
    const evaluatedModels = models.filter(model => evaluatedModelIds.has(model.id));
    const evaluatedQuestions = questions.filter(question => evaluatedQuestionIds.has(question.id));
    
    // 評価済みモデルと質問の組み合わせを初期化
    evaluatedModels.forEach(model => {
      matrix[model.id] = {};
      countMatrix[model.id] = {};
      evaluatedQuestions.forEach(question => {
        matrix[model.id][question.id] = null;
        countMatrix[model.id][question.id] = 0;
      });
    });
    
    // 同じモデル×質問の組み合わせの評価結果を集計して平均値を計算
    const scoreGroups: { [key: string]: number[] } = {};
    
    evaluations.forEach(evaluation => {
      const key = `${evaluation.modelId}-${evaluation.questionId}`;
      if (!scoreGroups[key]) {
        scoreGroups[key] = [];
      }
      scoreGroups[key].push(evaluation.scores.overall);
    });
    
    // 平均値と件数をマトリックスに設定
    Object.entries(scoreGroups).forEach(([key, scores]) => {
      const [modelId, questionId] = key.split('-');
      if (matrix[modelId] && matrix[modelId][questionId] !== undefined) {
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        matrix[modelId][questionId] = Math.round(average * 10) / 10; // 小数点第1位まで
        countMatrix[modelId][questionId] = scores.length;
      }
    });
    
    return { matrixData: matrix, countMatrix, evaluatedModels, evaluatedQuestions };
  }, [evaluations, models, questions]);

  // メモ化されたイベントハンドラー
  const toggleExpanded = useCallback((evaluationId: string) => {
    setExpandedItems(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(evaluationId)) {
        newExpanded.delete(evaluationId);
      } else {
        newExpanded.add(evaluationId);
      }
      return newExpanded;
    });
  }, []);

  const toggleEvaluationExpanded = useCallback((evaluationId: string) => {
    setExpandedEvaluations(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(evaluationId)) {
        newExpanded.delete(evaluationId);
      } else {
        newExpanded.add(evaluationId);
      }
      return newExpanded;
    });
  }, []);

  const toggleEnvironmentExpanded = useCallback((evaluationId: string) => {
    setExpandedEnvironments(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(evaluationId)) {
        newExpanded.delete(evaluationId);
      } else {
        newExpanded.add(evaluationId);
      }
      return newExpanded;
    });
  }, []);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 4.5) return 'text-green-600 bg-green-100';
    if (score >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          エラーが発生しました: {error.message}
        </div>
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

        {/* モデル×質問マトリックス */}
        {(() => {
          const { matrixData: matrix, countMatrix, evaluatedModels, evaluatedQuestions } = matrixData;
          
          if (evaluatedModels.length === 0 || evaluatedQuestions.length === 0) {
            return null;
          }
          
          return (
            <div className="bg-white rounded-lg shadow-md p-6 border mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="text-2xl mr-2">🎯</span>
                モデル×質問 総合得点マトリックス
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800 font-medium">
                  💡 縦軸：モデル、横軸：質問で、各セルは総合得点を表示しています。空白は未評価です。
                  <br />
                  <span className="text-xs">※評価が1件以上あるモデル・質問のみ表示</span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 bg-gray-100 p-3 text-left font-medium text-gray-700 sticky left-0 z-10">
                        モデル / 質問
                      </th>
                      {evaluatedQuestions.map(question => (
                        <th key={question.id} className="border border-gray-300 bg-gray-100 p-2 text-center font-medium text-gray-700 min-w-[120px]">
                          <div className="text-xs leading-tight" title={question.title}>
                            {question.title.length > 20 
                              ? `${question.title.substring(0, 20)}...`
                              : question.title}
                          </div>
                        </th>
                      ))}
                      <th className="border border-gray-300 bg-gradient-to-r from-blue-100 to-blue-200 p-2 text-center font-bold text-blue-800 min-w-[100px]">
                        <div className="text-xs leading-tight">
                          平均スコア
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluatedModels.map(model => {
                      const modelEvaluationCount = evaluations.filter(e => e.modelId === model.id).length;
                      return (
                        <tr key={model.id}>
                          <td className="border border-gray-300 bg-gray-50 p-3 font-medium text-gray-800 sticky left-0 z-10">
                            <div className="text-sm">
                              {model.name}
                              <div className="text-xs text-gray-500">{modelEvaluationCount}件評価</div>
                            </div>
                          </td>
                          {evaluatedQuestions.map(question => {
                            const score = matrix[model.id]?.[question.id];
                            const count = countMatrix[model.id]?.[question.id] || 0;
                            return (
                              <td key={question.id} className="border border-gray-300 p-2 text-center">
                                {score !== null && score !== undefined ? (
                                  <div>
                                    <div className={`inline-block px-3 py-2 rounded-lg text-sm font-bold ${getScoreColor(score)}`}>
                                      {score.toFixed(1)}
                                    </div>
                                    {count > 1 && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {count}件平均
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-xs">
                                    未評価
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="border border-gray-300 p-2 text-center bg-gradient-to-r from-blue-50 to-blue-100">
                            {(() => {
                              const modelScores = evaluatedQuestions
                                .map(question => matrix[model.id]?.[question.id])
                                .filter(score => score !== null && score !== undefined);
                              
                              if (modelScores.length === 0) {
                                return (
                                  <div className="text-gray-400 text-xs">
                                    未評価
                                  </div>
                                );
                              }
                              
                              const average = modelScores.reduce((sum, score) => sum + score, 0) / modelScores.length;
                              return (
                                <div className={`inline-block px-3 py-2 rounded-lg text-sm font-bold border-2 border-blue-300 ${getScoreColor(average)}`}>
                                  {average.toFixed(1)}
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-green-100 rounded"></div>
                    <span>4.5点以上</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-yellow-100 rounded"></div>
                    <span>3.0-4.4点</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-red-100 rounded"></div>
                    <span>3.0点未満</span>
                  </div>
                </div>
                <div>
                  表示組み合わせ数: {evaluatedModels.length} × {evaluatedQuestions.length} = {evaluatedModels.length * evaluatedQuestions.length}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="bg-white rounded-lg shadow-md p-6 border mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">フィルタ・操作</h2>
            <button
              onClick={handleExportCSV}
              disabled={isExporting || evaluations.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isExporting ? 'エクスポート中...' : 'CSV出力'}
            </button>
          </div>
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
              <div key={evaluation.id} className="bg-white rounded-lg shadow-md border">
                <div className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* 左側: 展開ボタン + 基本情報 */}
                    <div className="col-span-7 flex items-center gap-4">
                      <button
                        onClick={() => toggleEvaluationExpanded(evaluation.id)}
                        className="text-gray-600 hover:text-gray-800 text-xl font-bold w-8 h-8 flex items-center justify-center flex-shrink-0"
                        title={expandedEvaluations.has(evaluation.id) ? "省略表示" : "詳細表示"}
                      >
                        {expandedEvaluations.has(evaluation.id) ? '−' : '+'}
                      </button>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold mb-1 truncate">{evaluation.question.title}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            モデル: <span className="font-medium">{evaluation.model.name}</span> | 
                            評価日: {new Date(evaluation.evaluatedAt).toLocaleDateString('ja-JP')}
                            {evaluation.evaluator && (
                              <> | 評価者: <span className="font-medium">{evaluation.evaluator}</span></>
                            )}
                            {evaluation.processingTime && (
                              <> | 処理時間: <span className="font-medium">{evaluation.processingTime}秒</span></>
                            )}
                          </div>
                          {evaluation.environment && (
                            <div>
                              環境: <span className="font-medium">{evaluation.environment.name}</span> | 
                              スペック: <span className="font-medium" title={evaluation.environment.processingSpec}>
                                {evaluation.environment.processingSpec.length > 30 
                                  ? evaluation.environment.processingSpec.substring(0, 30)
                                  : evaluation.environment.processingSpec}
                              </span>
                              {evaluation.environment.processingSpec.length > 30 && (
                                <button 
                                  onClick={() => toggleEnvironmentExpanded(evaluation.id)}
                                  className="text-blue-600 hover:text-blue-800 ml-1"
                                  title="環境情報の詳細を表示/非表示"
                                >
                                  ...
                                </button>
                              )} | 
                              アプリ: <span className="font-medium">{evaluation.environment.executionApp}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* 右側: 評価スコア + 削除ボタン */}
                    <div className="col-span-5 flex items-center justify-end gap-3">
                      <div className="flex items-center gap-2">
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { key: 'accuracy', label: '正', value: evaluation.scores.accuracy },
                            { key: 'completeness', label: '網', value: evaluation.scores.completeness },
                            { key: 'logic', label: '論', value: evaluation.scores.logic },
                            { key: 'japanese', label: '日', value: evaluation.scores.japanese },
                          ].map((item) => (
                            <div key={item.key} className={`text-xs font-semibold px-2 py-1 rounded text-center ${getScoreColor(item.value)}`} title={item.label}>
                              {item.value}
                            </div>
                          ))}
                        </div>
                        <div className={`text-lg font-bold px-3 py-2 rounded border-2 ${getScoreColor(evaluation.scores.overall)}`} title="総合評価">
                          {evaluation.scores.overall}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEvaluation(evaluation.id)}
                        className="bg-transparent text-red-600 px-3 py-2 rounded text-xs hover:bg-red-50 hover:border hover:border-red-400 flex-shrink-0"
                        title="この評価結果を削除"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  
                  {/* 環境情報詳細表示 */}
                  {expandedEnvironments.has(evaluation.id) && evaluation.environment && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-300">
                      <h4 className="font-semibold text-blue-800 mb-3">評価環境詳細情報</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">環境名:</span>
                            <div className="text-gray-900 mt-1">{evaluation.environment.name}</div>
                          </div>
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">実行アプリ:</span>
                            <div className="text-gray-900 mt-1">{evaluation.environment.executionApp}</div>
                          </div>
                        </div>
                        <div>
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">処理スペック:</span>
                            <div className="text-gray-900 mt-1 whitespace-pre-wrap break-words">
                              {evaluation.environment.processingSpec}
                            </div>
                          </div>
                        </div>
                      </div>
                      {evaluation.environment.description && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-700">説明:</span>
                          <div className="text-gray-900 mt-1">{evaluation.environment.description}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {expandedEvaluations.has(evaluation.id) && (
                  <div className="px-6 pb-6 border-t">
                    <div className="pt-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-gray-700">質問:</h4>
                            {evaluation.question.content.length > 200 && (
                              <button
                                onClick={() => toggleExpanded(`question-${evaluation.id}`)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                {expandedItems.has(`question-${evaluation.id}`) ? '省略表示' : '全文表示'}
                              </button>
                            )}
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap">
                            {expandedItems.has(`question-${evaluation.id}`) || evaluation.question.content.length <= 200
                              ? evaluation.question.content
                              : `${evaluation.question.content.substring(0, 200)}...`}
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-gray-700">回答:</h4>
                            {evaluation.response.length > 200 && (
                              <button
                                onClick={() => toggleExpanded(`response-${evaluation.id}`)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                {expandedItems.has(`response-${evaluation.id}`) ? '省略表示' : '全文表示'}
                              </button>
                            )}
                          </div>
                          <div className="bg-blue-50 p-3 rounded-md text-sm whitespace-pre-wrap">
                            {expandedItems.has(`response-${evaluation.id}`) || evaluation.response.length <= 200
                              ? evaluation.response
                              : `${evaluation.response.substring(0, 200)}...`}
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

                      {evaluation.comments && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">詳細コメント:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { key: 'accuracy', label: '正確性' },
                              { key: 'completeness', label: '網羅性' },
                              { key: 'logic', label: '論理構成' },
                              { key: 'japanese', label: '日本語' },
                              { key: 'overall', label: '総合' },
                            ].map((item) => (
                              evaluation.comments[item.key as keyof typeof evaluation.comments] && (
                                <div key={item.key} className="bg-yellow-50 p-3 rounded-md">
                                  <div className="font-medium text-sm text-gray-800 mb-1">{item.label}:</div>
                                  <div className="text-xs text-gray-700">
                                    {evaluation.comments[item.key as keyof typeof evaluation.comments]}
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
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