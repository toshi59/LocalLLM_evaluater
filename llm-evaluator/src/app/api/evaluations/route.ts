import { NextRequest, NextResponse } from 'next/server';
import { evaluationService } from '@/lib/data';

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

    const evaluation = evaluationService.create({
      questionId: body.questionId,
      modelId: body.modelId,
      response: body.response,
      scores: body.scores,
      comments: body.comments || {},
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    console.error('Error creating evaluation:', error);
    return NextResponse.json({ error: 'Failed to create evaluation' }, { status: 500 });
  }
}