
'use server';
/**
 * @fileOverview Flow para gerar conteúdo criativo de marketing usando IA.
 *
 * - generateCreativeContent - Função principal que invoca o flow.
 * - GenerateCreativeContentInput - Tipo de entrada para o flow.
 * - GenerateCreativeContentOutput - Tipo de saída do flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CreativeContentType, ToneOfVoice, ContentLength, SocialPlatform, ClientContextConfig, Language, ContentFormat } from '@/types';

// Sub-schema para o contexto do cliente
const ClientContextSchema = z.object({
  brandProfile: z.string().optional().describe('Perfil da marca do cliente (cores, voz, tom, valores).'),
  targetAudience: z.string().optional().describe('Público-alvo e personas do cliente.'),
  keywords: z.string().optional().describe('Palavras-chave e hashtags principais do cliente.'),
  contentHistory: z.string().optional().describe('Histórico de conteúdos anteriores do cliente.'),
  marketingObjectives: z.string().optional().describe('Objetivos de marketing do cliente.'),
  restrictions: z.string().optional().describe('Restrições e diretrizes específicas do cliente.'),
}).optional();


const GenerateCreativeContentInputSchema = z.object({
  clientName: z.string().optional().describe('Nome do cliente para dar contexto.'),
  clientContext: ClientContextSchema,
  instructions: z.string().describe('Instruções detalhadas do usuário para a IA.'),
  contentType: z.string().describe('O tipo de conteúdo a ser gerado (ex: Post para redes sociais, Email marketing).'),
  socialPlatform: z.string().optional().describe('Plataforma de mídia social (se aplicável, ex: Instagram, Facebook).'),
  toneOfVoice: z.string().describe('O tom de voz desejado para o conteúdo (ex: Formal, Casual, Humorístico).'),
  contentLength: z.string().describe('A extensão desejada para o conteúdo (ex: Curto, Médio, Longo).'),
  specificDataToInclude: z.string().optional().describe('Dados específicos que devem ser incluídos no conteúdo (estatísticas, citações, etc.).'),
  contentFormat: z.string().optional().describe('O formato desejado para o conteúdo (ex: Lista, Pergunta-Respostas, Narrativa).'),
  language: z.string().optional().describe('O idioma em que o conteúdo deve ser gerado.'),
});
export type GenerateCreativeContentInput = z.infer<typeof GenerateCreativeContentInputSchema>;

const GenerateCreativeContentOutputSchema = z.object({
  creativeContent: z.string().describe('O conteúdo criativo gerado pela IA.'),
  suggestions: z.array(z.string()).optional().describe('Sugestões adicionais ou alternativas da IA.'),
});
export type GenerateCreativeContentOutput = z.infer<typeof GenerateCreativeContentOutputSchema>;

export async function generateCreativeContent(input: GenerateCreativeContentInput): Promise<GenerateCreativeContentOutput> {
  const { output } = await generateCreativeContentPrompt(input);
  if (!output) {
    throw new Error("A IA não conseguiu gerar uma resposta válida.");
  }
  return output;
}

const generateCreativeContentPrompt = ai.definePrompt({
  name: 'generateCreativeContentPrompt',
  input: {schema: GenerateCreativeContentInputSchema},
  output: {schema: GenerateCreativeContentOutputSchema},
  prompt: `
    Você é um assistente de marketing especialista em criação de conteúdo criativo e persuasivo.
    Seu objetivo é gerar conteúdo de alta qualidade que atenda às especificações do usuário.

    **Contexto do Cliente (se fornecido):**
    {{#if clientName}}Cliente: {{{clientName}}}{{/if}}
    {{#if clientContext.brandProfile}}
    - Perfil da Marca: {{{clientContext.brandProfile}}}
    {{/if}}
    {{#if clientContext.targetAudience}}
    - Público-Alvo: {{{clientContext.targetAudience}}}
    {{/if}}
    {{#if clientContext.keywords}}
    - Palavras-chave/Hashtags: {{{clientContext.keywords}}}
    {{/if}}
    {{#if clientContext.contentHistory}}
    - Histórico de Conteúdo Relevante: {{{clientContext.contentHistory}}}
    {{/if}}
    {{#if clientContext.marketingObjectives}}
    - Objetivos de Marketing: {{{clientContext.marketingObjectives}}}
    {{/if}}
    {{#if clientContext.restrictions}}
    - Restrições/Diretrizes: {{{clientContext.restrictions}}}
    {{/if}}

    **Instruções do Usuário:**
    {{{instructions}}}

    **Detalhes do Conteúdo Solicitado:**
    - Tipo de Conteúdo: {{{contentType}}}
    {{#if socialPlatform}}
    - Plataforma (se aplicável): {{{socialPlatform}}}
    {{/if}}
    - Tom de Voz: {{{toneOfVoice}}}
    - Extensão Desejada: {{{contentLength}}}
    {{#if contentFormat}}
    - Formato do Conteúdo: {{{contentFormat}}}
    {{/if}}
    {{#if language}}
    - Idioma: {{{language}}}
    {{/if}}
    {{#if specificDataToInclude}}
    - Dados Específicos a Incluir: {{{specificDataToInclude}}}
    {{/if}}

    **Sua Tarefa:**
    1. Analise todas as informações fornecidas: nome do cliente (se houver), contexto do cliente, instruções do usuário e detalhes do conteúdo.
    2. Gere o conteúdo solicitado, garantindo que ele seja coeso, relevante e alinhado com o tom de voz e formato especificados.
    3. Se possível, incorpore os dados específicos solicitados de forma natural.
    4. Crie também uma lista de 2 a 3 sugestões concisas e acionáveis para melhorar ou complementar o conteúdo gerado. As sugestões podem incluir ideias para imagens, CTAs alternativos, ou formas de reutilizar o conteúdo.

    Responda no formato JSON especificado.
  `,
});

// O flow em si não é mais necessário aqui, pois a chamada direta ao prompt
// é feita na função exportada generateCreativeContent.
// Se houvesse lógica adicional antes ou depois da chamada do prompt, o flow seria útil.
// const generateCreativeContentFlow = ai.defineFlow(
//   {
//     name: 'generateCreativeContentFlow',
//     inputSchema: GenerateCreativeContentInputSchema,
//     outputSchema: GenerateCreativeContentOutputSchema,
//   },
//   async (input) => {
//     const { output } = await generateCreativeContentPrompt(input);
//     if (!output) {
//       throw new Error("A IA não conseguiu gerar uma resposta válida.");
//     }
//     return output;
//   }
// );

