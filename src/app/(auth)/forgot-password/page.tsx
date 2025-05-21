'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArtiaLogo } from '@/components/app/icons/ArtiaLogo';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      // Chamar API de recuperação de senha em vez do Firebase
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      toast({
        title: "Link de Recuperação Enviado",
        description: data.message || "Se uma conta com este email existir, um link para redefinir sua senha foi enviado.",
        variant: response.ok ? "default" : "destructive",
      });
      
      if (response.ok) {
        router.push('/login');
      }
    } catch (error: any) {
      console.error("Erro ao enviar email de recuperação:", error);
      toast({
        title: "Erro na Recuperação de Senha",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
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
          <CardTitle className="text-3xl font-bold">Recuperar Senha</CardTitle>
          <CardDescription>Insira seu email para receber o link de recuperação.</CardDescription>
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
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <p className="text-sm text-muted-foreground">
            Lembrou a senha?{' '}
            <Link href="/login" passHref>
               <Button variant="link" className="text-primary hover:text-primary/80 px-0">
                Entrar
               </Button>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
