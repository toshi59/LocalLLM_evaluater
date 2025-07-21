import { NextRequest, NextResponse } from 'next/server';
import { evaluatorConfigService, evaluationPromptService } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionContent, llmResponse, promptId } = body;

    if (!questionContent || !llmResponse) {
      return NextResponse.json(
        { error: 'Question content and LLM response are required' },
        { status: 400 }
      );
    }

    // 評価設定を取得
    const evaluatorConfig = evaluatorConfigService.get();
    if (!evaluatorConfig || !evaluatorConfig.apiKey) {
      return NextResponse.json(
        { error: 'Evaluator configuration not found or API key missing' },
        { status: 400 }
      );
    }

    // 評価プロンプトを取得
    const promptService = evaluationPromptService;
    const selectedPrompt = promptId 
      ? promptService.getById(promptId)
      : promptService.getAll()[0]; // デフォルトプロンプト

    if (!selectedPrompt) {
      return NextResponse.json(
        { error: 'Evaluation prompt not found' },
        { status: 400 }
      );
    }

    // プロンプトのプレースホルダーを置換
    const evaluationPrompt = selectedPrompt.prompt
      .replace('{question}', questionContent)
      .replace('{response}', llmResponse);

    // OpenAI APIに評価リクエスト
    const requestBody = {
      model: evaluatorConfig.model,
      messages: [
        {
          role: "user",
          content: evaluationPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${evaluatorConfig.apiKey}`,
    };

    const response = await fetch(evaluatorConfig.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evaluator API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        endpoint: evaluatorConfig.endpoint,
        model: evaluatorConfig.model
      });
      return NextResponse.json(
        { error: `Failed to get evaluation from evaluator LLM: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const evaluationText = data.choices?.[0]?.message?.content || '';

    // JSONレスポンスを解析
    try {
      // GPT-4oのレスポンスをクリーンアップ
      let cleanedText = evaluationText.trim();
      
      // ```json ブロックを削除
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      // ```ブロックを削除
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('Cleaned evaluation text:', cleanedText);
      
      const evaluationResult = JSON.parse(cleanedText);
      
      // スコアの妥当性をチェック
      const requiredFields = ['accuracy', 'completeness', 'logic', 'japanese'];
      const hasAllScores = requiredFields.every(field => 
        typeof evaluationResult[field] === 'number' && 
        evaluationResult[field] >= 1 && 
        evaluationResult[field] <= 5
      );

      if (!hasAllScores) {
        throw new Error('Invalid evaluation scores');
      }

      // 総合評価を他4項目の平均値で計算
      const overall = (
        evaluationResult.accuracy + 
        evaluationResult.completeness + 
        evaluationResult.logic + 
        evaluationResult.japanese
      ) / 4;

      return NextResponse.json({
        scores: {
          accuracy: evaluationResult.accuracy,
          completeness: evaluationResult.completeness,
          logic: evaluationResult.logic,
          japanese: evaluationResult.japanese,
          overall: Math.round(overall * 10) / 10 // 小数点第1位まで
        },
        comments: evaluationResult.comments || {},
        promptUsed: selectedPrompt.name
      });

    } catch (parseError) {
      console.error('Failed to parse evaluation result:', parseError);
      console.error('Raw evaluation text:', evaluationText);
      
      return NextResponse.json(
        { error: 'Failed to parse evaluation result from evaluator LLM' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in auto-evaluation:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}