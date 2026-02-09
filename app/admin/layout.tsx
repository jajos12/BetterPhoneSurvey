'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ToastProvider } from '@/components/admin/ui/Toast';
import ShortcutsModal from '@/components/admin/ui/ShortcutsModal';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showHelp, closeHelp } = useAdminShortcuts();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      href: '/admin',
      label: 'Overview',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
      exact: true,
      shortcut: 'G D',
    },
    {
      href: '/admin/responses',
      label: 'Responses',
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      shortcut: 'G R',
    },
    {
      href: '/admin/insights',
      label: 'Insights',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      badge: 'AI',
      shortcut: 'G I',
    },
    {
      href: '/admin/compare',
      label: 'Compare',
      icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
      shortcut: 'G C',
    },
  ];

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white text-black rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <span className="font-bold text-lg">B</span>
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-tight">BetterPhone</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold mb-4 px-3">Main Menu</p>

        {navItems.map((item) => {
          const active = item.exact
            ? isActive(item.href) && pathname === item.href
            : isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                active
                  ? 'bg-white/10 text-white shadow-sm shadow-white/5'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-white text-black' : 'bg-white/5 group-hover:bg-white/10'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <span className="font-semibold text-sm">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] bg-blue-500/20 border border-blue-500/30 text-blue-400 px-1.5 py-0.5 rounded-full ml-auto font-bold">
                  {item.badge}
                </span>
              )}
              {!item.badge && item.shortcut && (
                <span className="text-[9px] text-white/15 font-mono ml-auto hidden lg:inline">{item.shortcut}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-6 border-t border-white/5 space-y-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-xs text-white/30 hover:text-white transition-colors group"
        >
          <div className="p-1 rounded-md bg-white/5 group-hover:bg-white/10">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </div>
          Back to Survey
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-xs text-red-500/50 hover:text-red-400 transition-colors group w-full"
        >
          <div className="p-1 rounded-md bg-red-500/5 group-hover:bg-red-500/10">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          Logout from Admin
        </button>
        <p className="text-[9px] text-white/15 font-mono text-center">Press ? for shortcuts</p>
      </div>
    </>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
        {/* Premium Vercel Background System */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 blur-[140px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(circle at 50% 50%, black, transparent)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black, transparent)'
            }}
          />
        </div>

        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white text-black rounded-md flex items-center justify-center">
              <span className="font-bold text-sm">B</span>
            </div>
            <span className="text-sm font-bold text-white">BetterPhone</span>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar - desktop: always visible, mobile: slide-in overlay */}
        <aside className={`
          fixed top-0 h-full w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col z-[70]
          transition-transform duration-300 ease-in-out
          md:left-0 md:translate-x-0
          ${mobileSidebarOpen ? 'left-0 translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main className="md:ml-64 min-h-screen relative z-10 p-4 pt-18 md:p-10 md:pt-10 selection:bg-white/10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        {/* Shortcuts Modal */}
        <ShortcutsModal open={showHelp} onClose={closeHelp} />
      </div>
    </ToastProvider>
  );
}
