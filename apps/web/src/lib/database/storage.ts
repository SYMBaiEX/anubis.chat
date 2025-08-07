/**
 * Database Storage Abstraction Layer
 * Provides a clean interface for document and user data storage
 * Supports both in-memory (development) and production database backends
 */

import type {
  Document,
  DocumentSearchRequest,
  DocumentSearchResult,
} from '@/lib/types/documents';
import { ConvexStorage } from './convex-storage';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('storage');

export interface StorageBackend {
  // Document operations
  createDocument(document: Document): Promise<Document>;
  getDocument(id: string): Promise<Document | null>;
  updateDocument(
    id: string,
    updates: Partial<Document>
  ): Promise<Document | null>;
  deleteDocument(id: string): Promise<boolean>;

  // User document associations
  getUserDocuments(
    walletAddress: string,
    options?: {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
    }
  ): Promise<{
    documents: Document[];
    total: number;
  }>;

  // Document access control
  canAccessDocument(
    walletAddress: string,
    documentId: string
  ): Promise<boolean>;
  addDocumentToUser(walletAddress: string, documentId: string): Promise<void>;
  removeDocumentFromUser(
    walletAddress: string,
    documentId: string
  ): Promise<void>;

  // Search operations
  searchDocuments(
    walletAddress: string,
    query: string,
    options: DocumentSearchRequest
  ): Promise<DocumentSearchResult[]>;

  // JWT blacklist operations
  blacklistToken(tokenId: string, expiresAt: number): Promise<void>;
  isTokenBlacklisted(tokenId: string): Promise<boolean>;
  cleanupExpiredTokens(): Promise<number>;

  // Nonce operations
  storeNonce(
    publicKey: string,
    nonce: string,
    expiresAt: number
  ): Promise<void>;
  validateAndRemoveNonce(publicKey: string, nonce: string): Promise<boolean>;
  cleanupExpiredNonces(): Promise<number>;

  // Health check
  isHealthy(): Promise<boolean>;
  close?(): Promise<void>;
}

/**
 * In-Memory Storage Implementation (Development)
 * Not suitable for production use - data is lost on server restart
 */
export class InMemoryStorage implements StorageBackend {
  private documents = new Map<string, Document>();
  private userDocuments = new Map<string, Set<string>>();
  private blacklistedTokens = new Map<string, number>(); // tokenId -> expiresAt
  private nonces = new Map<string, { nonce: string; expires: number }>();

  constructor() {
    // Start cleanup intervals
    this.startCleanupIntervals();
  }

  private startCleanupIntervals() {
    // Cleanup expired tokens every 5 minutes
    setInterval(
      () => {
        this.cleanupExpiredTokens();
      },
      5 * 60 * 1000
    );

    // Cleanup expired nonces every 5 minutes
    setInterval(
      () => {
        this.cleanupExpiredNonces();
      },
      5 * 60 * 1000
    );
  }

  async createDocument(document: Document): Promise<Document> {
    this.documents.set(document.id, document);
    return document;
  }

  async getDocument(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  async updateDocument(
    id: string,
    updates: Partial<Document>
  ): Promise<Document | null> {
    const existing = this.documents.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  async getUserDocuments(
    walletAddress: string,
    options: {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
    } = {}
  ): Promise<{ documents: Document[]; total: number }> {
    const { page = 1, limit = 10, category, search } = options;
    const documentIds = this.userDocuments.get(walletAddress) || new Set();

    let documents = Array.from(documentIds)
      .map((id) => this.documents.get(id))
      .filter((doc): doc is Document => doc !== undefined)
      .sort((a, b) => b.createdAt - a.createdAt);

    // Apply filters
    if (category) {
      documents = documents.filter(
        (doc) => doc.metadata?.category === category
      );
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      documents = documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchTerm) ||
          doc.content.toLowerCase().includes(searchTerm) ||
          doc.metadata?.tags?.some((tag) =>
            tag.toLowerCase().includes(searchTerm)
          )
      );
    }

    const total = documents.length;
    const offset = (page - 1) * limit;
    const paginatedDocs = documents.slice(offset, offset + limit);

    return { documents: paginatedDocs, total };
  }

  async canAccessDocument(
    walletAddress: string,
    documentId: string
  ): Promise<boolean> {
    const document = this.documents.get(documentId);
    return document ? document.ownerId === walletAddress : false;
  }

  async addDocumentToUser(
    walletAddress: string,
    documentId: string
  ): Promise<void> {
    if (!this.userDocuments.has(walletAddress)) {
      this.userDocuments.set(walletAddress, new Set());
    }
    this.userDocuments.get(walletAddress)!.add(documentId);
  }

