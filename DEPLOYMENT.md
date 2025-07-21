# Vercelデプロイガイド

## 手動デプロイ手順

### 1. Vercelアカウント作成・ログイン
1. [vercel.com](https://vercel.com) にアクセス
2. 「Continue with GitHub」でGitHub連携

### 2. プロジェクト作成
1. ダッシュボードで「New Project」をクリック
2. 「Import Git Repository」で `LocalLLM_evaluater` を選択
3. 以下の設定を入力：
   - **Framework Preset**: Next.js（自動検出される）
   - **Root Directory**: `llm-evaluator`
   - **Build Command**: `npm run build`（デフォルト）
   - **Output Directory**: `.next`（デフォルト）
   - **Install Command**: `npm install`（デフォルト）

### 3. 環境変数設定（必須）
「Environment Variables」セクションで以下を設定：

#### 必須環境変数
```
NEXTAUTH_SECRET=your-random-secret-string-here
NEXTAUTH_URL=https://your-app-name.vercel.app
```

#### GitHub認証用（オプション）
```
GITHUB_CLIENT_ID=your-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret
```

### 4. KVデータベース作成
1. プロジェクトダッシュボード → 「Storage」タブ
2. 「Create Database」→「KV」を選択
3. データベース名を入力（例：`llm-evaluator-db`）
4. 「Create」をクリック
5. 自動的に `KV_REST_API_URL` と `KV_REST_API_TOKEN` が環境変数に追加される

### 5. デプロイ実行
1. 「Deploy」ボタンをクリック
2. ビルドプロセスを待機
3. デプロイ完了後、URLが表示される

## GitHub OAuthアプリ作成（認証機能用）

### GitHub OAuth設定
1. GitHub → Settings → Developer settings → OAuth Apps
2. 「New OAuth App」をクリック
3. 以下を入力：
   - **Application name**: LLM Evaluator
   - **Homepage URL**: `https://your-app-name.vercel.app`
   - **Authorization callback URL**: `https://your-app-name.vercel.app/api/auth/callback/github`
4. 作成後、Client IDとClient Secretを環境変数に設定

## ローカル開発環境設定

### .env.local作成
```bash
cp .env.example .env.local
```

### 環境変数設定
```env
NEXTAUTH_SECRET=your-local-secret
NEXTAUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## トラブルシューティング

### ビルドエラー
- TypeScriptエラー: `npm run lint` で構文チェック
- 依存関係エラー: `npm ci` で再インストール

### 認証エラー
- NEXTAUTH_SECRET が設定されているか確認
- GitHub OAuth設定のURL一致確認

### データベース接続エラー
- KV環境変数が正しく設定されているか確認
- Vercel KVが有効化されているか確認

## 継続的デプロイ
- mainブランチへのpushで自動デプロイ実行
- プレビューデプロイ：プルリクエスト作成時に自動生成