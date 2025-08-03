import fs from 'fs';
import path from 'path';
import { LLMModel, Question, Evaluation, EvaluatorConfig, EvaluationPrompt, EvaluationEnvironment, Evaluator } from '@/types';

// Vercel KVのインポート（本番環境のみ）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let kv: any = null;
if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
const EVALUATION_ENVIRONMENTS_FILE = path.join(DATA_DIR, 'evaluation-environments.json');
const EVALUATORS_FILE = path.join(DATA_DIR, 'evaluators.json');

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
    'evaluation-prompts': EVALUATION_PROMPTS_FILE,
    'evaluation-environments': EVALUATION_ENVIRONMENTS_FILE,
    'evaluators': EVALUATORS_FILE
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
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    models.unshift(newModel); // 先頭に追加
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
  getAll: async (): Promise<Question[]> => {
    if (!kv) initializeData();
    return await getData<Question>('questions');
  },
  
  getById: async (id: string): Promise<Question | null> => {
    const questions = await questionService.getAll();
    return questions.find(question => question.id === id) || null;
  },
  
  create: async (question: Omit<Question, 'id' | 'createdAt'>): Promise<Question> => {
    const questions = await questionService.getAll();
    const newQuestion: Question = {
      ...question,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    questions.unshift(newQuestion); // 先頭に追加
    await setData('questions', questions);
    return newQuestion;
  },
  
  update: async (id: string, updates: Partial<Omit<Question, 'id' | 'createdAt'>>): Promise<Question | null> => {
    const questions = await questionService.getAll();
    const index = questions.findIndex(question => question.id === id);
    if (index === -1) return null;
    
    questions[index] = { ...questions[index], ...updates };
    await setData('questions', questions);
    return questions[index];
  },
  
  delete: async (id: string): Promise<boolean> => {
    const questions = await questionService.getAll();
    const index = questions.findIndex(question => question.id === id);
    if (index === -1) return false;
    
    questions.splice(index, 1);
    await setData('questions', questions);
    return true;
  }
};

