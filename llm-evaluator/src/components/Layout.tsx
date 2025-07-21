'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { href: '/', label: 'ホーム', icon: '🏠' },
  { href: '/models', label: 'LLMモデル管理', icon: '🤖' },
  { href: '/questions', label: '質問管理', icon: '❓' },
  { href: '/evaluation', label: '評価実行', icon: '📝' },
  { href: '/results', label: '評価結果', icon: '📊' },
  { href: '/analytics', label: '統計・分析', icon: '📈' },
  { href: '/settings', label: '設定', icon: '⚙️' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* サイドメニュー（常に表示） */}
      <div className="w-64 bg-white shadow-lg flex-shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-8">LLM評価システム</h1>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-x-auto">
        {children}
      </div>
    </div>
  );
}