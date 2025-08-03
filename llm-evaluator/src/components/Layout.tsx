'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface MenuItem {
  href?: string;
  label: string;
  icon: string;
  subItems?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { href: '/', label: 'ホーム', icon: '🏠' },
  {
    label: '各種管理',
    icon: '📋',
    subItems: [
      { href: '/models', label: 'LLMモデル', icon: '🤖' },
      { href: '/questions', label: '質問', icon: '❓' },
      { href: '/environments', label: '評価環境', icon: '🏗️' },
      { href: '/evaluators', label: '評価者', icon: '👥' },
    ],
  },
  { href: '/evaluation', label: '評価登録', icon: '📝' },
  {
    label: '結果確認',
    icon: '📊',
    subItems: [
      { href: '/results', label: '評価結果', icon: '📈' },
      { href: '/analytics', label: '統計・分析', icon: '📉' },
    ],
  },
  { href: '/settings', label: '設定', icon: '⚙️' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSection = (sectionLabel: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionLabel)) {
        newSet.delete(sectionLabel);
      } else {
        newSet.add(sectionLabel);
      }
      return newSet;
    });
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const isActiveSection = (item: MenuItem): boolean => {
    if (item.href && pathname === item.href) return true;
    if (item.subItems) {
      return item.subItems.some(subItem => subItem.href === pathname);
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* サイドメニュー */}
      <div className={`${sidebarVisible ? 'w-64' : 'w-16'} bg-white shadow-lg flex-shrink-0 transition-all duration-300`}>
        <div className={`${sidebarVisible ? 'p-6' : 'p-3'} transition-all duration-300`}>
          {sidebarVisible ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-xl font-bold text-gray-800">LLM評価システム</h1>
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="サイドメニューを最小化"
                >
                  <span className="text-lg">◀</span>
                </button>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg">
                    {item.href ? (
                      // 単一項目（ホーム、設定）
                      <Link
                        href={item.href}
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors font-bold ${
                          pathname === item.href
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.label}
                      </Link>
                    ) : (
                      // 階層項目
                      <div>
                        <button
                          onClick={() => toggleSection(item.label)}
                          className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors font-bold ${
                            isActiveSection(item)
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="mr-3 text-lg">{item.icon}</span>
                            {item.label}
                          </div>
                          <div className={`w-5 h-5 flex items-center justify-center rounded border border-gray-400 text-xs font-bold transition-colors ${
                            expandedSections.has(item.label) 
                              ? 'bg-blue-500 text-white border-blue-500' 
                              : 'bg-white text-gray-600 hover:border-gray-500'
                          }`}>
                            {expandedSections.has(item.label) ? '−' : '+'}
                          </div>
                        </button>
                        {expandedSections.has(item.label) && item.subItems && (
                          <div className="px-2 pb-2 space-y-1">
                            {item.subItems.map((subItem) => (
                              <Link
                                key={subItem.href}
                                href={subItem.href!}
                                className={`flex items-center px-4 py-2 ml-2 rounded-lg transition-colors text-sm border-l-2 ${
                                  pathname === subItem.href
                                    ? 'bg-blue-100 text-blue-700 font-medium border-blue-300'
                                    : 'text-gray-600 hover:bg-gray-100 border-gray-200'
                                }`}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </>
          ) : (
            // 最小化状態（アイコンのみ）
            <>
              <div className="mb-6">
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="サイドメニューを表示"
                >
                  <span className="text-lg">▶</span>
                </button>
              </div>
              <nav className="space-y-2">
                {menuItems.map((item) => (
                <div key={item.label}>
                  {item.href ? (
                    // 単一項目のアイコン
                    <Link
                      href={item.href}
                      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                        pathname === item.href
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      title={item.label}
                    >
                      <span className="text-lg">{item.icon}</span>
                    </Link>
                  ) : (
                    // 階層項目のアイコン
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors cursor-pointer ${
                        isActiveSection(item)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      title={item.label}
                      onClick={() => setSidebarVisible(true)}
                    >
                      <span className="text-lg">{item.icon}</span>
                    </div>
                  )}
                </div>
              ))}
              </nav>
            </>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-x-auto">
        {/* ページコンテンツ */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}