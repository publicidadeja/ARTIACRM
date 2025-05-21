
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { INITIAL_NOTIFICATIONS, getRelativeTime } from '@/lib/notifications';
import { TEAM_MEMBERS } from '@/lib/constants';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCheck, ExternalLink } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const storedNotifications = localStorage.getItem('artiaNotifications');
    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications));
      } catch (e) {
        console.error("Erro ao parsear notificações do localStorage na página de Notificações:", e);
        setNotifications(INITIAL_NOTIFICATIONS);
      }
    } else {
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.setItem('artiaNotifications', JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      const stored = localStorage.getItem('artiaNotifications');
      if (stored !== JSON.stringify(notifications)) {
        localStorage.setItem('artiaNotifications', JSON.stringify(notifications));
      }
    }
  }, [notifications]);

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
    );
    if (notification.entity?.type === 'task' && notification.entity.id) {
      router.push(`/tasks/${notification.entity.id}`);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationsExist = notifications.some(n => !n.read);

  return (
    <div className="container mx-auto py-2">
      <Card className="shadow-xl">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Notificações</CardTitle>
            {unreadNotificationsExist && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas como lidas
              </Button>
            )}
          </div>
          <CardDescription>
            Mantenha-se atualizado com as últimas atividades.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">Nenhuma notificação para exibir.</p>
          ) : (
            <ScrollArea className="h-[calc(100vh-220px)]"> {/* Adjust height as needed */}
              <ul className="divide-y divide-border">
                {notifications.map(notification => (
                  <li
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.read && "bg-accent/30 hover:bg-accent/40"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10 mt-1">
                        <AvatarImage
                          src={notification.actor?.avatarUrl || TEAM_MEMBERS[0].avatarUrl}
                          alt={notification.actor?.name || "Artia System"}
                          data-ai-hint="person avatar"
                        />
                        <AvatarFallback>
                          {notification.actor ? notification.actor.name.substring(0, 1).toUpperCase() : "SY"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-foreground">{notification.title}</h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {getRelativeTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notification.description}</p>
                        {notification.entity?.type === 'task' && notification.entity.id && (
                            <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs" asChild onClick={(e) => e.stopPropagation()}>
                                <Link href={`/tasks/${notification.entity.id}`}>
                                    Ver Tarefa <ExternalLink className="ml-1 h-3 w-3" />
                                </Link>
                            </Button>
                        )}
                      </div>
                       {!notification.read && (
                        <Badge variant="default" className="h-2 w-2 p-0 rounded-full self-center shrink-0" aria-label="Não lida"></Badge>
                       )}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
