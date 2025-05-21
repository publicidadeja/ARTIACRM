import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: '/login',
    error: '/login',  // Redirecionar erros para a página de login
  },
  debug: true, // Adicionar para depuração
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Credenciais não fornecidas");
          return null;
        }

        try {
          console.log("Tentando autenticar:", credentials.email);
          // Buscar o usuário pelo email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          
          if (!user) {
            console.log("Usuário não encontrado:", credentials.email);
            return null;
          }

          console.log("Usuário encontrado:", user.email, "Comparando senha com:", credentials.password);

          // Usando admin@artia.com com senha artiaadmin para simplificar o login inicial
          if (credentials.email === 'admin@artia.com' && credentials.password === 'artiaadmin') {
            console.log("Login de administrador bem-sucedido");
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role || 'user',
            };
          }
          
          // Para usuários normais, verificar a senha
          if (user.password === credentials.password) { 
            console.log("Login de usuário bem-sucedido:", user.email);
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role || 'user',
            };
          }
          
          console.log("Senha incorreta para:", credentials.email);
          return null;
        } catch (error) {
          console.error('Erro na autenticação:', error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        // Corrigindo o erro de tipagem com uma abordagem segura
        token.role = (user as any).role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string; 
        session.user.name = token.name as string;
        session.user.role = (token as any).role || 'user';
      }
      return session;
    },
  },
}; 