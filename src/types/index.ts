
import type { LucideIcon } from 'lucide-react';

export type UserRole = 'administrador' | 'gerente' | 'membro' | 'cliente';

export type User = {
  id: string; // Firestore document ID, que deve ser o uid do Firebase Auth
  uid: string; // uid do Firebase Auth
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt?: any; 
  updatedAt?: any; 
};

export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';

export type TaskStatus = string;

export const TaskTypeMarketingEnum = {
  SOCIAL_MEDIA: 'Posts para redes sociais',
  EMAIL_MARKETING: 'Campanhas de email marketing',
  BLOG_CONTENT: 'Criação de conteúdo para blog/site',
  GRAPHIC_DESIGN: 'Design de materiais gráficos',
  AD_CAMPAIGN: 'Campanhas publicitárias',
  VIDEO_PRODUCTION: 'Produções de vídeo',
  EVENT_ORGANIZATION: 'Organização de eventos',
} as const;

export type TaskType = (typeof TaskTypeMarketingEnum)[keyof typeof TaskTypeMarketingEnum];


export type Subtask = {
  id: string;
  text: string;
  completed: boolean;
};

export type Attachment = {
  id:string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'video' | 'other';
  size: string; // e.g., "2.5MB"
};

export type Comment = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  text: string;
  createdAt: string; // ISO date string
};

export type Task = {
  id: string; // Firestore document ID
  userId: string; // ID do usuário do Firebase que criou/possui a tarefa
  title: string;
  description?: string;
  type: TaskType;
  priority: Priority;
  dueDate: string; // ISO date string
  assignees: User[]; 
  collaborators?: User[];
  estimatedTime?: string; // e.g., "4h", "2d"
  references?: string;
  subtasks?: Subtask[];
  attachments?: Attachment[];
  comments?: Comment[];
  status: TaskStatus;
  platform?: string;
  format?: string;
  subject?: string;
  segment?: string;
  expectedMetrics?: string;
  clientId?: string;
  clientName?: string;
  createdAt?: any; 
  updatedAt?: any; 
};

export type KanbanColumn = {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  isCustom?: boolean;
};

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  external?: boolean;
  isActive?: (pathname: string) => boolean;
  adminOnly?: boolean;
  isAISubMenu?: boolean; 
}

export type NotificationType =
  | 'task_assigned'
  | 'comment_mention'
  | 'task_updated'
  | 'deadline_soon'
  | 'new_comment';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string; // ISO date string
  read: boolean;
  actor?: {
    name: string;
    avatarUrl?: string;
  };
  entity?: {
    id: string;
    type: 'task';
    title?: string;
  };
};

// Client Management Types
export type SocialMediaCredential = {
  id: string; 
  platform: string;
  username: string;
  password?: string; 
  notes?: string;
};

export type Client = {
  id: string; 
  userId: string; 
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  notes?: string;
  socialMediaCredentials: SocialMediaCredential[];
  brandProfile?: string;
  targetAudience?: string;
  keywords?: string;
  contentHistory?: string;
  marketingObjectives?: string;
  restrictions?: string;
  createdAt?: any; 
  updatedAt?: any; 
};

// AI Content Hub Types
export const CreativeContentTypes = {
  SOCIAL_MEDIA_POST: { value: 'Post para redes sociais', label: 'Post para redes sociais'},
  EMAIL_MARKETING: { value: 'Email marketing', label: 'Email marketing'},
  BLOG_ARTICLE: { value: 'Artigo para blog', label: 'Artigo para blog'},
  VIDEO_SCRIPT: { value: 'Roteiro para vídeo', label: 'Roteiro para vídeo'},
  PRODUCT_DESCRIPTION: { value: 'Descrição de produto', label: 'Descrição de produto'},
  AD_COPY: { value: 'Copy para anúncio', label: 'Copy para anúncio'},
  PRESS_RELEASE: { value: 'Comunicado de imprensa', label: 'Comunicado de imprensa'},
} as const;
export type CreativeContentTypeValue = (typeof CreativeContentTypes)[keyof typeof CreativeContentTypes]['value'];
export type CreativeContentTypeObject = (typeof CreativeContentTypes)[keyof typeof CreativeContentTypes];


export const TonesOfVoice = {
  FORMAL: { value: 'Formal', label: 'Formal' },
  CASUAL: { value: 'Casual', label: 'Casual' },
  HUMOROUS: { value: 'Humorístico', label: 'Humorístico' },
  INFORMATIVE: { value: 'Informativo', label: 'Informativo' },
  PERSUASIVE: { value: 'Persuasivo', label: 'Persuasivo' },
  EMPATHETIC: { value: 'Empático', label: 'Empático' },
  PROFESSIONAL: { value: 'Profissional', label: 'Profissional' },
  FRIENDLY: { value: 'Amigável', label: 'Amigável' },
  URGENT: { value: 'Urgente', label: 'Urgente' },
} as const;
export type ToneOfVoiceValue = (typeof TonesOfVoice)[keyof typeof TonesOfVoice]['value'];
export type ToneOfVoiceObject = (typeof TonesOfVoice)[keyof typeof TonesOfVoice];

