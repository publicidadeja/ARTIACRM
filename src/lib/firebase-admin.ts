// ARQUIVO DE COMPATIBILIDADE TEMPORÁRIA
// Este arquivo não usa o Firebase Admin real, mas simula sua interface
// para compatibilidade durante a transição para o sistema MySQL

import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// Interface compatível com o Firebase Admin
const auth = {
  // Método para verificar tokens
  verifyIdToken: async (token: string, req?: NextRequest) => {
    console.log('Aviso: método verifyIdToken foi chamado; este método existe apenas para compatibilidade');
    
    if (!token || typeof token !== 'string') {
      throw new Error('Token inválido');
    }
    
    // Retornar um objeto similar ao que o Firebase retornaria
    return {
      uid: 'user-id-placeholder',
      email: 'user@example.com',
    };
  }
};

console.warn('AVISO: Este arquivo existe apenas como bridge para compatibilidade durante a transição para MySQL.');

export { auth }; 