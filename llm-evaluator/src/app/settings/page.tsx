'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EvaluatorConfig, EvaluationPrompt } from '@/types';

export default function SettingsPage() {
  const [config, setConfig] = useState<EvaluatorConfig | null>(null);
  const [prompts, setPrompts] = useState<EvaluationPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<EvaluationPrompt | null>(null);
  const [showNewPromptForm, setShowNewPromptForm] = useState(false);

  // フォーム状態
  const [configForm, setConfigForm] = useState({
    endpoint: '',
    apiKey: '',
    model: 'gpt-4o'
  });

  const [promptForm, setPromptForm] = useState({
    name: '',
    prompt: '',
    description: ''
  });

  useEffect(() => {
    fetchConfig();
    fetchPrompts();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/evaluator/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        if (data) {
          setConfigForm({
            endpoint: data.endpoint || '',
            apiKey: data.apiKey || '',
            model: data.model || 'gpt-4o'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/evaluator/prompts');
      if (response.ok) {
        const data = await response.json();
        setPrompts(data);
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const handleConfigSave = async () => {
    if (!configForm.endpoint || !configForm.apiKey) {
      alert('エンドポイントとAPIキーは必須です');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/evaluator/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configForm),
      });

      if (response.ok) {
        const updatedConfig = await response.json();
        setConfig(updatedConfig);
        alert('設定を保存しました');
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('設定の保存でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSave = async () => {
    if (!promptForm.name || !promptForm.prompt) {
      alert('名前とプロンプトは必須です');
      return;
    }

    setIsLoading(true);
    try {
      const url = editingPrompt 
        ? `/api/evaluator/prompts/${editingPrompt.id}`
        : '/api/evaluator/prompts';
      
      const method = editingPrompt ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptForm),
      });

      if (response.ok) {
        await fetchPrompts();
        setPromptForm({ name: '', prompt: '', description: '' });
        setEditingPrompt(null);
        setShowNewPromptForm(false);
        alert(editingPrompt ? 'プロンプトを更新しました' : 'プロンプトを作成しました');
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('プロンプトの保存でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptDelete = async (id: string) => {
    if (!confirm('このプロンプトを削除しますか？')) return;

    try {
      const response = await fetch(`/api/evaluator/prompts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPrompts();
        alert('プロンプトを削除しました');
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('プロンプトの削除でエラーが発生しました');
    }
  };

  const startEditPrompt = (prompt: EvaluationPrompt) => {
    setEditingPrompt(prompt);
    setPromptForm({
      name: prompt.name,
      prompt: prompt.prompt,
      description: prompt.description || ''
    });
    setShowNewPromptForm(true);
  };

  const cancelEdit = () => {
    setEditingPrompt(null);
    setPromptForm({ name: '', prompt: '', description: '' });
    setShowNewPromptForm(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold">設定</h1>
        </div>

        {/* 評価LLM設定 */}
        <div className="bg-white rounded-lg shadow-md p-6 border mb-8">
          <h2 className="text-xl font-semibold mb-6">評価LLM設定 (GPT-4o)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                エンドポイント
              </label>
              <input
                type="url"
                value={configForm.endpoint}
                onChange={(e) => setConfigForm({ ...configForm, endpoint: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.openai.com/v1/chat/completions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                APIキー
              </label>
              <input
                type="password"
                value={configForm.apiKey}
                onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sk-..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                モデル
              </label>
              <select
                value={configForm.model}
                onChange={(e) => setConfigForm({ ...configForm, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4-turbo">gpt-4-turbo</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleConfigSave}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </div>

        {/* 評価プロンプト管理 */}
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">評価プロンプト管理</h2>
            <button
              onClick={() => setShowNewPromptForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              新規プロンプト作成
            </button>
          </div>

          {/* プロンプト作成・編集フォーム */}
          {showNewPromptForm && (
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-medium mb-4">
                {editingPrompt ? 'プロンプト編集' : '新規プロンプト作成'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名前
                  </label>
                  <input
                    type="text"
                    value={promptForm.name}
                    onChange={(e) => setPromptForm({ ...promptForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="プロンプトの名前"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明（オプション）
                  </label>
                  <input
                    type="text"
                    value={promptForm.description}
                    onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="プロンプトの説明"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プロンプト内容
                  </label>
                  <div className="text-sm text-gray-600 mb-2">
                    使用可能なプレースホルダー: {'{question}'}, {'{response}'}
                  </div>
                  <textarea
                    value={promptForm.prompt}
                    onChange={(e) => setPromptForm({ ...promptForm, prompt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={15}
                    placeholder="評価プロンプトを入力..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handlePromptSave}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '保存中...' : (editingPrompt ? '更新' : '作成')}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* プロンプト一覧 */}
          <div className="space-y-4">
            {prompts.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                まだプロンプトが登録されていません。
              </div>
            ) : (
              prompts.map((prompt) => (
                <div key={prompt.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium">{prompt.name}</h3>
                      {prompt.description && (
                        <p className="text-gray-600 text-sm">{prompt.description}</p>
                      )}
                      <p className="text-gray-500 text-xs">
                        作成日: {new Date(prompt.createdAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditPrompt(prompt)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handlePromptDelete(prompt.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {prompt.prompt}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}