  async removeDocumentFromUser(
    walletAddress: string,
    documentId: string
  ): Promise<void> {
    const userDocs = this.userDocuments.get(walletAddress);
    if (userDocs) {
      userDocs.delete(documentId);
      if (userDocs.size === 0) {
        this.userDocuments.delete(walletAddress);
      }
    }
  }

  async searchDocuments(
    walletAddress: string,
    query: string,
    options: DocumentSearchRequest
  ): Promise<DocumentSearchResult[]> {
    const userDocIds = this.userDocuments.get(walletAddress) || new Set();
    const searchTerms = query.toLowerCase().split(/\s+/);
    const results: DocumentSearchResult[] = [];

    for (const docId of userDocIds) {
      const doc = this.documents.get(docId);
      if (!doc) continue;

      // Apply filters
      if (options.filters?.type && !options.filters.type.includes(doc.type)) {
        continue;
      }

      if (
        options.filters?.category &&
        doc.metadata?.category &&
        !options.filters.category.includes(doc.metadata.category)
      ) {
        continue;
      }

      if (options.filters?.tags && doc.metadata?.tags) {
        const hasMatchingTag = options.filters.tags.some((filterTag) =>
          doc.metadata?.tags?.includes(filterTag)
        );
        if (!hasMatchingTag) {
          continue;
        }
      }

      // Calculate search score
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();

      let score = 0;
      const titleHighlights: string[] = [];
      const contentHighlights: string[] = [];

      for (const term of searchTerms) {
        if (titleLower.includes(term)) {
          score += 3;
          titleHighlights.push(term);
        }

        const contentMatches = (contentLower.match(new RegExp(term, 'g')) || [])
          .length;
        score += contentMatches;

        if (contentMatches > 0) {
          contentHighlights.push(term);
        }

        if (
          doc.metadata?.tags?.some((tag) => tag.toLowerCase().includes(term))
        ) {
          score += 2;
        }
      }

      const normalizedScore = Math.min(1, score / (searchTerms.length * 5));
      if (normalizedScore < (options.similarity?.threshold || 0.1)) {
        continue;
      }

      results.push({
        document: doc,
        score: normalizedScore,
        highlights: {
          title: titleHighlights.length > 0 ? titleHighlights : undefined,
          content: contentHighlights.length > 0 ? contentHighlights : undefined,
        },
      });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit || 10);
  }

  async blacklistToken(tokenId: string, expiresAt: number): Promise<void> {
    this.blacklistedTokens.set(tokenId, expiresAt);
  }

  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    const expiresAt = this.blacklistedTokens.get(tokenId);
    if (!expiresAt) return false;

    if (Date.now() > expiresAt) {
      this.blacklistedTokens.delete(tokenId);
      return false;
    }

    return true;
  }

  async cleanupExpiredTokens(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [tokenId, expiresAt] of this.blacklistedTokens.entries()) {
      if (now > expiresAt) {
        this.blacklistedTokens.delete(tokenId);
        cleaned++;
      }
    }

    return cleaned;
  }

  async storeNonce(
    publicKey: string,
    nonce: string,
    expiresAt: number
  ): Promise<void> {
    this.nonces.set(publicKey, { nonce, expires: expiresAt });
  }

  async validateAndRemoveNonce(
    publicKey: string,
    nonce: string
  ): Promise<boolean> {
    const stored = this.nonces.get(publicKey);
    if (!stored) return false;

    if (Date.now() > stored.expires || stored.nonce !== nonce) {
      this.nonces.delete(publicKey);
      return false;
    }

    this.nonces.delete(publicKey);
    return true;
  }

  async cleanupExpiredNonces(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [publicKey, stored] of this.nonces.entries()) {
      if (now > stored.expires) {
        this.nonces.delete(publicKey);
        cleaned++;
      }
    }

    return cleaned;
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}

/**
 * Storage Factory
 * Creates appropriate storage backend based on environment
 */
export function createStorage(): StorageBackend {
  const storageType = process.env.STORAGE_TYPE || 'memory';

  switch (storageType.toLowerCase()) {
    case 'memory':
      return new InMemoryStorage();

    case 'convex':
      return new ConvexStorage();

    case 'postgresql':
      // TODO: Implement PostgreSQL backend
      throw new Error('PostgreSQL storage not yet implemented');

    case 'supabase':
      // TODO: Implement Supabase backend
      throw new Error('Supabase storage not yet implemented');

    case 'mongodb':
      // TODO: Implement MongoDB backend
      throw new Error('MongoDB storage not yet implemented');

    default:
      log.warn('Unknown storage type, falling back to in-memory', { storageType });
      return new InMemoryStorage();
  }
}

// Singleton storage instance
let storageInstance: StorageBackend | null = null;

export function getStorage(): StorageBackend {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
}

// Cleanup function for graceful shutdown
export async function closeStorage(): Promise<void> {
  if (storageInstance && storageInstance.close) {
    await storageInstance.close();
    storageInstance = null;
  }
}
