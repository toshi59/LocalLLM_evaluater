import { NextRequest, NextResponse } from 'next/server';
import { evaluatorConfigService } from '@/lib/data';

export async function GET() {
  try {
    const config = evaluatorConfigService.get();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching evaluator config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, apiKey, model } = body;

    // 本番環境では環境変数経由での設定のみ許可
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { 
          error: 'Configuration update not available in production. Use environment variables instead.',
          message: 'Please set OPENAI_API_KEY environment variable in Vercel dashboard.'
        },
        { status: 403 }
      );
    }

    if (!endpoint || !apiKey || !model) {
      return NextResponse.json(
        { error: 'Endpoint, API key, and model are required' },
        { status: 400 }
      );
    }

    const updatedConfig = evaluatorConfigService.update({
      endpoint,
      apiKey,
      model
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating evaluator config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}