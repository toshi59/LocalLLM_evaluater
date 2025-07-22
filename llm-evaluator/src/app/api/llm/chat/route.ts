import { NextRequest, NextResponse } from 'next/server';
import { modelService } from '@/lib/data';
import { kvModelService } from '@/lib/kv-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, message } = body;

    if (!modelId || !message) {
      return NextResponse.json(
        { error: 'ModelId and message are required' },
        { status: 400 }
      );
    }

    const model = process.env.NODE_ENV === 'production' 
      ? await kvModelService.getById(modelId)
      : modelService.getById(modelId);
      
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    if (!model.endpoint) {
      return NextResponse.json({ error: 'Model endpoint not configured' }, { status: 400 });
    }

    const requestBody = {
      model: model.name,
      messages: [
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (model.apiKey) {
      headers['Authorization'] = `Bearer ${model.apiKey}`;
    }

    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get response from LLM' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const content = data.choices?.[0]?.message?.content || 
                   data.response || 
                   'レスポンスを取得できませんでした';

    return NextResponse.json({
      response: content,
      modelName: model.name
    });

  } catch (error) {
    console.error('Error communicating with LLM:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}