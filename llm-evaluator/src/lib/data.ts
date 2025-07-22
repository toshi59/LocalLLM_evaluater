import fs from 'fs';
import path from 'path';
import { LLMModel, Question, Evaluation, EvaluatorConfig, EvaluationPrompt } from '@/types';

// Vercel KVのインポート（本番環境のみ）
let kv: any = null;
if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL) {
  try {
    kv = require('@vercel/kv').kv;
  } catch (error) {
    console.warn('Vercel KV not available:', error);
  }
}

const DATA_DIR = path.join(process.cwd(), 'data');
const MODELS_FILE = path.join(DATA_DIR, 'models.json');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const EVALUATIONS_FILE = path.join(DATA_DIR, 'evaluations.json');
const EVALUATOR_CONFIG_FILE = path.join(DATA_DIR, 'evaluator-config.json');
const EVALUATION_PROMPTS_FILE = path.join(DATA_DIR, 'evaluation-prompts.json');

// データストレージのヘルパー関数
async function getData<T>(key: string, fallback: T[] = []): Promise<T[]> {
  if (kv) {
    try {
      const data = await kv.get(key);
      return data || fallback;
    } catch (error) {
      console.error(`Error reading from KV (${key}):`, error);
      return fallback;
    }
  } else {
    // ローカル環境：JSONファイル
    const filePath = getFilePath(key);
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  }
}

async function setData<T>(key: string, data: T[]): Promise<void> {
  if (kv) {
    try {
      await kv.set(key, data);
    } catch (error) {
      console.error(`Error writing to KV (${key}):`, error);
      throw error;
    }
  } else {
    // ローカル環境：JSONファイル
    const filePath = getFilePath(key);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

function getFilePath(key: string): string {
  const fileMap: { [key: string]: string } = {
    'models': MODELS_FILE,
    'questions': QUESTIONS_FILE,
    'evaluations': EVALUATIONS_FILE,
    'evaluator-config': EVALUATOR_CONFIG_FILE,
    'evaluation-prompts': EVALUATION_PROMPTS_FILE
  };
  return fileMap[key] || path.join(DATA_DIR, `${key}.json`);
}

// データディレクトリとファイルを初期化
function initializeData() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(MODELS_FILE)) {
    fs.writeFileSync(MODELS_FILE, JSON.stringify([], null, 2));
  }
  
  if (!fs.existsSync(QUESTIONS_FILE)) {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify([], null, 2));
  }
  
  if (!fs.existsSync(EVALUATIONS_FILE)) {
    fs.writeFileSync(EVALUATIONS_FILE, JSON.stringify([], null, 2));
  }
}

