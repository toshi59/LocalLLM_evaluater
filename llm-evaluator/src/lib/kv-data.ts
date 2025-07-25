// Vercel KV対応のデータアクセス層
import { LLMModel, Question, Evaluation, EvaluatorConfig, EvaluationPrompt } from '@/types';

// KVクライアントの動的インポート
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let kv: any = null;
async function getKV() {
  if (!kv) {
    try {
      const kvModule = await import('@vercel/kv');
      kv = kvModule.kv;
    } catch (error) {
      console.error('Failed to import @vercel/kv:', error);
      throw new Error('KV client not available');
    }
  }
  return kv;
}

// KVデータアクセスヘルパー
async function getData<T>(key: string, fallback: T[] = []): Promise<T[]> {
  try {
    const kvClient = await getKV();
    const data = await kvClient.get(key);
    return data || fallback;
  } catch (error) {
    console.error(`Error reading from KV (${key}):`, error);
    return fallback;
  }
}

async function setData<T>(key: string, data: T[]): Promise<void> {
  try {
    const kvClient = await getKV();
    await kvClient.set(key, data);
  } catch (error) {
    console.error(`Error writing to KV (${key}):`, error);
    throw error;
  }
}

// モデルサービス
export const kvModelService = {
  getAll: async (): Promise<LLMModel[]> => {
    return await getData<LLMModel>('models');
  },
  
  getById: async (id: string): Promise<LLMModel | null> => {
    const models = await kvModelService.getAll();
    return models.find(model => model.id === id) || null;
  },
  
  create: async (model: Omit<LLMModel, 'id' | 'createdAt'>): Promise<LLMModel> => {
    const models = await kvModelService.getAll();
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
    const models = await kvModelService.getAll();
    const index = models.findIndex(model => model.id === id);
    if (index === -1) return null;
    
    models[index] = { ...models[index], ...updates };
    await setData('models', models);
    return models[index];
  },
  
  delete: async (id: string): Promise<boolean> => {
    const models = await kvModelService.getAll();
    const index = models.findIndex(model => model.id === id);
    if (index === -1) return false;
    
    models.splice(index, 1);
    await setData('models', models);
    return true;
  }
};

// 質問サービス
export const kvQuestionService = {
  getAll: async (): Promise<Question[]> => {
    return await getData<Question>('questions');
  },
  
  getById: async (id: string): Promise<Question | null> => {
    const questions = await kvQuestionService.getAll();
    return questions.find(q => q.id === id) || null;
  },
  
  create: async (question: Omit<Question, 'id' | 'createdAt'>): Promise<Question> => {
    const questions = await kvQuestionService.getAll();
    const newQuestion: Question = {
      ...question,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    questions.push(newQuestion);
    await setData('questions', questions);
    return newQuestion;
  },
  
  update: async (id: string, updates: Partial<Omit<Question, 'id' | 'createdAt'>>): Promise<Question | null> => {
    const questions = await kvQuestionService.getAll();
    const index = questions.findIndex(q => q.id === id);
    if (index === -1) return null;
    
    questions[index] = { ...questions[index], ...updates };
    await setData('questions', questions);
    return questions[index];
  },
  
  delete: async (id: string): Promise<boolean> => {
    const questions = await kvQuestionService.getAll();
    const index = questions.findIndex(q => q.id === id);
    if (index === -1) return false;
    
    questions.splice(index, 1);
    await setData('questions', questions);
    return true;
  }
};

// 評価サービス
export const kvEvaluationService = {
  getAll: async (): Promise<Evaluation[]> => {
    return await getData<Evaluation>('evaluations');
  },
  
  getById: async (id: string): Promise<Evaluation | null> => {
    const evaluations = await kvEvaluationService.getAll();
    return evaluations.find(e => e.id === id) || null;
  },
  
  create: async (evaluation: Omit<Evaluation, 'id'>): Promise<Evaluation> => {
    const evaluations = await kvEvaluationService.getAll();
    const newEvaluation: Evaluation = {
      ...evaluation,
      id: Date.now().toString(),
    };
    evaluations.push(newEvaluation);
    await setData('evaluations', evaluations);
    return newEvaluation;
  },
  
  delete: async (id: string): Promise<boolean> => {
    const evaluations = await kvEvaluationService.getAll();
    const index = evaluations.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    evaluations.splice(index, 1);
    await setData('evaluations', evaluations);
    return true;
  }
};

// 評価設定サービス
export const kvEvaluatorConfigService = {
  get: async (): Promise<EvaluatorConfig | null> => {
    try {
      const kvClient = await getKV();
      const config = await kvClient.get('evaluator-config');
      
      // 本番環境では環境変数からAPIキーを取得
      if (config && process.env.OPENAI_API_KEY && !config.apiKey) {
        config.apiKey = process.env.OPENAI_API_KEY;
      }
      
      return config;
    } catch (error) {
      console.error('Error reading evaluator config from KV:', error);
      return null;
    }
  },
  
  update: async (updates: Partial<Omit<EvaluatorConfig, 'id' | 'createdAt'>>): Promise<EvaluatorConfig> => {
    const existing = await kvEvaluatorConfigService.get();
    const updatedConfig: EvaluatorConfig = {
      id: existing?.id || 'openai-gpt4o',
      name: existing?.name || 'OpenAI GPT-4o',
      createdAt: existing?.createdAt || new Date(),
      ...updates,
    };
    
    try {
      const kvClient = await getKV();
      await kvClient.set('evaluator-config', updatedConfig);
      return updatedConfig;
    } catch (error) {
      console.error('Error updating evaluator config in KV:', error);
      throw error;
    }
  }
};

// 評価プロンプトサービス
export const kvEvaluationPromptService = {
  getAll: async (): Promise<EvaluationPrompt[]> => {
    return await getData<EvaluationPrompt>('evaluation-prompts');
  },
  
  getById: async (id: string): Promise<EvaluationPrompt | null> => {
    const prompts = await kvEvaluationPromptService.getAll();
    return prompts.find(prompt => prompt.id === id) || null;
  },
  
  create: async (prompt: Omit<EvaluationPrompt, 'id' | 'createdAt'>): Promise<EvaluationPrompt> => {
    const prompts = await kvEvaluationPromptService.getAll();
    const newPrompt: EvaluationPrompt = {
      ...prompt,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    prompts.push(newPrompt);
    await setData('evaluation-prompts', prompts);
    return newPrompt;
  },
  
  update: async (id: string, updates: Partial<Omit<EvaluationPrompt, 'id' | 'createdAt'>>): Promise<EvaluationPrompt | null> => {
    const prompts = await kvEvaluationPromptService.getAll();
    const index = prompts.findIndex(prompt => prompt.id === id);
    if (index === -1) return null;
    
    prompts[index] = { ...prompts[index], ...updates };
    await setData('evaluation-prompts', prompts);
    return prompts[index];
  },
  
  delete: async (id: string): Promise<boolean> => {
    const prompts = await kvEvaluationPromptService.getAll();
    const index = prompts.findIndex(prompt => prompt.id === id);
    if (index === -1) return false;
    
    prompts.splice(index, 1);
    await setData('evaluation-prompts', prompts);
    return true;
  }
};