
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Palette, BellRing } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Mock notification preferences
  const [notifTaskAssigned, setNotifTaskAssigned] = useState(true);
  const [notifCommentMention, setNotifCommentMention] = useState(true);
  const [notifDeadline, setNotifDeadline] = useState(false);

  useEffect(() => {
    // Load theme preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }

    // Load notification preferences (Simulated)
    const storedNotifPrefs = localStorage.getItem('notificationPreferences');
    if (storedNotifPrefs) {
        try {
            const prefs = JSON.parse(storedNotifPrefs);
            setNotifTaskAssigned(prefs.taskAssigned ?? true);
            setNotifCommentMention(prefs.commentMention ?? true);
            setNotifDeadline(prefs.deadline ?? false);
        } catch (e) {
            console.error("Error parsing notification preferences from localStorage", e);
        }
    }
  }, []);

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    toast({ title: 'Tema Atualizado', description: `Tema alterado para ${checked ? 'Escuro' : 'Claro'}.` });
  };
  
  const handleSaveNotificationPreferences = () => {
    const prefs = {
        taskAssigned: notifTaskAssigned,
        commentMention: notifCommentMention,
        deadline: notifDeadline,
    };
    localStorage.setItem('notificationPreferences', JSON.stringify(prefs));
    toast({
        title: 'Preferências de Notificação Salvas',
        description: 'Suas preferências de notificação foram atualizadas.',
    });
  };

  return (
    <div className="container mx-auto py-2 space-y-8">
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5 text-primary" /> Aparência</CardTitle>
          <CardDescription>Personalize a aparência do sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="theme-mode"
              checked={isDarkMode}
              onCheckedChange={handleThemeToggle}
            />
            <Label htmlFor="theme-mode">Modo Escuro</Label>
          </div>
          <p className="text-xs text-muted-foreground mt-1">O tema será aplicado globalmente.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><BellRing className="mr-2 h-5 w-5 text-primary" /> Preferências de Notificação</CardTitle>
          <CardDescription>Escolha quais notificações você deseja receber (simulação).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-task-assigned" className="font-normal">Nova tarefa atribuída a mim</Label>
            <Switch 
                id="notif-task-assigned" 
                checked={notifTaskAssigned}
                onCheckedChange={setNotifTaskAssigned}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-comment-mention" className="font-normal">Menção em comentário</Label>
            <Switch 
                id="notif-comment-mention" 
                checked={notifCommentMention}
                onCheckedChange={setNotifCommentMention}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-deadline" className="font-normal">Lembrete de prazo próximo</Label>
            <Switch 
                id="notif-deadline" 
                checked={notifDeadline}
                onCheckedChange={setNotifDeadline}
            />
          </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveNotificationPreferences}>
                <Save className="mr-2 h-4 w-4" /> Salvar Preferências de Notificação
            </Button>
        </CardFooter>
      </Card>
      
      {/* Placeholder para futuras seções */}
      <Card className="shadow-lg opacity-50">
        <CardHeader>
          <CardTitle>Integrações (Em Breve)</CardTitle>
          <CardDescription>Conecte o Artia com suas ferramentas favoritas.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Mais opções de integração serão adicionadas aqui.</p>
        </CardContent>
      </Card>
       <Card className="shadow-lg opacity-50">
        <CardHeader>
          <CardTitle>Gerenciamento de Dados (Em Breve)</CardTitle>
          <CardDescription>Exporte seus dados ou gerencie sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidades de exportação e gerenciamento de conta estarão disponíveis aqui.</p>
        </CardContent>
      </Card>
      <Card className="shadow-lg opacity-50">
        <CardHeader>
          <CardTitle>Configuração de API (Servidor)</CardTitle>
          <CardDescription>
            Para funcionalidades de IA, a chave de API do Google AI (Gemini) deve ser configurada
            de forma segura no ambiente do servidor (ex: variável de ambiente GOOGLE_API_KEY).
            A configuração do lado do cliente foi removida por motivos de segurança.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Consulte a documentação para configurar a integração de IA no servidor.</p>
        </CardContent>
      </Card>
    </div>
  );
}
