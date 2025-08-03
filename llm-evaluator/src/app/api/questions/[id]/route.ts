import { NextRequest, NextResponse } from 'next/server';
import { questionService } from '@/lib/data';
import { kvQuestionService } from '@/lib/kv-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 本番環境ではKVを使用
    const question = process.env.NODE_ENV === 'production'
      ? await kvQuestionService.getById(id)
      : await questionService.getById(id);
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // 本番環境ではKVを使用
    const question = process.env.NODE_ENV === 'production'
      ? await kvQuestionService.update(id, body)
      : await questionService.update(id, body);
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 本番環境ではKVを使用
    const success = process.env.NODE_ENV === 'production'
      ? await kvQuestionService.delete(id)
      : await questionService.delete(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}