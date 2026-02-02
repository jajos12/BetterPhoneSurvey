import { ReactNode } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-full bg-white border-r border-gray-200 p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-primary">BetterPhone</h1>
          <p className="text-sm text-text-muted">Admin Dashboard</p>
        </div>
        
        <nav className="space-y-2">
          <Link 
            href="/admin"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Overview
          </Link>
          
          <Link 
            href="/admin/responses"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Responses
          </Link>
          
          <Link 
            href="/admin/analytics"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 text-text-muted cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Soon</span>
          </Link>
        </nav>
        
        <div className="absolute bottom-6 left-6 right-6">
          <Link href="/" className="text-sm text-text-muted hover:text-primary transition-colors">
            ← Back to Survey
          </Link>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
