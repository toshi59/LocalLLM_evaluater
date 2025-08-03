import { NextRequest, NextResponse } from 'next/server';
import { evaluationEnvironmentService } from '@/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const environment = await evaluationEnvironmentService.getById(id);
    
    if (!environment) {
      return NextResponse.json({ error: 'Evaluation environment not found' }, { status: 404 });
    }

    return NextResponse.json(environment);
  } catch (error) {
    console.error('Error fetching evaluation environment:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluation environment' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const environment = await evaluationEnvironmentService.update(id, body);
    
    if (!environment) {
      return NextResponse.json({ error: 'Evaluation environment not found' }, { status: 404 });
    }

    return NextResponse.json(environment);
  } catch (error) {
    console.error('Error updating evaluation environment:', error);
    return NextResponse.json({ error: 'Failed to update evaluation environment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const success = await evaluationEnvironmentService.delete(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Evaluation environment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Evaluation environment deleted successfully' });
  } catch (error) {
    console.error('Error deleting evaluation environment:', error);
    return NextResponse.json({ error: 'Failed to delete evaluation environment' }, { status: 500 });
  }
}