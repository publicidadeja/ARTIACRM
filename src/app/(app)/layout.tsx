
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { ArtiaLogo } from '@/components/app/icons/ArtiaLogo';
import { Header } from '@/components/app/Header';
import { SidebarNav } from '@/components/app/SidebarNav';
import { NAV_ITEMS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelRightClose, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext'; 

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const { currentUser, loading: authLoading, isAdministrator } = useAuth();
  

  useEffect(() => {
    let newTitle = 'Artia'; // Default title
    
    if (pathname === '/ai-content-hub/create') {
      newTitle = 'Criar Conteúdo com IA';
    } else if (pathname === '/ai-content-hub/agents/new') {
      newTitle = 'Criar Novo Agente de IA';
    } else if (pathname.startsWith('/ai-content-hub/agents/') && pathname.endsWith('/edit')) {
      newTitle = 'Editar Agente de IA';
    } else if (pathname === '/ai-content-hub/agents') {
      newTitle = 'Gerenciar Agentes de IA';
    } else if (pathname === '/ai-content-hub/history') {
      newTitle = 'Histórico de Conteúdo Gerado';
    } else if (pathname === '/ai-content-hub') {
      newTitle = 'Hub de Conteúdo IA';
    } else if (pathname.startsWith('/tasks/new')) {
      newTitle = 'Criar Nova Tarefa';
    } else if (pathname.match(/^\/tasks\/[^/]+\/edit$/)) {
      newTitle = 'Editar Tarefa';
    } else if (pathname.match(/^\/tasks\/[^/]+$/) && !pathname.endsWith('/edit') && !pathname.endsWith('/new')) {
      newTitle = 'Detalhes da Tarefa';
    } else if (pathname.startsWith('/admin/users')) {
      newTitle = 'Gerenciar Usuários';
    } else if (pathname.startsWith('/clients/new')) {
      newTitle = 'Adicionar Novo Cliente';
    } else if (pathname.match(/^\/clients\/[^/]+\/edit$/)) {
      newTitle = 'Editar Cliente';
    } else if (pathname.match(/^\/clients\/[^/]+$/) && !pathname.endsWith('/edit') && !pathname.endsWith('/new')) {
      newTitle = 'Detalhes do Cliente';
    } else if (pathname === '/notifications') {
      newTitle = 'Notificações';
    } else if (pathname === '/settings') {
      newTitle = 'Configurações';
    }
     else {
      const currentNavItem = NAV_ITEMS.find(item => {
        if (item.isActive) return item.isActive(pathname || '');
        // Ajuste para que o match seja mais preciso para a rota base
        return item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
      });
      if (currentNavItem) {
        newTitle = currentNavItem.title;
      }
    }
    
    setPageTitle(newTitle);

  }, [pathname]);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { 
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && !isAdministrator) {
      return false;
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando aplicação...</p>
      </div>
    );
  }

  if (!currentUser && !authLoading) {
    // O AuthContext já deve redirecionar, mas isso é uma proteção extra
    return null; 
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr]">
      <aside className={cn(
        "hidden border-r bg-sidebar md:block transition-all duration-300 ease-in-out text-sidebar-foreground",
        isSidebarCollapsed ? "w-20" : "w-72"
      )}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b px-4 lg:px-6 justify-between">
            <Link href="/dashboard" className={cn("flex items-center gap-2 font-semibold", isSidebarCollapsed && "justify-center w-full")}>
              <ArtiaLogo className="h-8 w-8" />
              <span className={cn("text-lg text-sidebar-primary", isSidebarCollapsed && "sr-only")}>Artia</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className={cn("ml-auto h-8 w-8 hidden md:flex", !isSidebarCollapsed && "mr-[-8px]")}
              aria-label={isSidebarCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
            >
              {isSidebarCollapsed ? <PanelRightClose className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
          </div>
          <div className="flex-1">
            <SidebarNav items={visibleNavItems} pathname={pathname} isCollapsed={isSidebarCollapsed} />
          </div>
        </div>
      </aside>
      <div className="flex flex-col">
        <Header pageTitle={pageTitle} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

