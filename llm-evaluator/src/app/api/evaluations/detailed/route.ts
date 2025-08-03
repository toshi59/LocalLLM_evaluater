import { NextRequest, NextResponse } from 'next/server';
import { evaluationService, questionService, modelService, evaluationEnvironmentService } from '@/lib/data';
import { kvEvaluationService, kvQuestionService, kvModelService } from '@/lib/kv-data';
import { EvaluationResult } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const modelId = searchParams.get('modelId');

    // 本番環境ではKVを使用
    const isProduction = process.env.NODE_ENV === 'production';
    
    let evaluations;
    if (isProduction) {
      const allEvaluations = await kvEvaluationService.getAll();
      if (questionId) {
        evaluations = allEvaluations.filter(e => e.questionId === questionId);
      } else if (modelId) {
        evaluations = allEvaluations.filter(e => e.modelId === modelId);
      } else {
        evaluations = allEvaluations;
      }
    } else {
      if (questionId) {
        evaluations = await evaluationService.getByQuestion(questionId);
      } else if (modelId) {
        evaluations = await evaluationService.getByModel(modelId);
      } else {
        evaluations = await evaluationService.getAll();
      }
    }

    const detailedEvaluations: EvaluationResult[] = [];
    
    if (isProduction) {
      // 本番環境: KVからデータ取得
      for (const evaluation of evaluations) {
        const question = await kvQuestionService.getById(evaluation.questionId);
        const model = await kvModelService.getById(evaluation.modelId);
        // TODO: KV環境での評価環境取得処理
        const environment = null; // KV側の実装が必要
          
        if (question && model) {
          detailedEvaluations.push({
            ...evaluation,
            question,
            model,
            environment: environment || undefined
          });
        }
      }
    } else {
      // ローカル環境: 非同期でデータ取得（modelServiceもasyncのため）
      for (const evaluation of evaluations) {
        const question = await questionService.getById(evaluation.questionId);
        const model = await modelService.getById(evaluation.modelId);
        const environment = evaluation.environmentId 
          ? await evaluationEnvironmentService.getById(evaluation.environmentId)
          : null;
          
        if (question && model) {
          detailedEvaluations.push({
            ...evaluation,
            question,
            model,
            environment
          });
        }
      }
    }

    detailedEvaluations.sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());

    return NextResponse.json(detailedEvaluations);
  } catch (error) {
    console.error('Error fetching detailed evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' }, 
      { status: 500 }
    );
  }
}