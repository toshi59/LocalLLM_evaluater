import { NextRequest, NextResponse } from 'next/server';
import { evaluationEnvironmentService } from '@/lib/data';

export async function GET() {
  try {
    const environments = await evaluationEnvironmentService.getAll();
    return NextResponse.json(environments);
  } catch (error) {
    console.error('Error fetching evaluation environments:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluation environments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.processingSpec || !body.executionApp) {
      return NextResponse.json(
        { error: 'Name, processing spec, and execution app are required' },
        { status: 400 }
      );
    }

    const environmentData = {
      name: body.name,
      processingSpec: body.processingSpec,
      executionApp: body.executionApp,
      description: body.description,
    };

    const environment = await evaluationEnvironmentService.create(environmentData);

    return NextResponse.json(environment, { status: 201 });
  } catch (error) {
    console.error('Error creating evaluation environment:', error);
    return NextResponse.json({ error: 'Failed to create evaluation environment' }, { status: 500 });
  }
}