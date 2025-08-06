/**
 * Convex Storage Backend Implementation
 * Implements the StorageBackend interface using Convex for production-ready storage
 */

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { ConvexHttpClient } from 'convex/browser';
import type {
  Document,
  DocumentSearchRequest,
  DocumentSearchResult,
} from '@/lib/types/documents';
import type { StorageBackend } from './storage';

export class ConvexStorage implements StorageBackend {
  private client: ConvexHttpClient;

  constructor(convexUrl?: string) {
    const url = convexUrl || process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error('Convex URL is required. Set NEXT_PUBLIC_CONVEX_URL environment variable.');
    }
    this.client = new ConvexHttpClient(url);
  }

  async createDocument(document: Document): Promise<Document> {
    try {
      const convexDoc = await this.client.mutation(api.documents.create, {
        title: document.title,
        content: document.content,
        type: document.type,
        ownerId: document.ownerId,
        metadata: document.metadata,
      });

      if (!convexDoc) {
        throw new Error('Document creation failed - no document returned');
      }
      return this.convertFromConvexDocument(convexDoc);
    } catch (error) {
      console.error('Failed to create document in Convex:', error);
      throw new Error('Failed to create document');
    }
  }

  async getDocument(id: string): Promise<Document | null> {
    try {
      const convexDoc = await this.client.query(api.documents.getById, {
        id: id as Id<'documents'>,
      });

      return convexDoc ? this.convertFromConvexDocument(convexDoc) : null;
    } catch (error) {
      console.error('Failed to get document from Convex:', error);
      return null;
    }
  }

  async updateDocument(
    id: string,
    updates: Partial<Document>
  ): Promise<Document | null> {
    try {
      if (!updates.ownerId) {
        throw new Error('ownerId is required for document updates');
      }

      const convexDoc = await this.client.mutation(api.documents.update, {
        id: id as Id<'documents'>,
        ownerId: updates.ownerId,
        title: updates.title,
        content: updates.content,
        metadata: updates.metadata,
      });

      return convexDoc ? this.convertFromConvexDocument(convexDoc) : null;
    } catch (error) {
      console.error('Failed to update document in Convex:', error);
      throw new Error('Failed to update document');
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    try {
      // We need the ownerId for authorization, but we can't get it without the document
      // This is a limitation of the current interface - in production we'd pass ownerId
      const doc = await this.getDocument(id);
      if (!doc) return false;

      await this.client.mutation(api.documents.remove, {
        id: id as Id<'documents'>,
        ownerId: doc.ownerId,
      });

      return true;
    } catch (error) {
      console.error('Failed to delete document in Convex:', error);
      return false;
    }
  }

  async getUserDocuments(
    walletAddress: string,
    options?: {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
    }
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      if (options?.search) {
        // Use search function for text search
        const results = await this.client.query(api.documents.search, {
          ownerId: walletAddress,
          query: options.search,
          limit: options.limit,
        });

        return {
          documents: results.map((doc: Doc<'documents'>) =>
            this.convertFromConvexDocument(doc)
          ),
          total: results.length, // Search doesn't provide total count
        };
      }
      // Use regular query with pagination
      const result = await this.client.query(api.documents.getByOwner, {
        ownerId: walletAddress,
        page: options?.page,
        limit: options?.limit,
        category: options?.category,
      });

      return {
        documents: result.documents.map((doc: Doc<'documents'>) =>
          this.convertFromConvexDocument(doc)
        ),
        total: result.pagination.total,
      };
    } catch (error) {
      console.error('Failed to get user documents from Convex:', error);
      return { documents: [], total: 0 };
    }
  }

  async canAccessDocument(
    walletAddress: string,
    documentId: string
  ): Promise<boolean> {
    try {
      const doc = await this.getDocument(documentId);
      return doc ? doc.ownerId === walletAddress : false;
    } catch (error) {
      console.error('Failed to check document access in Convex:', error);
      return false;
    }
  }

  async addDocumentToUser(
    walletAddress: string,
    documentId: string
  ): Promise<void> {
    // With Convex, documents are already associated with users via ownerId
    // This method is not needed but kept for interface compatibility
  }

  async removeDocumentFromUser(
    walletAddress: string,
    documentId: string
  ): Promise<void> {
    // With Convex, removing the document itself handles the association
    // This method is not needed but kept for interface compatibility
  }

  async searchDocuments(
    walletAddress: string,
    query: string,
    options: DocumentSearchRequest
  ): Promise<DocumentSearchResult[]> {
    try {
      const results = await this.client.query(api.documents.search, {
        ownerId: walletAddress,
        query,
        limit: options.limit,
        type: options.filters?.type?.[0] as 'text' | 'pdf' | 'markdown' | 'url' | 'json' | 'csv' | undefined, // Convex function expects single type
      });

      // Convert to DocumentSearchResult format
      return results.map((doc: Doc<'documents'>) => ({
        document: this.convertFromConvexDocument(doc),
        score: this.calculateSearchScore(doc, query),
        highlights: this.extractHighlights(doc, query),
      }));
    } catch (error) {
      console.error('Failed to search documents in Convex:', error);
      return [];
    }
  }

  async blacklistToken(tokenId: string, expiresAt: number): Promise<void> {
    try {
      // Extract userId from tokenId or use a default - this would need better implementation
      const userId = 'system'; // This is a limitation of the current interface

      await this.client.mutation(api.auth.blacklistToken, {
        tokenId,
        userId,
        expiresAt,
      });
    } catch (error) {
      console.error('Failed to blacklist token in Convex:', error);
      throw new Error('Failed to blacklist token');
    }
  }

  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    try {
      return await this.client.query(api.auth.isTokenBlacklisted, { tokenId });
    } catch (error) {
      console.error('Failed to check token blacklist in Convex:', error);
      return false;
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.client.mutation(api.auth.cleanupExpiredTokens);
      return result.cleaned;
    } catch (error) {
      console.error('Failed to cleanup expired tokens in Convex:', error);
      return 0;
    }
  }

  async storeNonce(
    publicKey: string,
    nonce: string,
    expiresAt: number
  ): Promise<void> {
    try {
      await this.client.mutation(api.auth.storeNonce, {
        publicKey,
        nonce,
        expiresAt,
      });
    } catch (error) {
      console.error('Failed to store nonce in Convex:', error);
      throw new Error('Failed to store nonce');
    }
  }

  async validateAndRemoveNonce(
    publicKey: string,
    nonce: string
  ): Promise<boolean> {
    try {
      return await this.client.mutation(api.auth.validateAndRemoveNonce, {
        publicKey,
        nonce,
      });
    } catch (error) {
      console.error('Failed to validate nonce in Convex:', error);
      return false;
    }
  }

  async cleanupExpiredNonces(): Promise<number> {
    try {
      const result = await this.client.mutation(api.auth.cleanupExpiredNonces);
      return result.cleaned;
    } catch (error) {
      console.error('Failed to cleanup expired nonces in Convex:', error);
      return 0;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.query(api.healthCheck.get);
      return true;
    } catch (error) {
      console.error('Convex health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    // ConvexHttpClient doesn't need explicit cleanup
  }

  // Helper methods
  private convertFromConvexDocument(convexDoc: Doc<'documents'>): Document {
    return {
      id: convexDoc._id,
      title: convexDoc.title,
      content: convexDoc.content,
      type: convexDoc.type,
      ownerId: convexDoc.ownerId,
      metadata: convexDoc.metadata,
      createdAt: convexDoc.createdAt,
      updatedAt: convexDoc.updatedAt,
    };
  }

  private calculateSearchScore(doc: Doc<'documents'>, query: string): number {
    const searchTerms = query.toLowerCase().split(/\s+/);
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();

    let score = 0;

    for (const term of searchTerms) {
      if (titleLower.includes(term)) {
        score += 5; // Higher weight for title matches
      }

      const contentMatches = (contentLower.match(new RegExp(term, 'g')) || [])
        .length;
      score += contentMatches;

      if (
        doc.metadata?.tags?.some((tag: string) =>
          tag.toLowerCase().includes(term)
        )
      ) {
        score += 2;
      }
    }

    return Math.min(1, score / (searchTerms.length * 8));
  }

  private extractHighlights(
    doc: Doc<'documents'>,
    query: string
  ): { title?: string[]; content?: string[] } {
    const searchTerms = query.toLowerCase().split(/\s+/);
    const titleHighlights = searchTerms.filter((term) =>
      doc.title.toLowerCase().includes(term)
    );
    const contentHighlights = searchTerms.filter((term) =>
      doc.content.toLowerCase().includes(term)
    );

    return {
      title: titleHighlights.length > 0 ? titleHighlights : undefined,
      content: contentHighlights.length > 0 ? contentHighlights : undefined,
    };
  }
}