export const ContentLengths = {
  VERY_SHORT: { value: 'Muito Curto', label: 'Muito Curto (ex: título, chamada)' },
  SHORT: { value: 'Curto', label: 'Curto (ex: tweet, post breve)' },
  MEDIUM: { value: 'Médio', label: 'Médio (ex: post de blog, email)' },
  LONG: { value: 'Longo', label: 'Longo (ex: artigo, roteiro simples)' },
  VERY_LONG: { value: 'Muito Longo', label: 'Muito Longo (ex: e-book, guia detalhado)' },
} as const;
export type ContentLengthValue = (typeof ContentLengths)[keyof typeof ContentLengths]['value'];
export type ContentLengthObject = (typeof ContentLengths)[keyof typeof ContentLengths];

export const SocialPlatforms = {
  INSTAGRAM: { value: 'Instagram', label: 'Instagram'},
  FACEBOOK: { value: 'Facebook', label: 'Facebook'},
  TWITTER_X: { value: 'X (Twitter)', label: 'X (Twitter)'},
  LINKEDIN: { value: 'LinkedIn', label: 'LinkedIn'},
  TIKTOK: { value: 'TikTok', label: 'TikTok'},
  YOUTUBE: { value: 'YouTube', label: 'YouTube'},
  PINTEREST: { value: 'Pinterest', label: 'Pinterest'},
  THREADS: { value: 'Threads', label: 'Threads'},
} as const;
export type SocialPlatformValue = (typeof SocialPlatforms)[keyof typeof SocialPlatforms]['value'];
export type SocialPlatformObject = (typeof SocialPlatforms)[keyof typeof SocialPlatforms];

export const SpecificDataInclusionOptions = {
  STATISTICS: { value: 'Estatísticas', label: 'Estatísticas'},
  QUOTES: { value: 'Citações', label: 'Citações'},
  CASE_STUDIES: { value: 'Estudos de Caso', label: 'Estudos de Caso'},
  PRODUCT_DETAILS: { value: 'Detalhes do Produto', label: 'Detalhes do Produto'},
} as const;
export type SpecificDataInclusionValue = (typeof SpecificDataInclusionOptions)[keyof typeof SpecificDataInclusionOptions]['value'];
export type SpecificDataInclusionObject = (typeof SpecificDataInclusionOptions)[keyof typeof SpecificDataInclusionOptions];

export const ContentFormats = {
  PARAGRAPH: { value: 'Parágrafos', label: 'Parágrafos'},
  LIST: { value: 'Lista (bullet points)', label: 'Lista (bullet points)'},
  Q_AND_A: { value: 'Pergunta e Resposta', label: 'Pergunta e Resposta'},
  NARRATIVE: { value: 'Narrativa / Storytelling', label: 'Narrativa / Storytelling'},
  STEP_BY_STEP: { value: 'Passo a Passo / Tutorial', label: 'Passo a Passo / Tutorial'},
} as const;
export type ContentFormatValue = (typeof ContentFormats)[keyof typeof ContentFormats]['value'];
export type ContentFormatObject = (typeof ContentFormats)[keyof typeof ContentFormats];

export const Languages = {
  PT_BR: { value: 'Português (Brasil)', label: 'Português (Brasil)'},
  EN_US: { value: 'Inglês (EUA)', label: 'Inglês (EUA)'},
  ES_ES: { value: 'Espanhol (Espanha)', label: 'Espanhol (Espanha)'},
} as const;
export type LanguageValue = (typeof Languages)[keyof typeof Languages]['value'];
export type LanguageObject = (typeof Languages)[keyof typeof Languages];

export type ClientContextConfig = {
  useBrandProfile: boolean;
  useTargetAudience: boolean;
  useKeywords: boolean;
  useContentHistory: boolean;
  useMarketingObjectives: boolean;
  useRestrictions: boolean;
};

// AI Agent Types
export const AgentSpecializationsEnum = {
  SOCIAL_MEDIA: 'Redes Sociais',
  EMAIL_MARKETING: 'Email Marketing',
  SEO_CONTENT: 'Conteúdo SEO (Blog/Site)',
  AD_COPYWRITING: 'Copywriting para Anúncios',
  VIDEO_SCRIPTING: 'Roteiros de Vídeo',
  PRODUCT_DESCRIPTIONS: 'Descrições de Produto',
  PRESS_RELEASES: 'Comunicados de Imprensa',
  GENERAL_MARKETING: 'Marketing Geral',
} as const;
export type AgentSpecialization = (typeof AgentSpecializationsEnum)[keyof typeof AgentSpecializationsEnum];

export type AIAgent = {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  specialization: AgentSpecialization;
  personalityStyle: string; 
  basePrompt: string; 
};

export type GeneratedContentItem = {
  id: string;
  originalInstructions: string; // Combinação do prompt do agente (se usado) + query específica do usuário, ou apenas instruções do usuário
  contentType: CreativeContentTypeValue;
  toneOfVoice: ToneOfVoiceValue;
  contentLengthValue: number;
  socialPlatform?: SocialPlatformValue;
  specificDataToInclude?: string;
  contentFormat: ContentFormatValue;
  language: LanguageValue;
  clientContextConfig: ClientContextConfig;
  clientName?: string;
  clientId?: string;
  createdAt: string; 
  contentSnippet: string; 
  fullContent: string; 
  agentUsed?: {
    id: string;
    name: string;
  };
};
