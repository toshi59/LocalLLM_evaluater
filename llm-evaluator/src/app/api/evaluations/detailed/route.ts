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
    
    for (const evaluation of evaluations) {
      const question = isProduction 
        ? await kvQuestionService.getById(evaluation.questionId)
        : questionService.getById(evaluation.questionId);
      const model = isProduction 
        ? await kvModelService.getById(evaluation.modelId)
        : modelService.getById(evaluation.modelId);
        
      if (question && model) {
        detailedEvaluations.push({
          ...evaluation,
          question,
          model
        });
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