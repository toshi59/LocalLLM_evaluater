import { NextRequest, NextResponse } from 'next/server';
import { evaluationService, questionService, modelService } from '@/lib/data';
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
        evaluations = evaluationService.getByQuestion(questionId);
      } else if (modelId) {
        evaluations = evaluationService.getByModel(modelId);
      } else {
        evaluations = evaluationService.getAll();
      }
    }

    const detailedEvaluations: EvaluationResult[] = [];
    
    if (isProduction) {
      // 本番環境: KVからデータ取得
      for (const evaluation of evaluations) {
        const question = await kvQuestionService.getById(evaluation.questionId);
        const model = await kvModelService.getById(evaluation.modelId);
          
        if (question && model) {
          detailedEvaluations.push({
            ...evaluation,
            question,
            model
          });
        }
      }
    } else {
      // ローカル環境: 同期的にデータ取得
      for (const evaluation of evaluations) {
        const question = questionService.getById(evaluation.questionId);
        const model = modelService.getById(evaluation.modelId);
          
        if (question && model) {
          detailedEvaluations.push({
            ...evaluation,
            question,
            model
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