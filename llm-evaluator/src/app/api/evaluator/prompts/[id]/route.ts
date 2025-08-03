import { NextRequest, NextResponse } from 'next/server';
import { evaluationPromptService } from '@/lib/data';
import { kvEvaluationPromptService } from '@/lib/kv-data';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, prompt, description } = body;

    const updatedPrompt = process.env.NODE_ENV === 'production'
      ? await kvEvaluationPromptService.update(id, { name, prompt, description })
      : await evaluationPromptService.update(id, { name, prompt, description });

    if (!updatedPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error('Error updating evaluation prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const success = process.env.NODE_ENV === 'production'
      ? await kvEvaluationPromptService.delete(id)
      : await evaluationPromptService.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting evaluation prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}