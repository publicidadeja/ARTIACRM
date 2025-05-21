
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Eye, History, FileText, User, CalendarDays, Bot, Edit3, Trash2, RotateCcw } from 'lucide-react';
import type { GeneratedContentItem } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle as DialogTitleContent, DialogDescription as DialogDescriptionContent, DialogFooter as DialogFooterContent } from '@/components/ui/dialog';


export default function AIContentHistoryPage() {
  const router = useRouter();
  const [generatedContents, setGeneratedContents] = useState<GeneratedContentItem[]>([]);
  const [selectedContentForView, setSelectedContentForView] = useState<GeneratedContentItem | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<GeneratedContentItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedContents = localStorage.getItem('artiaGeneratedContents');
    if (storedContents) {
      try {
        const parsedContents: GeneratedContentItem[] = JSON.parse(storedContents);
        parsedContents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setGeneratedContents(parsedContents);
      } catch (e) {
        console.error("Erro ao carregar histórico de conteúdo do localStorage:", e);
        setGeneratedContents([]);
      }
    }
  }, []);
  
  const handleViewContent = (content: GeneratedContentItem) => {
    setSelectedContentForView(content);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (content: GeneratedContentItem) => {
    setContentToDelete(content);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteContent = () => {
    if (!contentToDelete) return;
    const updatedContents = generatedContents.filter(c => c.id !== contentToDelete.id);
    setGeneratedContents(updatedContents);
    localStorage.setItem('artiaGeneratedContents', JSON.stringify(updatedContents));
    toast({
      title: "Conteúdo Excluído",
      description: "O item de conteúdo gerado foi removido do histórico.",
    });
    setIsDeleteDialogOpen(false);
    setContentToDelete(null);
  };

  const handleReutilizeContent = (content: GeneratedContentItem) => {
    try {
      localStorage.setItem('artiaContentToReuse', JSON.stringify(content));
      router.push('/ai-content-hub/create');
    } catch (error) {
      console.error("Erro ao preparar conteúdo para reutilização:", error);
      toast({
        title: "Erro ao Reutilizar",
        description: "Não foi possível preparar o conteúdo para reutilização.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="container mx-auto py-2">
      <Card className="shadow-xl">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl flex items-center">
            <History className="mr-3 h-7 w-7 text-primary" />
            Histórico de Conteúdo Gerado por IA
          </CardTitle>
          <CardDescription>
            Revise todos os conteúdos criados utilizando a assistência de Inteligência Artificial.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {generatedContents.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg">Nenhum conteúdo gerado ainda.</p>
              <p className="text-sm mt-1">
                Vá para o <Link href="/ai-content-hub/create" className="text-primary hover:underline">Hub de Criação</Link> para gerar seu primeiro conteúdo.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="divide-y divide-border">
                {generatedContents.map(content => (
                  <div key={content.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">{content.originalInstructions.substring(0,70) + "..." || `Conteúdo: ${content.contentType}`}</h3>
                        <div className="text-xs text-muted-foreground space-x-3 mt-1 mb-2 flex flex-wrap items-center">
                            <span className="flex items-center"><FileText className="h-3.5 w-3.5 mr-1"/>{content.contentType}</span>
                            {content.clientName && <span className="flex items-center"><User className="h-3.5 w-3.5 mr-1"/>{content.clientName}</span>}
                            <span className="flex items-center"><CalendarDays className="h-3.5 w-3.5 mr-1"/>{format(parseISO(content.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            {content.agentUsed && <span className="flex items-center"><Bot className="h-3.5 w-3.5 mr-1"/>Usou Agente: {content.agentUsed.name}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-0">
                          <strong>Trecho:</strong> {content.contentSnippet}
                        </p>
                      </div>
                      <div className="flex sm:flex-col md:flex-row items-center sm:items-end md:items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleViewContent(content)}>
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleReutilizeContent(content)}>
                          <RotateCcw className="mr-2 h-4 w-4" /> Reutilizar
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => openDeleteDialog(content)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
         {generatedContents.length > 0 && (
            <CardFooter className="border-t pt-4">
                <p className="text-xs text-muted-foreground">
                    Total de {generatedContents.length} conteúdos gerados.
                </p>
            </CardFooter>
        )}
      </Card>

      {selectedContentForView && (
         <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitleContent>{selectedContentForView.originalInstructions.substring(0,70) + "..." || `Conteúdo: ${selectedContentForView.contentType}`}</DialogTitleContent>
                    <DialogDescriptionContent>
                        Gerado em: {format(parseISO(selectedContentForView.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        {selectedContentForView.clientName && ` | Cliente: ${selectedContentForView.clientName}`}
                        {selectedContentForView.agentUsed && ` | Agente: ${selectedContentForView.agentUsed.name}`}
                    </DialogDescriptionContent>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] mt-4">
                    <pre className="text-sm whitespace-pre-wrap p-4 bg-muted rounded-md">
                        {selectedContentForView.fullContent}
                    </pre>
                </ScrollArea>
                 <DialogFooterContent className="mt-4">
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
                </DialogFooterContent>
            </DialogContent>
        </Dialog>
      )}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item do histórico de conteúdo gerado? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContentToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContent} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
