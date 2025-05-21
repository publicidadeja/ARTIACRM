// Script para gerar um segredo seguro para NextAuth
const crypto = require('crypto');

// Gera um segredo aleatório equivalente ao comando: openssl rand -base64 32
const secret = crypto.randomBytes(32).toString('base64');

console.log('============================================');
console.log('Segredo gerado para NEXTAUTH_SECRET:');
console.log(secret);
console.log('============================================');
console.log('Adicione esta linha ao seu arquivo .env:');
console.log(`NEXTAUTH_SECRET="${secret}"`);
console.log('============================================'); 