
'use server';

/**
 * @fileOverview An AI assistant that analyzes a task description and suggests relevant tags, priority, and assignees.
 *
 * - suggestTaskDetails - A function that suggests task details based on the task description.
 * - SuggestTaskDetailsInput - The input type for the suggestTaskDetails function.
 * - SuggestTaskDetailsOutput - The return type for the suggestTaskDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskDetailsInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('The description of the task for which details are to be suggested.'),
  teamMembers: z
    .array(z.string())
    .describe('A list of team member names who can be assigned to the task.'),
});

export type SuggestTaskDetailsInput = z.infer<typeof SuggestTaskDetailsInputSchema>;

const SuggestTaskDetailsOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('An array of relevant tags for the task, e.g., SEO, Social Media. Máximo de 5 tags.'),
  priority: z
    .enum(['Alta', 'Media', 'Baixa']) // Ajustado para corresponder ao enum Priority em types.ts (considerando labels)
    .describe('The suggested priority for the task. Use "Alta", "Media", or "Baixa".'),
  assignees: z
    .array(z.string())
    .describe('An array of suggested team members (names) to assign to the task. Selecione no máximo 2 membros da lista fornecida.'),
});

export type SuggestTaskDetailsOutput = z.infer<typeof SuggestTaskDetailsOutputSchema>;

export async function suggestTaskDetails(input: SuggestTaskDetailsInput): Promise<SuggestTaskDetailsOutput> {
  return suggestTaskDetailsFlow(input);
}

const suggestTaskDetailsPrompt = ai.definePrompt({
  name: 'suggestTaskDetailsPrompt',
  input: {schema: SuggestTaskDetailsInputSchema},
  output: {schema: SuggestTaskDetailsOutputSchema},
  prompt: `Você é um assistente de IA especialista em gerenciamento de projetos de marketing.
  Sua tarefa é analisar a descrição de uma tarefa e sugerir:
  1. Tags relevantes (máximo de 5).
  2. Uma prioridade apropriada (escolha entre: Alta, Media, Baixa).
  3. Potenciais responsáveis pela tarefa (máximo de 2 nomes da lista de membros da equipe fornecida).

  Descrição da Tarefa:
  {{{taskDescription}}}

  Membros da Equipe Disponíveis:
  {{#each teamMembers}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Responda no formato JSON especificado. Certifique-se de que os valores de prioridade e os nomes dos responsáveis correspondam exatamente às opções fornecidas.
  Para os responsáveis, escolha nomes da lista "Membros da Equipe Disponíveis".
  `,
});

const suggestTaskDetailsFlow = ai.defineFlow(
  {
    name: 'suggestTaskDetailsFlow',
    inputSchema: SuggestTaskDetailsInputSchema,
    outputSchema: SuggestTaskDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestTaskDetailsPrompt(input);
     if (!output) {
      throw new Error("A IA não conseguiu gerar sugestões válidas.");
    }
    // Garantir que a prioridade seja uma das três opções válidas, mesmo que a IA sugira algo ligeiramente diferente.
    // E que os assignees sejam da lista.
    const validPriorities = ['Alta', 'Media', 'Baixa'];
    let finalPriority = output.priority;
    if (!validPriorities.includes(finalPriority as string)) {
        // Tenta um match case-insensitive ou default para Média
        const lowerCasePriority = finalPriority.toLowerCase();
        if (lowerCasePriority.includes('alta') || lowerCasePriority.includes('high')) finalPriority = 'Alta';
        else if (lowerCasePriority.includes('baixa') || lowerCasePriority.includes('low')) finalPriority = 'Baixa';
        else finalPriority = 'Media';
    }
    
    const finalAssignees = output.assignees.filter(assigneeName => input.teamMembers.includes(assigneeName));

    return {
        ...output,
        priority: finalPriority as 'Alta' | 'Media' | 'Baixa',
        assignees: finalAssignees.slice(0,2), // Garante máximo de 2
        tags: output.tags.slice(0,5), // Garante máximo de 5
    };
  }
);
