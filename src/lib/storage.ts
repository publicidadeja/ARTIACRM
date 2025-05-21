import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Diretório base para armazenamento de arquivos
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Garantir que o diretório existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Salva um arquivo no armazenamento local
 * @param file O arquivo a ser salvo
 * @param folder (opcional) A pasta dentro de uploads/ onde o arquivo será salvo
 * @returns O caminho relativo do arquivo salvo
 */
export async function saveFile(file: Buffer, filename: string, folder: string = ''): Promise<string> {
  // Cria um nome único para o arquivo
  const fileExt = path.extname(filename);
  const uniqueFilename = `${uuidv4()}${fileExt}`;
  
  // Cria o diretório se não existir
  const targetDir = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Caminho completo onde o arquivo será salvo
  const filePath = path.join(targetDir, uniqueFilename);
  
  // Salva o arquivo
  fs.writeFileSync(filePath, file);
  
  // Retorna o caminho relativo a partir da pasta uploads
  return path.join(folder, uniqueFilename);
}

/**
 * Obtém o caminho completo para um arquivo
 * @param filePath O caminho relativo do arquivo (retornado por saveFile)
 * @returns O caminho absoluto do arquivo
 */
export function getFilePath(filePath: string): string {
  return path.join(UPLOAD_DIR, filePath);
}

/**
 * Exclui um arquivo do armazenamento local
 * @param filePath O caminho relativo do arquivo (retornado por saveFile)
 */
export function deleteFile(filePath: string): void {
  const fullPath = getFilePath(filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/**
 * Lê um arquivo do armazenamento local
 * @param filePath O caminho relativo do arquivo (retornado por saveFile)
 * @returns O conteúdo do arquivo
 */
export function readFile(filePath: string): Buffer {
  const fullPath = getFilePath(filePath);
  return fs.readFileSync(fullPath);
} 