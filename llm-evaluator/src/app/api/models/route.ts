import { NextRequest, NextResponse } from 'next/server';
import { modelService } from '@/lib/data';
import { kvModelService } from '@/lib/kv-data';

export async function GET() {
  try {
    const models = process.env.NODE_ENV === 'production' 
      ? await kvModelService.getAll() 
      : await modelService.getAll();
    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
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

    const modelData = {
      name: body.name,
      endpoint: body.endpoint,
      apiKey: body.apiKey,
      size: body.size,
      description: body.description,
    };

    const model = process.env.NODE_ENV === 'production' 
      ? await kvModelService.create(modelData)
      : await modelService.create(modelData);

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 });
  }
}