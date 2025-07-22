import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EvaluationResult, LLMModel, Question } from '@/types';

export interface EvaluationDataResponse {
  evaluations: EvaluationResult[];
  models: LLMModel[];
  questions: Question[];
}

// 全てのデータを一括取得するAPI関数
async function fetchAllEvaluationData(): Promise<EvaluationDataResponse> {
  const [evaluationsRes, modelsRes, questionsRes] = await Promise.all([
    fetch('/api/evaluations/detailed'),
    fetch('/api/models'),
    fetch('/api/questions')
  ]);

  if (!evaluationsRes.ok || !modelsRes.ok || !questionsRes.ok) {
    throw new Error('Failed to fetch evaluation data');
  }

  const [evaluations, models, questions] = await Promise.all([
    evaluationsRes.json(),
    modelsRes.json(),
    questionsRes.json()
  ]);

  return { evaluations, models, questions };
}

// フィルタ済み評価データを取得するAPI関数
async function fetchFilteredEvaluations(modelId?: string, questionId?: string): Promise<EvaluationResult[]> {
  const params = new URLSearchParams();
  if (modelId) params.append('modelId', modelId);
  if (questionId) params.append('questionId', questionId);
  
  const response = await fetch(`/api/evaluations/detailed?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch filtered evaluations');
  }
  
  return response.json();
}

// 全ての評価データを取得するカスタムフック
export function useEvaluationData() {
  return useQuery({
    queryKey: ['evaluationData'],
    queryFn: fetchAllEvaluationData,
    staleTime: 2 * 60 * 1000, // 2分間キャッシュ
  });
}

// フィルタ済み評価データを取得するカスタムフック
export function useFilteredEvaluations(modelId?: string, questionId?: string) {
  return useQuery({
    queryKey: ['filteredEvaluations', modelId, questionId],
    queryFn: () => fetchFilteredEvaluations(modelId, questionId),
    staleTime: 1 * 60 * 1000, // 1分間キャッシュ
    enabled: !!(modelId || questionId), // フィルタが指定された時のみ実行
  });
}

// 評価削除のAPI関数
async function deleteEvaluation(evaluationId: string): Promise<void> {
  const response = await fetch(`/api/evaluations/${evaluationId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete evaluation');
  }
}

// 評価削除のカスタムフック
export function useDeleteEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEvaluation,
    onSuccess: () => {
      // キャッシュを無効化して再取得を促す
      queryClient.invalidateQueries({ queryKey: ['evaluationData'] });
      queryClient.invalidateQueries({ queryKey: ['filteredEvaluations'] });
    },
  });
}