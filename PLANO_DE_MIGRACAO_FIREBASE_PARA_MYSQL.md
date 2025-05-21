# Plano de Migração do Firebase para MySQL/VPS

Este documento apresenta o plano detalhado para migrar todas as funcionalidades do Firebase para o MySQL e servidor VPS próprio. O objetivo é eliminar completamente a dependência do Firebase (Auth, Firestore, Storage) e substituir por soluções próprias.

## 1. Infraestrutura e Configuração

1. **Configuração do MySQL**
   - Garantir que o banco MySQL esteja configurado no VPS
   - Verificar e otimizar esquemas de tabelas para corresponder aos modelos usados no Firestore
   - Configurar backups automáticos

2. **Configuração do Servidor de Arquivos**
   - Configurar diretório para upload de arquivos no VPS
   - Configurar permissões de acesso aos arquivos
   - Implementar sistema de nomes de arquivos único para evitar colisões

3. **Sistema de Autenticação**
   - Garantir que o NextAuth esteja configurado corretamente
   - Configurar provedores de autenticação necessários (credentials, email, etc.)
   - Implementar estratégias de JWT e sessão

## 2. APIs RESTful

Implementar as seguintes APIs RESTful para substituir as chamadas do Firebase:

1. **Autenticação**
   - `/api/auth/register` - Criar novos usuários
   - `/api/auth/reset-password` - Resetar senha de usuários
   - `/api/auth/update-profile` - Atualizar perfil de usuários

2. **Usuários**
   - `/api/users` - CRUD de usuários
   - `/api/users/[id]` - Operações em usuários específicos

3. **Upload de Arquivos**
   - `/api/upload-avatar` - Upload de avatares de usuário
   - `/api/upload` - Upload de arquivos gerais

4. **Tarefas**
   - `/api/tasks` - CRUD de tarefas
   - `/api/tasks/[id]` - Operações em tarefas específicas
   - `/api/tasks/[id]/comments` - Comentários em tarefas
   - `/api/tasks/[id]/attachments` - Anexos em tarefas

5. **AI Content**
   - `/api/ai/generate` - Geração de conteúdo via IA
   - `/api/ai/agents` - Gerenciamento de agentes de IA

## 3. Arquivos para Migração

### Componentes de Aplicação

1. **Header.tsx**
   ```
   Substituir:
   - Importação de firebase/auth e lib/firebase
   - Método signOut do Firebase
   
   Por:
   - Método signOut do NextAuth
   - Remover importações do Firebase
   ```

2. **AIContentCreationForm.tsx**
   ```
   Substituir:
   - Importações do Firestore
   - Consultas usando collection, getDocs, query, etc.
   
   Por:
   - Chamadas fetch para as APIs REST correspondentes
   - Remover importações do Firebase
   ```

### Páginas de Autenticação

3. **register/page.tsx**
   ```
   Substituir:
   - Importações de firebase/auth e lib/firebase
   - createUserWithEmailAndPassword e updateProfile
   
   Por:
   - Chamada fetch para API /api/auth/register
   - Remover importações do Firebase
   ```

4. **forgot-password/page.tsx**
   ```
   Substituir:
   - Importações de firebase/auth e lib/firebase
   - sendPasswordResetEmail
   
   Por:
   - Chamada fetch para API /api/auth/reset-password
   - Remover importações do Firebase
   ```

### Páginas da Aplicação

5. **profile/page.tsx**
   ```
   Substituir:
   - Importações de firebase/auth, lib/firebase e firebase/storage
   - updateProfile, uploadBytes, getDownloadURL, etc.
   
   Por:
   - Chamada fetch para API /api/auth/update-profile e /api/upload-avatar
   - Remover importações do Firebase
   ```

6. **dashboard/page.tsx**
   ```
   Substituir:
   - Uso de useAuth para currentUser
   
   Por:
   - useSession do NextAuth
   - Chamadas fetch para as APIs REST
   ```

7. **admin/users/page.tsx**
   ```
   Substituir:
   - Uso de useAuth para currentUser e isAdministrator
   
   Por:
   - useSession do NextAuth
   - Verificação de role via NextAuth
   ```

8. **tasks/[id]/page.tsx**
   ```
   Substituir:
   - Referências a currentUser
   
   Por:
   - useSession do NextAuth
   ```

### Arquivos de Biblioteca

9. **contexts/AuthContext.tsx**
   ```
   Substituir:
   - Compatibilidade com Firebase (uid e propriedades semelhantes)
   
   Por:
   - Uso exclusivo do NextAuth
   - Remover mapeamentos de propriedades Firebase
   ```

10. **lib/firebase.ts e lib/firebase-admin.ts**
    ```
    Estes arquivos podem ser completamente removidos após a migração
    ```

### Scripts de Migração

11. **scripts/migrate-data.ts**
    ```
    Atualizar para usar:
    - Conexão direta com MySQL ou
    - Prisma para acesso ao banco
    - Remover referências ao Firebase
    ```

### Tipos

12. **types/index.ts**
    ```
    Atualizar:
    - Remover referências a IDs do Firebase
    - Utilizar UUIDs ou auto-incremento do MySQL
    ```

## 4. Estratégia de Migração

1. **Banco de Dados**
   - Migrar dados do Firestore para MySQL
   - Verificar integridade dos dados após migração
   - Manter backups do Firestore durante a transição

2. **Autenticação**
   - Migrar usuários do Firebase Auth para NextAuth
   - Garantir que tokens e sessões funcionem corretamente
   - Implementar processo de recuperação de senha

3. **Armazenamento de Arquivos**
   - Migrar arquivos do Firebase Storage para o servidor de arquivos
   - Atualizar referências aos arquivos no banco de dados

4. **Testes**
   - Testar cada componente após a migração
   - Verificar fluxos de autenticação
   - Testar upload e download de arquivos
   - Verificar integridade dos dados

5. **Implantação**
   - Realizar implantação em ambiente de teste
   - Validar todas as funcionalidades
   - Migrar para produção de forma gradual

## 5. Monitoramento e Análise

1. **Monitoramento**
   - Configurar logs e alertas no servidor VPS
   - Monitorar desempenho do banco de dados MySQL
   - Monitorar uso de disco para arquivos de upload

2. **Análise de Desempenho**
   - Analisar tempos de resposta das APIs
   - Otimizar consultas SQL se necessário
   - Considerar caching para operações frequentes

## 6. Conclusão

Esta migração eliminará completamente a dependência do Firebase, dando mais controle sobre os dados, autenticação e armazenamento. Além disso, potencialmente reduzirá custos a longo prazo e permitirá mais flexibilidade para personalizações futuras. 