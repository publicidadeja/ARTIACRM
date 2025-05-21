'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdministrator: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isAdministrator: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  // Verificar autenticação quando o status da sessão mudar
  useEffect(() => {
    // Verificar se o status da sessão é carregando
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    // Atualizar o estado de carregamento
    setLoading(false);

    // Redirecionamentos baseados na autenticação
    if (status === 'unauthenticated' && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      console.log('Usuário não autenticado, redirecionando para login...');
      router.push('/login');
    } else if (status === 'authenticated' && (pathname === '/login' || pathname === '/register')) {
      console.log('Usuário já autenticado, redirecionando para dashboard...');
      router.push('/dashboard');
    }
  }, [status, pathname, router]);

  // Função para sair
  const logout = async () => {
    try {
      await signOut({ redirect: false });
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: 'Erro ao desconectar',
        description: 'Ocorreu um erro ao tentar sair.',
        variant: 'destructive',
      });
    }
  };

  // Mapear dados do usuário do NextAuth para manter compatibilidade com o resto do código
  const currentUser = session?.user 
    ? { 
        ...session.user,
        // Para manter compatibilidade com código existente, mas sem mencionar o Firebase
        uid: session.user.id
      } 
    : null;

  const isAdministrator = session?.user?.role === 'administrador';

  const value = {
    currentUser,
    loading,
    isAdministrator,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
