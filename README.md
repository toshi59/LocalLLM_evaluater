# LLM評価システム

ローカルLLMを体系的に評価・比較するための包括的なWebアプリケーション

## 概要

このシステムは、ローカルLLMの性能を客観的に評価し、比較分析を行うためのWebベースのツールです。GPT-4oを使用した自動評価機能により、一貫性のある評価結果を提供します。

## 主な機能

### 🤖 LLMモデル管理
- ローカルLLMモデルの登録・管理
- モデル名とサイズ情報の記録

### ❓ 質問バンク
- 評価用質問の作成・整理
- カスタム質問の追加・編集

### 📝 自動評価システム
- GPT-4oによる5項目の自動評価
- 正確性・網羅性・論理構成・日本語・総合評価
- 詳細なコメント付き評価結果

### 📊 結果分析
- フィルタリング機能付きの詳細結果表示
- 折りたたみ可能な評価結果表示
- CSV形式でのデータエクスポート

### 📈 統計ダッシュボード
- 視覚的なデータ可視化（グラフ・チャート）
- モデル性能比較とランキング
- スコア分布分析
- 時系列パフォーマンス追跡
- 質問難易度分析

### ⚙️ カスタマイズ設定
- 評価LLMの選択（GPT-4o等）
- 評価プロンプトの編集・カスタマイズ
- OpenAI APIキーの設定

## 技術スタック

- **フロントエンド**: Next.js 15.4.2, React, TypeScript
- **スタイリング**: Tailwind CSS
- **データストレージ**: JSONファイルベース
- **API**: OpenAI GPT-4o
- **開発環境**: Node.js

## 評価項目

### 🎯 正確性 (Accuracy)
事実の正確さ、情報の信頼性を評価

### 📋 網羅性 (Completeness) 
質問に対する回答の完全性、必要な情報の網羅度を評価

### 🔗 論理構成 (Logic)
論理的な構造と議論の流れを評価

### 🇯🇵 日本語 (Japanese)
日本語の自然さ、文法、表現の適切さを評価

### 🏆 総合評価 (Overall)
上記4項目の平均値で自動計算

**評価スケール**: 1（不良）〜 5（優秀）

## セットアップ

### ローカル開発

#### 前提条件
- Node.js 18以上
- OpenAI APIキー（評価機能用）

#### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/toshi59/LocalLLM_evaluater.git
cd LocalLLM_evaluater/llm-evaluator
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.example .env.local
# .env.localファイルを編集してAPIキーを設定
```

4. 開発サーバーを起動
```bash
npm run dev
```

5. ブラウザで http://localhost:3000 にアクセス

### Vercelでのデプロイ

このアプリケーションはVercelでの本番デプロイに対応しています。

#### デプロイ手順

1. **Vercelアカウント作成**: [vercel.com](https://vercel.com) でGitHub連携
2. **プロジェクト作成**: 「New Project」→「LocalLLM_evaluater」を選択
3. **設定**: 
   - Framework Preset: Next.js (自動検出)
   - Root Directory: `llm-evaluator`
4. **環境変数設定** (必須):
   - `NEXTAUTH_SECRET`: ランダムな文字列
   - `NEXTAUTH_URL`: https://your-app.vercel.app
   - その他必要な環境変数は`.env.example`を参照
5. **KVデータベース作成**: Vercel管理画面で「Storage」→「Create KV Database」

#### 本番環境の特徴
- GitHub OAuth認証対応
- Vercel KVによるデータ永続化
- 自動HTTPS対応
- CDN配信による高速化

### 初期設定

1. **設定ページ**でOpenAI APIキーを設定
2. **LLMモデル管理**で評価対象のモデルを登録
3. **質問管理**で評価用質問を作成
4. **評価実行**でLLMの回答を入力し、自動評価を実行

## 使用方法

### 基本的なワークフロー

1. **設定**: OpenAI APIキーと評価プロンプトを設定
2. **準備**: LLMモデルと評価質問を登録
3. **評価**: モデルの回答をペーストして自動評価を実行
4. **分析**: 評価結果を確認し、統計分析やCSVエクスポートで比較

### 画面構成

- **ホーム**: システム概要と使用方法（折りたたみ可能セクション）
- **LLMモデル管理**: モデル情報の登録・編集
- **質問管理**: 評価質問の作成・管理
- **評価実行**: LLM回答の入力と自動評価
- **評価結果**: 詳細結果の表示（フィルタリング・エクスポート機能）
- **統計・分析**: 視覚的なデータ分析ダッシュボード
- **設定**: API設定と評価プロンプトのカスタマイズ

## データ構造

### モデル情報
```json
{
  "id": "model-id",
  "name": "モデル名",
  "size": "7B"
}
```

### 質問情報
```json
{
  "id": "question-id", 
  "title": "質問タイトル",
  "content": "質問内容"
}
```

### 評価結果
```json
{
  "id": "evaluation-id",
  "modelId": "model-id",
  "questionId": "question-id", 
  "response": "LLMの回答",
  "scores": {
    "accuracy": 4.0,
    "completeness": 4.5,
    "logic": 4.0,
    "japanese": 4.5,
    "overall": 4.25
  },
  "comments": {
    "accuracy": "詳細コメント",
    "completeness": "詳細コメント",
    "logic": "詳細コメント", 
    "japanese": "詳細コメント",
    "overall": "総合コメント"
  },
  "evaluatedAt": "2025-01-21T12:00:00Z"
}
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

バグレポートや機能要望は、GitHubのIssuesでお知らせください。プルリクエストも歓迎します。