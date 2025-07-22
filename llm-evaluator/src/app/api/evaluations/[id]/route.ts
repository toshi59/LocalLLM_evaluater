import { NextRequest, NextResponse } from 'next/server';
import { evaluationService } from '@/lib/data';
import { kvEvaluationService } from '@/lib/kv-data';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const success = process.env.NODE_ENV === 'production'
      ? await kvEvaluationService.delete(id)
      : evaluationService.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}