import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 環境変数の確認
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasKvUrl: !!kvUrl,
      hasKvToken: !!kvToken,
      kvUrlPrefix: kvUrl?.substring(0, 20) + '...'
    });

    // KV接続テスト
    if (!kvUrl || !kvToken) {
      return NextResponse.json({
        success: false,
        error: 'KV environment variables not set',
        env: process.env.NODE_ENV,
        hasKvUrl: !!kvUrl,
        hasKvToken: !!kvToken
      });
    }

    // KVにテストデータを書き込み
    const testKey = 'debug-test';
    const testData = { message: 'KV connection successful', timestamp: new Date().toISOString() };

    try {
      const { kv } = await import('@vercel/kv');
      
      // 書き込みテスト
      await kv.set(testKey, testData);
      
      // 読み込みテスト
      const result = await kv.get(testKey);
      
      return NextResponse.json({
        success: true,
        message: 'KV connection working',
        testData: result,
        env: process.env.NODE_ENV
      });

    } catch (kvError) {
      console.error('KV operation failed:', kvError);
      return NextResponse.json({
        success: false,
        error: 'KV operation failed',
        details: kvError instanceof Error ? kvError.message : String(kvError),
        env: process.env.NODE_ENV
      });
    }

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug API failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}