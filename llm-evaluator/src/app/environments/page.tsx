'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EvaluationEnvironment } from '@/types';

export default function EnvironmentsPage() {
  const [environments, setEnvironments] = useState<EvaluationEnvironment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<EvaluationEnvironment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    processingSpec: '',
    executionApp: '',
    description: ''
  });

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const fetchEnvironments = async () => {
    try {
      const response = await fetch('/api/evaluation-environments');
      if (response.ok) {
        const data = await response.json();
        setEnvironments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingEnvironment 
        ? `/api/evaluation-environments/${editingEnvironment.id}`
        : '/api/evaluation-environments';
      
      const method = editingEnvironment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchEnvironments();
        setFormData({
          name: '',
          processingSpec: '',
          executionApp: '',
          description: ''
        });
        setShowForm(false);
        setEditingEnvironment(null);
        alert(editingEnvironment ? '評価環境を更新しました' : '評価環境を追加しました');
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving environment:', error);
      alert('評価環境の保存でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (environment: EvaluationEnvironment) => {
    setFormData({
      name: environment.name,
      processingSpec: environment.processingSpec,
      executionApp: environment.executionApp,
      description: environment.description || ''
    });
    setEditingEnvironment(environment);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('この評価環境を削除してもよろしいですか？')) {
      try {
        const response = await fetch(`/api/evaluation-environments/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchEnvironments();
          alert('評価環境を削除しました');
        } else {
          const error = await response.json();
          alert(`エラー: ${error.error}`);
        }
      } catch (error) {
        console.error('Error deleting environment:', error);
        alert('評価環境の削除でエラーが発生しました');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      processingSpec: '',
      executionApp: '',
      description: ''
    });
    setShowForm(false);
    setEditingEnvironment(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold">評価環境管理</h1>
          <p className="text-gray-600 mt-2">
            処理スペック、実行アプリをセットとした評価環境を管理します
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            新しい評価環境を追加
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 border mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingEnvironment ? '評価環境を編集' : '新しい評価環境を追加'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  環境名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 開発環境A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  処理スペック *
                </label>
                <input
                  type="text"
                  value={formData.processingSpec}
                  onChange={(e) => setFormData({ ...formData, processingSpec: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: CPU: Intel i7-12700K, GPU: RTX 3080, RAM: 32GB"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  実行アプリ *
                </label>
                <input
                  type="text"
                  value={formData.executionApp}
                  onChange={(e) => setFormData({ ...formData, executionApp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: Ollama v0.1.25"
                  required
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
                  placeholder="この評価環境の詳細説明..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? '保存中...' : (editingEnvironment ? '更新' : '追加')}
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
            <h2 className="text-xl font-semibold">評価環境一覧</h2>
          </div>
          
          {environments.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              評価環境が登録されていません
            </div>
          ) : (
            <div className="divide-y">
              {environments.map((environment) => (
                <div key={environment.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{environment.name}</h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div><span className="font-medium">処理スペック:</span> {environment.processingSpec}</div>
                        <div><span className="font-medium">実行アプリ:</span> {environment.executionApp}</div>
                        {environment.description && (
                          <div><span className="font-medium">説明:</span> {environment.description}</div>
                        )}
                        <div><span className="font-medium">作成日:</span> {new Date(environment.createdAt).toLocaleDateString('ja-JP')}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(environment)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(environment.id)}
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