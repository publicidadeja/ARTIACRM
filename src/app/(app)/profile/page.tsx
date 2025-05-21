'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Save } from "lucide-react";
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [role, setRole] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fallbackAvatarText = useCallback((currentName?: string | null) => {
    return (currentName || 'P').substring(0, 2).toUpperCase();
  }, []);

  const generatePlaceholderAvatar = useCallback((currentName?: string | null) => {
    return `https://placehold.co/200x200/E0F7FA/1C4A5C?text=${fallbackAvatarText(currentName)}`;
  }, [fallbackAvatarText]);

  useEffect(() => {
    if (session?.user) {
      const currentName = session.user.name || session.user.email?.split('@')[0] || 'Usuário';
      const currentEmail = session.user.email || 'N/A';
      const currentImage = session.user.image || '';
      
      setName(currentName);
      setEmail(currentEmail);
      setAvatarUrlInput(currentImage);
      setAvatarPreview(currentImage || generatePlaceholderAvatar(currentName));
      setRole(session.user.role === 'administrador' ? 'Administrador' : 'Membro');
      setSelectedFile(null);
    }
  }, [session, generatePlaceholderAvatar]);

  const handleAvatarFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo Inválido",
          description: "Por favor, selecione um arquivo de imagem (ex: JPG, PNG, GIF).",
          variant: "destructive",
        });
        event.target.value = ''; 
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast({
        title: "Pré-visualização de Avatar Atualizada",
        description: "A imagem selecionada está sendo exibida. Se desejar usá-la, clique em 'Salvar Alterações'.",
        duration: 7000,
      });
    }
  };

  const handleAvatarUrlInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setAvatarUrlInput(url);
    if (!selectedFile) { 
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            setAvatarPreview(url);
        } else if (!url) {
            setAvatarPreview(generatePlaceholderAvatar(name));
        }
    }
  };

  const handleSaveChanges = async () => {
    if (!session?.user) {
      toast({ title: "Erro", description: "Nenhum usuário logado.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    let finalImage: string | null = null;
    
    try {
      // Se houver um arquivo selecionado, fazer upload primeiro
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          
          const response = await fetch('/api/upload-avatar', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro ao fazer upload: ${errorData.error || response.statusText}`);
          }
          
          const data = await response.json();
          finalImage = data.url;
        } catch (uploadError: any) {
          console.error("Erro durante o upload:", uploadError);
          toast({
            title: "Erro ao fazer upload",
            description: uploadError.message || "Não foi possível fazer o upload da imagem.",
            variant: "destructive"
          });
          setIsSaving(false);
          return;
        }
      } else if (avatarUrlInput.trim() !== '') {
        if (!avatarUrlInput.startsWith('http://') && !avatarUrlInput.startsWith('https://')) {
          toast({ title: "URL Inválida", description: "A URL do avatar deve ser válida (começar com http:// ou https://).", variant: "destructive" });
          setIsSaving(false);
          return;
        }
        finalImage = avatarUrlInput.trim();
      }
      
      // Preparar dados para atualização de perfil
      const updateData: any = { 
        name,
        image: finalImage 
      };
      
      // Se senha for fornecida, inclui-la na atualização
      if (newPassword && currentPassword) {
        if (newPassword !== confirmPassword) {
          toast({ 
            title: "Erro ao atualizar senha", 
            description: "A confirmação de senha não coincide com a nova senha.", 
            variant: "destructive" 
          });
          setIsSaving(false);
          return;
        }
        
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }
      
      // Atualizar perfil via API
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar perfil');
      }
      
      // Atualizar estado local
      if (finalImage) {
        // Forçar o navegador a recarregar a imagem adicionando uma query string
        const cachedUrl = `${finalImage}?t=${Date.now()}`;
        setAvatarPreview(cachedUrl);
        setAvatarUrlInput(finalImage);
      } else if (!finalImage && updateData.image === null) {
        setAvatarPreview(generatePlaceholderAvatar(name));
        setAvatarUrlInput('');
      }
      
      setSelectedFile(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: "Perfil Atualizado",
        description: "Suas informações de perfil foram salvas com sucesso!",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro ao Salvar",
        description: error.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
        duration: 9000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  if (status !== 'authenticated' || !session?.user) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p className="text-muted-foreground">Por favor, faça login para ver seu perfil.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 shadow-lg">
          <CardHeader className="items-center text-center">
            <div className="relative group mb-4">
              <Avatar className="h-32 w-32" key={avatarPreview}> 
                <AvatarImage src={avatarPreview} alt={name} data-ai-hint="user avatar" />
                <AvatarFallback>{fallbackAvatarText(name)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                <label htmlFor="avatar-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4"/>
                    <input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarFileSelect}/>
                </label>
              </Button>
            </div>
            <CardTitle className="text-2xl">{name}</CardTitle>
            <CardDescription>{role}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">{email}</p>
            <p className="text-xs text-muted-foreground">Membro desde {new Date(session.user.createdAt || Date.now()).toLocaleDateString('pt-BR')}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Editar Perfil</CardTitle>
            <CardDescription>
              Atualize suas informações pessoais e senha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="avatar-url">URL da imagem de perfil (opcional)</Label>
              <Input
                id="avatar-url"
                value={avatarUrlInput}
                onChange={handleAvatarUrlInputChange}
                placeholder="https://exemplo.com/sua-imagem.jpg"
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">Use uma URL de imagem ou faça upload clicando na foto de perfil.</p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
