import { NextRequest, NextResponse } from 'next/server';
import { evaluatorConfigService } from '@/lib/data';
import { kvEvaluatorConfigService } from '@/lib/kv-data';

export async function GET() {
  try {
    const config = process.env.NODE_ENV === 'production' 
      ? await kvEvaluatorConfigService.get()
      : evaluatorConfigService.get();
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

    if (!endpoint || !model) {
      return NextResponse.json(
        { error: 'Endpoint and model are required' },
        { status: 400 }
      );
    }

    // 本番環境ではAPIキーは環境変数から取得
    const configData = process.env.NODE_ENV === 'production' 
      ? { endpoint, model } // APIキーは環境変数から自動取得
      : { endpoint, apiKey, model };

    const updatedConfig = process.env.NODE_ENV === 'production'
      ? await kvEvaluatorConfigService.update(configData)
      : evaluatorConfigService.update(configData);

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating evaluator config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}