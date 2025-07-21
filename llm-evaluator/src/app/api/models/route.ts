import { NextRequest, NextResponse } from 'next/server';
import { modelService } from '@/lib/data';
import { LLMModel } from '@/types';

export async function GET() {
  try {
    const models = modelService.getAll();
    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.endpoint) {
      return NextResponse.json(
        { error: 'Name and endpoint are required' },
        { status: 400 }
      );
    }

    const model = modelService.create({
      name: body.name,
      endpoint: body.endpoint,
      apiKey: body.apiKey,
      description: body.description,
    });

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 });
  }
}