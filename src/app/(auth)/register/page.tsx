'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArtiaLogo } from '@/components/app/icons/ArtiaLogo';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Erro de Registro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      // Chamar API de registro em vez do Firebase
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar usuário');
      }

      toast({
        title: "Registro Bem-sucedido!",
        description: "Sua conta foi criada. Você pode fazer login agora.",
      });
      router.push('/login'); 
    } catch (error: any) {
      console.error("Erro de registro:", error);
      let errorMessage = "Ocorreu um erro ao tentar registrar.";
      
      if (error.message.includes('já está em uso')) {
        errorMessage = "Este e-mail já está em uso.";
      } else if (error.message.includes('email')) {
        errorMessage = "O formato do e-mail é inválido.";
      } else if (error.message.includes('senha')) {
        errorMessage = "A senha é muito fraca. Use pelo menos 6 caracteres.";
      }
      
      toast({
        title: "Erro de Registro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="items-center text-center">
          <ArtiaLogo className="h-16 w-16 mb-2" />
          <CardTitle className="text-3xl font-bold">Crie sua Conta</CardTitle>
          <CardDescription>Comece a gerenciar suas tarefas de marketing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="Seu Nome" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border focus:ring-primary"/>
            </div>
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-border focus:ring-primary"/>
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background border-border focus:ring-primary"/>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Registrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" passHref legacyBehavior>
               <a className="font-medium text-primary hover:text-primary/80 hover:underline">
                Entrar
               </a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
