import { NextRequest, NextResponse } from 'next/server';
import { evaluatorService } from '@/lib/data';

export async function GET() {
  try {
    const evaluators = await evaluatorService.getAll();
    return NextResponse.json(evaluators);
  } catch (error) {
    console.error('Error fetching evaluators:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluators' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const evaluatorData = {
      name: body.name,
      organization: body.organization,
      email: body.email,
      description: body.description,
    };

    const evaluator = await evaluatorService.create(evaluatorData);

    return NextResponse.json(evaluator, { status: 201 });
  } catch (error) {
    console.error('Error creating evaluator:', error);
    return NextResponse.json({ error: 'Failed to create evaluator' }, { status: 500 });
  }
}