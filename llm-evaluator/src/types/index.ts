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

export interface Evaluation {
  id: string;
  questionId: string;
  modelId: string;
  response: string;
  scores: EvaluationScores;
  comments: EvaluationComments;
  evaluatedAt: Date;
}

export interface EvaluationResult extends Evaluation {
  question: Question;
  model: LLMModel;
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