// 評価管理
export const evaluationService = {
  getAll: async (): Promise<Evaluation[]> => {
    if (!kv) initializeData();
    return await getData<Evaluation>('evaluations');
  },
  
  getById: async (id: string): Promise<Evaluation | null> => {
    const evaluations = await evaluationService.getAll();
    return evaluations.find(evaluation => evaluation.id === id) || null;
  },
  
  getByQuestion: async (questionId: string): Promise<Evaluation[]> => {
    const evaluations = await evaluationService.getAll();
    return evaluations.filter(evaluation => evaluation.questionId === questionId);
  },
  
  getByModel: async (modelId: string): Promise<Evaluation[]> => {
    const evaluations = await evaluationService.getAll();
    return evaluations.filter(evaluation => evaluation.modelId === modelId);
  },
  
  create: async (evaluation: Omit<Evaluation, 'id' | 'evaluatedAt'>): Promise<Evaluation> => {
    const evaluations = await evaluationService.getAll();
    const newEvaluation: Evaluation = {
      ...evaluation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      evaluatedAt: new Date(),
    };
    evaluations.unshift(newEvaluation); // 先頭に追加
    await setData('evaluations', evaluations);
    return newEvaluation;
  },
  
  update: async (id: string, updates: Partial<Omit<Evaluation, 'id' | 'evaluatedAt'>>): Promise<Evaluation | null> => {
    const evaluations = await evaluationService.getAll();
    const index = evaluations.findIndex(evaluation => evaluation.id === id);
    if (index === -1) return null;
    
    evaluations[index] = { ...evaluations[index], ...updates };
    await setData('evaluations', evaluations);
    return evaluations[index];
  },
  
  delete: async (id: string): Promise<boolean> => {
    const evaluations = await evaluationService.getAll();
    const index = evaluations.findIndex(evaluation => evaluation.id === id);
    if (index === -1) return false;
    
    evaluations.splice(index, 1);
    await setData('evaluations', evaluations);
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
  getAll: async (): Promise<EvaluationPrompt[]> => {
    if (!kv) initializeData();
    return await getData<EvaluationPrompt>('evaluation-prompts');
  },
  
  getById: async (id: string): Promise<EvaluationPrompt | null> => {
    const prompts = await evaluationPromptService.getAll();
    return prompts.find(prompt => prompt.id === id) || null;
  },
  
  create: async (prompt: Omit<EvaluationPrompt, 'id' | 'createdAt'>): Promise<EvaluationPrompt> => {
    const prompts = await evaluationPromptService.getAll();
    const newPrompt: EvaluationPrompt = {
      ...prompt,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    prompts.unshift(newPrompt); // 先頭に追加
    await setData('evaluation-prompts', prompts);
    return newPrompt;
  },
  
  update: async (id: string, updates: Partial<Omit<EvaluationPrompt, 'id' | 'createdAt'>>): Promise<EvaluationPrompt | null> => {
    const prompts = await evaluationPromptService.getAll();
    const index = prompts.findIndex(prompt => prompt.id === id);
    if (index === -1) return null;
    
    prompts[index] = { ...prompts[index], ...updates };
    await setData('evaluation-prompts', prompts);
    return prompts[index];
  },
  
  delete: async (id: string): Promise<boolean> => {
    const prompts = await evaluationPromptService.getAll();
    const index = prompts.findIndex(prompt => prompt.id === id);
    if (index === -1) return false;
    
    prompts.splice(index, 1);
    await setData('evaluation-prompts', prompts);
    return true;
  }
};

// 評価者管理
export const evaluatorService = {
  getAll: async (): Promise<Evaluator[]> => {
    if (!kv) initializeData();
    return await getData<Evaluator>('evaluators');
  },
  
  getById: async (id: string): Promise<Evaluator | null> => {
    const evaluators = await evaluatorService.getAll();
    return evaluators.find(evaluator => evaluator.id === id) || null;
  },
  
  create: async (evaluator: Omit<Evaluator, 'id' | 'createdAt'>): Promise<Evaluator> => {
    const evaluators = await evaluatorService.getAll();
    const newEvaluator: Evaluator = {
      ...evaluator,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    evaluators.unshift(newEvaluator); // 先頭に追加
    await setData('evaluators', evaluators);
    return newEvaluator;
  },
  
  update: async (id: string, updates: Partial<Omit<Evaluator, 'id' | 'createdAt'>>): Promise<Evaluator | null> => {
    const evaluators = await evaluatorService.getAll();
    const index = evaluators.findIndex(evaluator => evaluator.id === id);
    if (index === -1) return null;
    
    evaluators[index] = { ...evaluators[index], ...updates };
    await setData('evaluators', evaluators);
    return evaluators[index];
  },
  
  delete: async (id: string): Promise<boolean> => {
    const evaluators = await evaluatorService.getAll();
    const index = evaluators.findIndex(evaluator => evaluator.id === id);
    if (index === -1) return false;
    
    evaluators.splice(index, 1);
    await setData('evaluators', evaluators);
    return true;
  }
};

// 評価環境管理
export const evaluationEnvironmentService = {
  getAll: async (): Promise<EvaluationEnvironment[]> => {
    if (!kv) initializeData();
    return await getData<EvaluationEnvironment>('evaluation-environments');
  },
  
  getById: async (id: string): Promise<EvaluationEnvironment | null> => {
    const environments = await evaluationEnvironmentService.getAll();
    return environments.find(env => env.id === id) || null;
  },
  
  create: async (environment: Omit<EvaluationEnvironment, 'id' | 'createdAt'>): Promise<EvaluationEnvironment> => {
    const environments = await evaluationEnvironmentService.getAll();
    const newEnvironment: EvaluationEnvironment = {
      ...environment,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    environments.unshift(newEnvironment); // 先頭に追加
    await setData('evaluation-environments', environments);
    return newEnvironment;
  },
  
  update: async (id: string, updates: Partial<Omit<EvaluationEnvironment, 'id' | 'createdAt'>>): Promise<EvaluationEnvironment | null> => {
    const environments = await evaluationEnvironmentService.getAll();
    const index = environments.findIndex(env => env.id === id);
    if (index === -1) return null;
    
    environments[index] = { ...environments[index], ...updates };
    await setData('evaluation-environments', environments);
    return environments[index];
  },
  
  delete: async (id: string): Promise<boolean> => {
    const environments = await evaluationEnvironmentService.getAll();
    const index = environments.findIndex(env => env.id === id);
    if (index === -1) return false;
    
    environments.splice(index, 1);
    await setData('evaluation-environments', environments);
    return true;
  }
};