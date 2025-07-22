import { NextRequest, NextResponse } from 'next/server';
import { evaluationService } from '@/lib/data';
import { kvEvaluationService } from '@/lib/kv-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const modelId = searchParams.get('modelId');

    // 本番環境ではKVを使用
    const service = process.env.NODE_ENV === 'production' ? kvEvaluationService : evaluationService;
    
    let evaluations;
    if (process.env.NODE_ENV === 'production') {
      const allEvaluations = await service.getAll();
      if (questionId) {
        evaluations = allEvaluations.filter(e => e.questionId === questionId);
      } else if (modelId) {
        evaluations = allEvaluations.filter(e => e.modelId === modelId);
      } else {
        evaluations = allEvaluations;
      }
    } else {
      // ローカル環境
      if (questionId) {
        evaluations = evaluationService.getByQuestion(questionId);
      } else if (modelId) {
        evaluations = evaluationService.getByModel(modelId);
      } else {
        evaluations = evaluationService.getAll();
      }
    }

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.questionId || !body.modelId || !body.response || !body.scores) {
      return NextResponse.json(
        { error: 'QuestionId, modelId, response, and scores are required' },
        { status: 400 }
      );
    }

    const evaluationData = {
      questionId: body.questionId,
      modelId: body.modelId,
      response: body.response,
      scores: body.scores,
      comments: body.comments || {},
      evaluatedAt: new Date(),
    };

    // 本番環境ではKVを使用
    const evaluation = process.env.NODE_ENV === 'production' 
      ? await kvEvaluationService.create(evaluationData)
      : evaluationService.create(evaluationData);

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    console.error('Error creating evaluation:', error);
    return NextResponse.json({ error: 'Failed to create evaluation' }, { status: 500 });
  }
}