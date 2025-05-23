# Artia App

Aplicação de gerenciamento para Artia usando MySQL e armazenamento local de arquivos.

## Configuração Inicial

### Configuração do Banco de Dados

1. Crie um banco de dados MySQL no XAMPP ou em seu servidor
2. Configure as credenciais no arquivo `.env`:

```bash
# Para desenvolvimento local com XAMPP
DATABASE_URL="mysql://root:@localhost:3306/artia"

# Para produção no CyberPanel
DATABASE_URL="mysql://usuario:senha@seu_host:3306/nome_do_banco"
```

### Configuração da Autenticação

O sistema usa NextAuth para autenticação com credenciais locais. Configure o segredo e URL:

```bash
# Gere um segredo usando o comando:
npm run generate:secret

# Adicione ao arquivo .env
NEXTAUTH_SECRET="seu_segredo_gerado"
NEXTAUTH_URL="http://localhost:9002"
```

## Instalação e Execução

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Execute as migrações do banco de dados:
   ```bash
   npx prisma migrate dev
   ```

3. Crie o usuário administrador:
   ```bash
   npm run create:admin
   ```

4. Crie dados de exemplo (opcional):
   ```bash
   npm run create:sample
   ```

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

6. Acesse o sistema em: http://localhost:9002

## Credenciais de Acesso

- **Email**: admin@artia.com
- **Senha**: artiaadmin

## Armazenamento de Arquivos

Os arquivos são armazenados localmente na pasta `uploads/` dentro do diretório do projeto. O sistema gerencia automaticamente esta pasta.

## Implantação em Produção

1. Configure o MySQL no CyberPanel
2. Defina as variáveis de ambiente corretas em .env
3. Crie a pasta `uploads` e conceda permissões de escrita
4. Execute as migrações e crie o usuário administrador
5. Construa e inicie a aplicação
#   A R T I A C R M  
 