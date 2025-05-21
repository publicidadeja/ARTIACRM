
import type { Task, KanbanColumn, TaskType, Priority, User, NavItem, Client, LucideIcon, AIAgent, AgentSpecialization, CreativeContentType, ToneOfVoice, ContentLength, SocialPlatform, SpecificDataInclusion, ContentFormat, Language, GeneratedContentItem } from '@/types';
import { TaskTypeMarketingEnum, CreativeContentTypes as CreativeContentTypesObjects, TonesOfVoice as TonesOfVoiceObjects, ContentLengths as ContentLengthsObjects, SocialPlatforms as SocialPlatformsObjects, SpecificDataInclusionOptions as SpecificDataInclusionOptionsObjects, ContentFormats as ContentFormatsObjects, Languages as LanguagesObjects, AgentSpecializationsEnum } from '@/types';

import {
  LayoutDashboard,
  Trello,
  PlusCircle,
  CalendarDays,
  UserCircle,
  Share2,
  Mail,
  FileText,
  Palette,
  Megaphone,
  Video,
  CalendarPlus,
  Users,
  Briefcase,
  Brain,
  Settings,
  History, // Para histórico de conteúdo IA
} from 'lucide-react';


export const TEAM_MEMBERS: User[] = [
  { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com', role: 'administrador', avatarUrl: 'https://placehold.co/100x100/E0F7FA/1C4A5C?text=AS' },
  { id: 'user-2', name: 'Bruno Costa', email: 'bruno@example.com', role: 'gerente', avatarUrl: 'https://placehold.co/100x100/E0F7FA/1C4A5C?text=BC' },
  { id: 'user-3', name: 'Carla Dias', email: 'carla@example.com', role: 'membro', avatarUrl: 'https://placehold.co/100x100/E0F7FA/1C4A5C?text=CD' },
  { id: 'user-4', name: 'Daniel Faria', email: 'daniel@example.com', role: 'membro', avatarUrl: 'https://placehold.co/100x100/E0F7FA/1C4A5C?text=DF' },
  { id: 'user-5', name: 'Elisa Reis', email: 'elisa@example.com', role: 'cliente', avatarUrl: 'https://placehold.co/100x100/E0F7FA/1C4A5C?text=ER' },
];

export const USER_ROLES: { value: User['role']; label: string }[] = [
    { value: 'administrador', label: 'Administrador' },
    { value: 'gerente', label: 'Gerente' },
    { value: 'membro', label: 'Membro' },
    { value: 'cliente', label: 'Cliente' },
];

export const TASK_TYPES_MARKETING: { value: TaskType; label: string; icon: LucideIcon }[] = [
  { value: TaskTypeMarketingEnum.SOCIAL_MEDIA, label: 'Posts para redes sociais', icon: Share2 },
  { value: TaskTypeMarketingEnum.EMAIL_MARKETING, label: 'Campanhas de email marketing', icon: Mail },
  { value: TaskTypeMarketingEnum.BLOG_CONTENT, label: 'Criação de conteúdo para blog/site', icon: FileText },
  { value: TaskTypeMarketingEnum.GRAPHIC_DESIGN, label: 'Design de materiais gráficos', icon: Palette },
  { value: TaskTypeMarketingEnum.AD_CAMPAIGN, label: 'Campanhas publicitárias', icon: Megaphone },
  { value: TaskTypeMarketingEnum.VIDEO_PRODUCTION, label: 'Produções de vídeo', icon: Video },
  { value: TaskTypeMarketingEnum.EVENT_ORGANIZATION, label: 'Organização de eventos', icon: CalendarPlus },
];

export const PRIORITIES: { value: Priority; label: string; colorClass: string }[] = [
  { value: 'baixa', label: 'Baixa', colorClass: 'bg-green-500' },
  { value: 'media', label: 'Média', colorClass: 'bg-yellow-500' },
  { value: 'alta', label: 'Alta', colorClass: 'bg-orange-500' },
  { value: 'urgente', label: 'Urgente', colorClass: 'bg-red-600' },
];

export const KANBAN_COLUMNS_LIST: { id: string; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'a_fazer', title: 'A Fazer' },
  { id: 'em_andamento', title: 'Em Andamento' },
  { id: 'revisao', title: 'Revisão' },
  { id: 'aprovacao_cliente', title: 'Aprovação do Cliente' },
  { id: 'concluido', title: 'Concluído' },
];

export const INITIAL_TASKS: Task[] = [];
export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_AGENTS: AIAgent[] = [];
export const INITIAL_NOTIFICATIONS: Notification[] = [];


export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Quadro Kanban', href: '/board', icon: Trello },
  { title: 'Criar Tarefa', href: '/tasks/new', icon: PlusCircle },
  { title: 'Calendário', href: '/calendar', icon: CalendarDays },
  { title: 'Clientes', href: '/clients', icon: Briefcase },
  { 
    title: 'Hub de Conteúdo IA', 
    href: '/ai-content-hub', 
    icon: Brain, 
    isActive: (pathname) => pathname.startsWith('/ai-content-hub') 
  },
  { title: 'Perfil', href: '/profile', icon: UserCircle },
  { title: 'Configurações', href: '/settings', icon: Settings },
  { title: 'Gerenciar Usuários', href: '/admin/users', icon: Users, adminOnly: true },
];


export const AgentSpecializationsList: { value: AgentSpecialization; label: string }[] = Object.values(AgentSpecializationsEnum).map(value => ({
  value,
  label: value.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
}));


// For the AIContentCreationForm - exporting the complete objects
export const CreativeContentTypes = CreativeContentTypesObjects;
export const TonesOfVoice = TonesOfVoiceObjects;
export const ContentLengths = ContentLengthsObjects;
export const SocialPlatforms = SocialPlatformsObjects;
export const SpecificDataInclusionOptions = SpecificDataInclusionOptionsObjects;
export const ContentFormats = ContentFormatsObjects;
export const Languages = LanguagesObjects;
    

