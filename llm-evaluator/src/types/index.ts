export interface LLMModel {
  id: string;
  name: string;
  endpoint: string;
  apiKey?: string;
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
  overall: number;       // 総合 (1-5)
}

export interface Evaluation {
  id: string;
  questionId: string;
  modelId: string;
  response: string;
  scores: EvaluationScores;
  comment?: string;
  evaluatedAt: Date;
}

export interface EvaluationResult extends Evaluation {
  question: Question;
  model: LLMModel;
}