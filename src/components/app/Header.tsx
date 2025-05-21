'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Search, Settings, LogOut, Moon, Sun, User as UserIcon, Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { ArtiaLogo } from './icons/ArtiaLogo';
import { SidebarNav } from './SidebarNav';
import { NAV_ITEMS, TEAM_MEMBERS } from '@/lib/constants';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { INITIAL_NOTIFICATIONS, getRelativeTime } from '@/lib/notifications';
import type { Notification } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';


const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);
  
  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};


export function Header({ pageTitle }: { pageTitle: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [soundPlayedForSession, setSoundPlayedForSession] = useState(false);
  const [soundFailedToLoad, setSoundFailedToLoad] = useState(false);
  const [isClient, setIsClient] = useState(false); 
  const { currentUser, isAdministrator } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true); 
    if (typeof window !== 'undefined' && !audio && !soundFailedToLoad) {
      const notificationAudio = new Audio('/sounds/notification-sound.mp3');
      notificationAudio.onerror = () => {
        console.warn("Arquivo de som de notificação ('/sounds/notification-sound.mp3') não encontrado ou não pôde ser carregado.");
        setSoundFailedToLoad(true);
      };
      setAudio(notificationAudio);
    }
  }, [audio, soundFailedToLoad]);

  useEffect(() => {
    if (!isClient) return; 

    const storedNotifications = localStorage.getItem('artiaNotifications');
    let currentNotifications = INITIAL_NOTIFICATIONS; 
    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        currentNotifications = Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
      } catch (e) {
        console.error("Erro ao parsear notificações do localStorage", e);
        currentNotifications = INITIAL_NOTIFICATIONS; 
      }
    }
    setNotifications(currentNotifications);

    if (!soundPlayedForSession && !soundFailedToLoad && currentNotifications.some(n => !n.read) && audio) {
      audio.play().catch(error => {
        if (error.name !== 'NotSupportedError' && error.name !== 'AbortError') {
            // console.error("Erro ao tocar som de notificação:", error); // Comentado para reduzir ruído
        }
      });
      setSoundPlayedForSession(true); 
    }
    
    if (!storedNotifications && INITIAL_NOTIFICATIONS.length > 0) { // Apenas salva se INITIAL_NOTIFICATIONS não estiver vazio
      localStorage.setItem('artiaNotifications', JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  }, [isClient, audio, soundPlayedForSession, soundFailedToLoad]);

  useEffect(() => {
    if (!isClient || !notifications) return; 
    
    const currentStoredNotifications = localStorage.getItem('artiaNotifications');
    if (JSON.stringify(notifications) !== currentStoredNotifications) {
        localStorage.setItem('artiaNotifications', JSON.stringify(notifications));
    }
  }, [notifications, isClient]);


  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? {...n, read: true} : n)
    );
    if (notification.entity?.type === 'task' && notification.entity.id) {
      router.push(`/tasks/${notification.entity.id}`);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logout realizado com sucesso!" });
      // O AuthContext redirecionará para /login
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({ title: "Erro ao sair", description: "Não foi possível fazer logout. Tente novamente.", variant: "destructive"});
    }
  };
  
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && !isAdministrator) {
      return false;
    }
    return true;
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 pt-6 bg-sidebar text-sidebar-foreground w-72">
             <Link href="/dashboard" className="flex items-center gap-2 px-4 mb-4">
                <ArtiaLogo className="h-8 w-8" />
                <span className="font-bold text-lg text-sidebar-primary">Artia</span>
              </Link>
            <SidebarNav items={visibleNavItems} pathname={pathname} isMobile={true} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1">
        <h1 className="text-xl font-semibold md:text-2xl text-foreground">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <form className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pesquisar tarefas..."
            className="pl-8 sm:w-[200px] md:w-[150px] lg:w-[250px] bg-background h-9"
          />
        </form>
        
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 min-w-4 p-0 flex items-center justify-center text-xs rounded-full"
                >
                  {unreadNotificationsCount}
                </Badge>
              )}
              <span className="sr-only">Abrir notificações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 md:w-96">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notificações</span>
              {notifications.some(n => !n.read) && (
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="mr-1 h-3 w-3" /> Marcar todas como lidas
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px] md:h-[350px]">
              {notifications.length === 0 ? (
                <DropdownMenuItem disabled className="text-center text-muted-foreground py-4">
                  Nenhuma notificação nova.
                </DropdownMenuItem>
              ) : (
                notifications.map(notification => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer focus:bg-accent",
                      !notification.read && "bg-accent/50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                    onSelect={(e) => e.preventDefault()} 
                  >
                    <Avatar className="h-8 w-8 mt-0.5">
                       <AvatarImage 
                          src={notification.actor?.avatarUrl || TEAM_MEMBERS[0]?.avatarUrl || "https://placehold.co/100x100/E0F7FA/1C4A5C?text=SY"} 
                          alt={notification.actor?.name || "Artia System"} 
                          data-ai-hint="person avatar"
                       />
                       <AvatarFallback>
                        {notification.actor ? notification.actor.name.substring(0,1).toUpperCase() : "SY"}
                       </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.description}</p>
                      <p className="text-xs text-muted-foreground/80">{getRelativeTime(notification.timestamp)}</p>
                    </div>
                    {!notification.read && <div className="h-2 w-2 rounded-full bg-primary self-center"></div>}
                  </DropdownMenuItem>
                ))
              )}
            </ScrollArea>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center py-2" asChild>
              <Link href="/notifications" className="flex items-center w-full justify-center">
                Ver todas as notificações <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.photoURL || "https://placehold.co/100x100"} alt={currentUser.displayName || currentUser.email || "Avatar"} data-ai-hint="user avatar" />
                  <AvatarFallback>{currentUser.email ? currentUser.email.substring(0,2).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{currentUser.displayName || currentUser.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                 <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                 </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
