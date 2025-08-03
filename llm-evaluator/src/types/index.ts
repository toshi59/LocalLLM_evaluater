export interface LLMModel {
  id: string;
  name: string;
  endpoint?: string;
  apiKey?: string;
  size?: string;
  description?: string;
  createdAt: Date;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt: Date;
}

export interface EvaluationScores {
  accuracy: number;      // 正確性 (1-5)
  completeness: number;  // 網羅性 (1-5)
  logic: number;         // 論理構成 (1-5)
  japanese: number;      // 日本語 (1-5)
  overall: number;       // 総合 (1-5) - 他4項目の平均値
}

export interface EvaluationComments {
  accuracy?: string;      // 正確性のコメント
  completeness?: string;  // 網羅性のコメント
  logic?: string;         // 論理構成のコメント
  japanese?: string;      // 日本語のコメント
  overall?: string;       // 総合のコメント
}

export interface EvaluationEnvironment {
  id: string;
  name: string;
  processingSpec: string;      // 処理スペック（CPU、GPU、RAM等）
  executionApp: string;        // 実行アプリ（Ollama、LM Studio等）
  description?: string;        // 環境の説明
  createdAt: Date;
}

export interface Evaluation {
  id: string;
  questionId: string;
  modelId: string;
  response: string;
  scores: EvaluationScores;
  comments: EvaluationComments;
  environmentId?: string;      // 評価環境ID
  evaluator?: string;          // 評価者名
  processingTime?: number;     // 処理時間（秒）
  evaluatedAt: Date;
}

export interface EvaluationResult extends Evaluation {
  question: Question;
  model: LLMModel;
  environment?: EvaluationEnvironment;
}

export interface EvaluatorConfig {
  id: string;
  name: string;
  endpoint?: string;
  apiKey?: string;
  model?: string;
  createdAt: Date;
}

export interface EvaluationPrompt {
  id: string;
  name: string;
  prompt: string;
  description?: string;
  createdAt: Date;
}

export interface Evaluator {
  id: string;
  name: string;
  organization?: string;
  email?: string;
  description?: string;
  createdAt: Date;
}