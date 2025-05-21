'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { status } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Se já estiver autenticado, redirecionar para o dashboard
    if (status === 'authenticated') {
      router.push('/dashboard');
    }

    // Verificar se há erro na URL
    const error = searchParams.get('error');
    if (error) {
      toast({
        title: 'Erro de autenticação',
        description: 'Não foi possível fazer login. Verifique suas credenciais.',
        variant: 'destructive',
      });
    }
  }, [status, router, toast, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Tentando login com:', email, 'e senha:', password);
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('Resultado do login:', result);

      if (result?.error) {
        console.log('Erro de login:', result.error);
        toast({
          title: 'Erro de autenticação',
          description: 'Email ou senha incorretos',
          variant: 'destructive',
        });
      } else if (result?.ok) {
        toast({
          title: 'Login bem-sucedido',
          description: 'Bem-vindo de volta!',
        });
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Erro durante login:', error);
      toast({
        title: 'Erro de sistema',
        description: 'Ocorreu um erro ao processar o login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-3xl font-bold">Bem-vindo à Artia</CardTitle>
          <CardDescription>
            Gestão Criativa para equipes de marketing.
             <br />
            <span className="text-xs text-muted-foreground mt-1 block">
              (Use admin@artia.com com senha artiaadmin para acesso de administrador)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border focus:ring-primary"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Sua senha" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-border focus:ring-primary"/>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
    