import { NextRequest, NextResponse } from 'next/server';
import { evaluationService, questionService, modelService } from '@/lib/data';
import { EvaluationResult } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const modelId = searchParams.get('modelId');

    let evaluations;
    if (questionId) {
      evaluations = evaluationService.getByQuestion(questionId);
    } else if (modelId) {
      evaluations = evaluationService.getByModel(modelId);
    } else {
      evaluations = evaluationService.getAll();
    }

    const detailedEvaluations: EvaluationResult[] = evaluations
      .map(evaluation => {
        const question = questionService.getById(evaluation.questionId);
        const model = modelService.getById(evaluation.modelId);
        
        if (!question || !model) {
          return null;
        }

        return {
          ...evaluation,
          question,
          model
        };
      })
      .filter((evaluation): evaluation is EvaluationResult => evaluation !== null)
      .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());

    return NextResponse.json(detailedEvaluations);
  } catch (error) {
    console.error('Error fetching detailed evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' }, 
      { status: 500 }
    );
  }
}