// ARQUIVO DE COMPATIBILIDADE
// Este arquivo existe apenas para facilitar a transição do Firebase para o sistema local
// Ele fornece implementações vazias ou mock das funções do Firebase
import { FirebaseApp } from "firebase/app";
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from "firebase/storage";

// Armazenamento mock para dados do usuário
const userMockData = {
  uid: 'mock-user-1',
  email: 'admin@artia.com',
  displayName: 'Admin User',
  photoURL: null
};

// Objeto mock para o app
const app = {} as FirebaseApp;

// Mock para função updateProfile
export const updateProfile = async (user: any, profileData: any) => {
  console.log('Mock: updateProfile() chamado com dados:', profileData);
  
  // Atualizar o usuário no armazenamento mock
  Object.assign(userMockData, profileData);
  console.log('Perfil de usuário atualizado:', userMockData);
  
  return Promise.resolve();
};

// Objeto mock para auth
const auth = {
  get currentUser() {
    return {
      ...userMockData,
      getIdToken: async () => {
        // Gerar um token mock que será aceito pelo verifyIdToken no firebase-admin mock
        const now = Math.floor(Date.now() / 1000);
        const mockPayload = {
          uid: userMockData.uid,
          email: userMockData.email,
          displayName: userMockData.displayName,
          iat: now,
          exp: now + 3600,
        };
        
        // Criar um "token" simples (em produção seria um JWT real)
        // Basta ser uma string longa para passar na validação básica
        return `mock-firebase-token-${userMockData.uid}-${now}-${Math.random().toString(36).substring(2, 15)}`;
      }
    };
  },
  onAuthStateChanged: () => () => {},
  signInWithEmailAndPassword: async () => ({ user: { uid: '', email: '', displayName: '' } }),
  createUserWithEmailAndPassword: async () => ({ user: { uid: '', email: '', displayName: '' } }),
  signOut: async () => {},
} as unknown as Auth;

// Mock para funções do Firestore
export const collection = (db: any, collectionName: string) => {
  console.log(`Mock: collection('${collectionName}') chamado`);
  return {
    collectionName,
    // Funções de consulta simplificadas para compatibilidade
    where: () => query({}),
    orderBy: () => query({}),
  };
};

export const query = (queryObj: any) => {
  return {
    ...queryObj,
    where: () => query(queryObj),
    orderBy: () => query(queryObj),
  };
};

export const getDocs = async (q: any) => {
  console.log('Mock: getDocs() chamado');
  return {
    docs: [],
    empty: true,
  };
};

export const doc = (db: any, collectionName: string, id?: string) => {
  console.log(`Mock: doc('${collectionName}', '${id}') chamado`);
  return {
    collectionName,
    id,
  };
};

export const addDoc = async (collectionRef: any, data: any) => {
  console.log('Mock: addDoc() chamado com dados:', data);
  return {
    id: `mock-doc-id-${Date.now()}`,
  };
};

export const updateDoc = async (docRef: any, data: any) => {
  console.log(`Mock: updateDoc() chamado para doc ${docRef.id} com dados:`, data);
  return Promise.resolve();
};

export const serverTimestamp = () => {
  return new Date();
};

// Mock para funções do Storage
export const ref = (storage: any, path: string) => {
  console.log(`Mock: ref('${path}') chamado`);
  return {
    path,
    fullPath: path,
    name: path.split('/').pop(),
  };
};

export const storageRef = ref;

export const uploadBytes = async (ref: any, file: any) => {
  console.log(`Mock: uploadBytes() chamado para ref '${ref.path}' com arquivo de tamanho ${file.size || 'desconhecido'} bytes`);
  
  let uploadedUrl = '';
  const fileName = ref.path.split('/').pop();
  const userId = ref.path.split('/')[1]; // Assumindo formato 'avatars/{userId}/{fileName}'
  
  try {
    if (file instanceof Blob || file instanceof File) {
      // No cliente, criamos uma URL de objeto
      uploadedUrl = URL.createObjectURL(file);
      console.log(`Mock (cliente): Arquivo convertido para URL de objeto local: ${uploadedUrl}`);
      
      // Simular salvamento em localStorage
      const savedUploads = JSON.parse(localStorage.getItem('artiaUploads') || '{}');
      savedUploads[ref.path] = {
        url: uploadedUrl,
        name: file instanceof File ? file.name : 'blob-file',
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('artiaUploads', JSON.stringify(savedUploads));
      
      // Para permitir acesso público, usamos um URL público no formato /uploads/...
      uploadedUrl = `/uploads/avatars/${userId}_${fileName}`;
    }
  } catch (error) {
    console.error('Erro ao processar arquivo para upload mock:', error);
  }
  
  return {
    ref: {
      ...ref,
      getDownloadURL: async () => uploadedUrl || `https://placehold.co/200x200/E0F7FA/1C4A5C?text=MOCK`,
    },
    metadata: {
      name: file instanceof File ? file.name : 'blob-file',
      size: file.size || 0,
      contentType: file.type || 'application/octet-stream',
      fullPath: ref.path,
      downloadURL: uploadedUrl
    }
  };
};

export const getDownloadURL = async (ref: any) => {
  console.log(`Mock: getDownloadURL() chamado para ref '${ref.path}'`);
  
  const fileName = ref.path.split('/').pop();
  const userId = ref.path.split('/')[1]; // Assumindo formato 'avatars/{userId}/{fileName}'
  const publicUrl = `/uploads/avatars/${userId}_${fileName}`;
  
  // Tentar recuperar do localStorage (lado cliente)
  try {
    const savedUploads = JSON.parse(localStorage.getItem('artiaUploads') || '{}');
    if (savedUploads[ref.path]?.url) {
      return publicUrl; // Retorna URL pública em vez da URL de objeto
    }
  } catch (error) {
    console.error('Erro ao recuperar URL do localStorage:', error);
  }
  
  return publicUrl || `https://placehold.co/200x200/E0F7FA/1C4A5C?text=MOCK`;
};

export const deleteObject = async (ref: any) => {
  console.log(`Mock: deleteObject() chamado para ref '${ref.path}'`);
  
  const fileName = ref.path.split('/').pop();
  const userId = ref.path.split('/')[1]; 
  
  // Remover do localStorage se existir (cliente)
  try {
    const savedUploads = JSON.parse(localStorage.getItem('artiaUploads') || '{}');
    if (savedUploads[ref.path]) {
      const url = savedUploads[ref.path].url;
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      delete savedUploads[ref.path];
      localStorage.setItem('artiaUploads', JSON.stringify(savedUploads));
    }
  } catch (error) {
    console.error('Erro ao excluir objeto do localStorage:', error);
  }
  
  return Promise.resolve();
};

// Objeto mock para Firestore
const db = {
  collection: (collectionName: string) => collection(db, collectionName),
} as unknown as Firestore;

// Objeto mock para Storage
const storage = {
  ref: (path: string) => ref(storage, path),
} as unknown as FirebaseStorage;

// Aviso de que o Firebase está sendo removido
console.warn('AVISO: Firebase está sendo substituído por MySQL. Este arquivo existe apenas para compatibilidade temporária.');

export { app, auth, db, storage };
