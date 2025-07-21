import { NextRequest, NextResponse } from 'next/server';
import { evaluationService, modelService, questionService } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const questionId = searchParams.get('questionId');

    // 評価データを取得
    let evaluations = evaluationService.getAll();
    
    // フィルタリング
    if (modelId) {
      evaluations = evaluations.filter(e => e.modelId === modelId);
    }
    if (questionId) {
      evaluations = evaluations.filter(e => e.questionId === questionId);
    }

    // モデルと質問の情報を取得
    const models = modelService.getAll();
    const questions = questionService.getAll();

    // CSV形式でデータを構築
    const csvData = evaluations.map(evaluation => {
      const model = models.find(m => m.id === evaluation.modelId);
      const question = questions.find(q => q.id === evaluation.questionId);

      return {
        'ID': evaluation.id,
        '評価日時': new Date(evaluation.evaluatedAt).toLocaleString('ja-JP'),
        'モデル名': model?.name || '不明',
        '質問タイトル': question?.title || '不明',
        '質問内容': question?.content || '不明',
        'LLMの回答': evaluation.response,
        '正確性': evaluation.scores.accuracy,
        '網羅性': evaluation.scores.completeness,
        '論理構成': evaluation.scores.logic,
        '日本語': evaluation.scores.japanese,
        '総合': evaluation.scores.overall,
        '平均スコア': (
          (evaluation.scores.accuracy + 
           evaluation.scores.completeness + 
           evaluation.scores.logic + 
           evaluation.scores.japanese + 
           evaluation.scores.overall) / 5
        ).toFixed(2),
        'コメント': evaluation.comment || ''
      };
    });

    // CSVヘッダー
    const headers = Object.keys(csvData[0] || {});
    
    // CSV文字列を生成
    let csvContent = '\uFEFF'; // BOM for Excel compatibility
    csvContent += headers.join(',') + '\n';
    
    csvData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header as keyof typeof row] || '';
        // CSVエスケープ処理
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvContent += values.join(',') + '\n';
    });

    // レスポンスヘッダーを設定
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="evaluation_results_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

    return response;

  } catch (error) {
    console.error('Error exporting evaluations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}