'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Evaluator } from '@/types';

export default function EvaluatorsPage() {
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvaluator, setEditingEvaluator] = useState<Evaluator | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    description: ''
  });

  useEffect(() => {
    fetchEvaluators();
  }, []);

  const fetchEvaluators = async () => {
    try {
      const response = await fetch('/api/evaluators');
      if (response.ok) {
        const data = await response.json();
        setEvaluators(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching evaluators:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingEvaluator 
        ? `/api/evaluators/${editingEvaluator.id}`
        : '/api/evaluators';
      
      const method = editingEvaluator ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchEvaluators();
        setFormData({
          name: '',
          organization: '',
          email: '',
          description: ''
        });
        setShowForm(false);
        setEditingEvaluator(null);
        alert(editingEvaluator ? '評価者を更新しました' : '評価者を追加しました');
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving evaluator:', error);
      alert('評価者の保存でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (evaluator: Evaluator) => {
    setFormData({
      name: evaluator.name,
      organization: evaluator.organization || '',
      email: evaluator.email || '',
      description: evaluator.description || ''
    });
    setEditingEvaluator(evaluator);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('この評価者を削除してもよろしいですか？')) {
      try {
        const response = await fetch(`/api/evaluators/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchEvaluators();
          alert('評価者を削除しました');
        } else {
          const error = await response.json();
          alert(`エラー: ${error.error}`);
        }
      } catch (error) {
        console.error('Error deleting evaluator:', error);
        alert('評価者の削除でエラーが発生しました');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      organization: '',
      email: '',
      description: ''
    });
    setShowForm(false);
    setEditingEvaluator(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold">評価者管理</h1>
          <p className="text-gray-600 mt-2">
            評価を実施する評価者の情報を管理します
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            新しい評価者を追加
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 border mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingEvaluator ? '評価者を編集' : '新しい評価者を追加'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  評価者名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 田中太郎"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所属組織
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 株式会社〇〇"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: tanaka@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="この評価者の詳細情報..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? '保存中...' : (editingEvaluator ? '更新' : '追加')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">評価者一覧</h2>
          </div>
          
          {evaluators.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              評価者が登録されていません
            </div>
          ) : (
            <div className="divide-y">
              {evaluators.map((evaluator) => (
                <div key={evaluator.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{evaluator.name}</h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {evaluator.organization && (
                          <div><span className="font-medium">所属:</span> {evaluator.organization}</div>
                        )}
                        {evaluator.email && (
                          <div><span className="font-medium">メール:</span> {evaluator.email}</div>
                        )}
                        {evaluator.description && (
                          <div><span className="font-medium">説明:</span> {evaluator.description}</div>
                        )}
                        <div><span className="font-medium">登録日:</span> {new Date(evaluator.createdAt).toLocaleDateString('ja-JP')}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(evaluator)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(evaluator.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}