// JSONファイルを読み込み
function readJsonFile<T>(filePath: string): T[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// JSONファイルに書き込み
function writeJsonFile<T>(filePath: string, data: T[]): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// LLMモデル管理
export const modelService = {
  getAll: async (): Promise<LLMModel[]> => {
    if (!kv) initializeData();
    return await getData<LLMModel>('models');
  },
  
  getById: async (id: string): Promise<LLMModel | null> => {
    const models = await modelService.getAll();
    return models.find(model => model.id === id) || null;
  },
  
  create: async (model: Omit<LLMModel, 'id' | 'createdAt'>): Promise<LLMModel> => {
    const models = await modelService.getAll();
    const newModel: LLMModel = {
      ...model,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    models.push(newModel);
    await setData('models', models);
    return newModel;
  },
  
  update: async (id: string, updates: Partial<Omit<LLMModel, 'id' | 'createdAt'>>): Promise<LLMModel | null> => {
    const models = await modelService.getAll();
    const index = models.findIndex(model => model.id === id);
    if (index === -1) return null;
    
    models[index] = { ...models[index], ...updates };
    await setData('models', models);
    return models[index];
  },
  
  delete: async (id: string): Promise<boolean> => {
    const models = await modelService.getAll();
    const index = models.findIndex(model => model.id === id);
    if (index === -1) return false;
    
    models.splice(index, 1);
    await setData('models', models);
    return true;
  }
};

// 質問管理
export const questionService = {
  getAll: (): Question[] => {
    initializeData();
    return readJsonFile<Question>(QUESTIONS_FILE);
  },
  
  getById: (id: string): Question | null => {
    const questions = questionService.getAll();
    return questions.find(question => question.id === id) || null;
  },
  
  create: (question: Omit<Question, 'id' | 'createdAt'>): Question => {
    const questions = questionService.getAll();
    const newQuestion: Question = {
      ...question,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    questions.push(newQuestion);
    writeJsonFile(QUESTIONS_FILE, questions);
    return newQuestion;
  },
  
  update: (id: string, updates: Partial<Omit<Question, 'id' | 'createdAt'>>): Question | null => {
    const questions = questionService.getAll();
    const index = questions.findIndex(question => question.id === id);
    if (index === -1) return null;
    
    questions[index] = { ...questions[index], ...updates };
    writeJsonFile(QUESTIONS_FILE, questions);
    return questions[index];
  },
  
  delete: (id: string): boolean => {
    const questions = questionService.getAll();
    const index = questions.findIndex(question => question.id === id);
    if (index === -1) return false;
    
    questions.splice(index, 1);
    writeJsonFile(QUESTIONS_FILE, questions);
    return true;
  }
};

// 評価管理
export const evaluationService = {
  getAll: (): Evaluation[] => {
    initializeData();
    return readJsonFile<Evaluation>(EVALUATIONS_FILE);
  },
  
  getById: (id: string): Evaluation | null => {
    const evaluations = evaluationService.getAll();
    return evaluations.find(evaluation => evaluation.id === id) || null;
  },
  
  getByQuestion: (questionId: string): Evaluation[] => {
    const evaluations = evaluationService.getAll();
    return evaluations.filter(evaluation => evaluation.questionId === questionId);
  },
  
  getByModel: (modelId: string): Evaluation[] => {
    const evaluations = evaluationService.getAll();
    return evaluations.filter(evaluation => evaluation.modelId === modelId);
  },
  
  create: (evaluation: Omit<Evaluation, 'id' | 'evaluatedAt'>): Evaluation => {
    const evaluations = evaluationService.getAll();
    const newEvaluation: Evaluation = {
      ...evaluation,
      id: Date.now().toString(),
      evaluatedAt: new Date(),
    };
    evaluations.push(newEvaluation);
    writeJsonFile(EVALUATIONS_FILE, evaluations);
    return newEvaluation;
  },
  
  update: (id: string, updates: Partial<Omit<Evaluation, 'id' | 'evaluatedAt'>>): Evaluation | null => {
    const evaluations = evaluationService.getAll();
    const index = evaluations.findIndex(evaluation => evaluation.id === id);
    if (index === -1) return null;
    
    evaluations[index] = { ...evaluations[index], ...updates };
    writeJsonFile(EVALUATIONS_FILE, evaluations);
    return evaluations[index];
  },
  
  delete: (id: string): boolean => {
    const evaluations = evaluationService.getAll();
    const index = evaluations.findIndex(evaluation => evaluation.id === id);
    if (index === -1) return false;
    
    evaluations.splice(index, 1);
    writeJsonFile(EVALUATIONS_FILE, evaluations);
    return true;
  }
};

// 評価設定管理
export const evaluatorConfigService = {
  get: (): EvaluatorConfig | null => {
    initializeData();
    try {
      const data = fs.readFileSync(EVALUATOR_CONFIG_FILE, 'utf-8');
      const config = JSON.parse(data);
      
      // 本番環境では環境変数からAPIキーを取得
      if (process.env.OPENAI_API_KEY && !config.apiKey) {
        config.apiKey = process.env.OPENAI_API_KEY;
      }
      
      return config;
    } catch {
      return null;
    }
  },
  
  update: (config: Partial<Omit<EvaluatorConfig, 'id' | 'createdAt'>>): EvaluatorConfig => {
    const existing = evaluatorConfigService.get();
    const updatedConfig: EvaluatorConfig = {
      id: existing?.id || 'openai-gpt4o',
      name: existing?.name || 'OpenAI GPT-4o',
      createdAt: existing?.createdAt || new Date(),
      ...config,
    };
    fs.writeFileSync(EVALUATOR_CONFIG_FILE, JSON.stringify(updatedConfig, null, 2));
    return updatedConfig;
  }
};

// 評価プロンプト管理
export const evaluationPromptService = {
  getAll: (): EvaluationPrompt[] => {
    initializeData();
    return readJsonFile<EvaluationPrompt>(EVALUATION_PROMPTS_FILE);
  },
  
  getById: (id: string): EvaluationPrompt | null => {
    const prompts = evaluationPromptService.getAll();
    return prompts.find(prompt => prompt.id === id) || null;
  },
  
  create: (prompt: Omit<EvaluationPrompt, 'id' | 'createdAt'>): EvaluationPrompt => {
    const prompts = evaluationPromptService.getAll();
    const newPrompt: EvaluationPrompt = {
      ...prompt,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    prompts.push(newPrompt);
    writeJsonFile(EVALUATION_PROMPTS_FILE, prompts);
    return newPrompt;
  },
  
  update: (id: string, updates: Partial<Omit<EvaluationPrompt, 'id' | 'createdAt'>>): EvaluationPrompt | null => {
    const prompts = evaluationPromptService.getAll();
    const index = prompts.findIndex(prompt => prompt.id === id);
    if (index === -1) return null;
    
    prompts[index] = { ...prompts[index], ...updates };
    writeJsonFile(EVALUATION_PROMPTS_FILE, prompts);
    return prompts[index];
  },
  
  delete: (id: string): boolean => {
    const prompts = evaluationPromptService.getAll();
    const index = prompts.findIndex(prompt => prompt.id === id);
    if (index === -1) return false;
    
    prompts.splice(index, 1);
    writeJsonFile(EVALUATION_PROMPTS_FILE, prompts);
    return true;
  }
};