import { NextRequest, NextResponse } from 'next/server';
import { evaluationPromptService } from '@/lib/data';
import { kvEvaluationPromptService } from '@/lib/kv-data';

export async function GET() {
  try {
    const prompts = process.env.NODE_ENV === 'production' 
      ? await kvEvaluationPromptService.getAll()
      : evaluationPromptService.getAll();
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error fetching evaluation prompts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, prompt, description } = body;

    if (!name || !prompt) {
      return NextResponse.json(
        { error: 'Name and prompt are required' },
        { status: 400 }
      );
    }

    const newPrompt = process.env.NODE_ENV === 'production'
      ? await kvEvaluationPromptService.create({ name, prompt, description })
      : evaluationPromptService.create({ name, prompt, description });

    return NextResponse.json(newPrompt, { status: 201 });
  } catch (error) {
    console.error('Error creating evaluation prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}