#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🚀 LLM Evaluator - 環境変数自動生成ツール\n');

// ランダムシークレット生成
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, length);
}

// プロジェクト名入力プロンプト
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Vercelプロジェクト名を入力してください (例: llm-evaluator): ', (projectName) => {
  const cleanProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  console.log(`\n✅ プロジェクト名: ${cleanProjectName}`);
  
  // 環境変数生成
  const envVars = {
    NEXTAUTH_SECRET: generateSecret(32),
    NEXTAUTH_URL: `https://${cleanProjectName}.vercel.app`,
    // オプション: GitHub認証用（後で設定可能）
    // GITHUB_CLIENT_ID: 'your-github-client-id-here',
    // GITHUB_CLIENT_SECRET: 'your-github-client-secret-here'
  };

  console.log('\n📋 Vercelで設定する環境変数:');
  console.log('=' .repeat(50));
  
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });

  console.log('\n📝 .env.local ファイル (ローカル開発用):');
  console.log('=' .repeat(50));
  
  const localEnvContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${key === 'NEXTAUTH_URL' ? 'http://localhost:3000' : value}`)
    .join('\n') + '\n';
    
  console.log(localEnvContent);

  // .env.localファイル作成
  const envLocalPath = path.join(__dirname, 'llm-evaluator', '.env.local');
  
  rl.question('\n.env.localファイルを自動作成しますか？ (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      try {
        fs.writeFileSync(envLocalPath, localEnvContent);
        console.log(`✅ .env.localファイルを作成しました: ${envLocalPath}`);
      } catch (error) {
        console.log(`❌ ファイル作成エラー: ${error.message}`);
      }
    }

    console.log('\n🔧 Vercelでの設定手順:');
    console.log('1. vercel.com → New Project → LocalLLM_evaluater');
    console.log('2. Root Directory: llm-evaluator');
    console.log('3. Environment Variables で上記の値をコピー&ペースト');
    console.log('4. Storage → Create Database → KV でデータベース作成');
    console.log('5. Deploy をクリック');
    
    console.log('\n📚 詳細手順: DEPLOYMENT.md ファイルを参照');
    
    rl.close();
  });
});