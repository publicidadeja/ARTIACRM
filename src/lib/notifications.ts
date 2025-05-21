
import type { Notification } from '@/types';
import { TEAM_MEMBERS } from './constants';

function getRelativeTime(isoDateString: string): string {
  const date = new Date(isoDateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const units = [
    { name: 'ano', seconds: 31536000 },
    { name: 'mês', seconds: 2592000 },
    { name: 'semana', seconds: 604800 },
    { name: 'dia', seconds: 86400 },
    { name: 'hora', seconds: 3600 },
    { name: 'minuto', seconds: 60 },
  ];

  for (const unit of units) {
    const interval = Math.floor(diffInSeconds / unit.seconds);
    if (interval >= 1) {
      return `há ${interval} ${unit.name}${interval > 1 ? 's' : ''}`;
    }
  }
  return 'agora mesmo';
}


export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    type: 'task_assigned',
    title: 'Nova Tarefa Atribuída',
    description: 'Ana Silva atribuiu a você a tarefa "Revisar conteúdo do blog".',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    read: false,
    actor: TEAM_MEMBERS.find(m => m.name === 'Ana Silva'),
    entity: { id: '6', type: 'task', title: 'Artigo sobre SEO para E-commerce' },
  },
  {
    id: 'notif_2',
    type: 'new_comment',
    title: 'Novo Comentário',
    description: 'Bruno Costa comentou na tarefa "Campanha de lançamento Outono/Inverno".',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    read: false,
    actor: TEAM_MEMBERS.find(m => m.name === 'Bruno Costa'),
    entity: { id: '1', type: 'task', title: 'Campanha de lançamento Outono/Inverno' },
  },
  {
    id: 'notif_3',
    type: 'deadline_soon',
    title: 'Prazo se Aproximando',
    description: 'A tarefa "Posts semanais para Instagram" vence em 2 dias.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: true,
    entity: { id: '2', type: 'task', title: 'Posts semanais para Instagram' },
  },
  {
    id: 'notif_4',
    type: 'task_updated',
    title: 'Tarefa Atualizada',
    description: 'Carla Dias atualizou o status da tarefa "Newsletter de Novidades - Julho" para Revisão.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    read: true,
    actor: TEAM_MEMBERS.find(m => m.name === 'Carla Dias'),
    entity: { id: '4', type: 'task', title: 'Newsletter de Novidades - Julho' },
  },
  {
    id: 'notif_5',
    type: 'comment_mention',
    title: 'Você foi Mencionado',
    description: 'Elisa Reis mencionou você em um comentário na tarefa "Aprovar vídeo institucional".',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: false,
    actor: TEAM_MEMBERS.find(m => m.name === 'Elisa Reis'),
    entity: { id: '5', type: 'task', title: 'Aprovar vídeo institucional' },
  },
];

export { getRelativeTime };
