import { NextRequest, NextResponse } from 'next/server';
import { evaluatorService } from '@/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const evaluator = await evaluatorService.getById(id);
    
    if (!evaluator) {
      return NextResponse.json({ error: 'Evaluator not found' }, { status: 404 });
    }

    return NextResponse.json(evaluator);
  } catch (error) {
    console.error('Error fetching evaluator:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluator' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const evaluator = await evaluatorService.update(id, body);
    
    if (!evaluator) {
      return NextResponse.json({ error: 'Evaluator not found' }, { status: 404 });
    }

    return NextResponse.json(evaluator);
  } catch (error) {
    console.error('Error updating evaluator:', error);
    return NextResponse.json({ error: 'Failed to update evaluator' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const success = await evaluatorService.delete(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Evaluator not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Evaluator deleted successfully' });
  } catch (error) {
    console.error('Error deleting evaluator:', error);
    return NextResponse.json({ error: 'Failed to delete evaluator' }, { status: 500 });
  }
}