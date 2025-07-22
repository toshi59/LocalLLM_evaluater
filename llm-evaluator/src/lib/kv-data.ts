// Vercel KV対応のデータアクセス層
import { kv } from '@vercel/kv';
import { LLMModel, Question, Evaluation, EvaluatorConfig, EvaluationPrompt } from '@/types';

// KVデータアクセスヘルパー
async function getData<T>(key: string, fallback: T[] = []): Promise<T[]> {
  try {
    const data = await kv.get(key);
    return data || fallback;
  } catch (error) {
    console.error(`Error reading from KV (${key}):`, error);
    return fallback;
  }
}

async function setData<T>(key: string, data: T[]): Promise<void> {
  try {
    await kv.set(key, data);
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