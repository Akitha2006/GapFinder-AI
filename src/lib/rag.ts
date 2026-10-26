import { db } from './db';
import { supabase, isSupabaseConfigured } from './supabase';
import { getAIProvider } from './gemini';

export interface RetrievedChunk {
  id: string;
  document_id: string;
  doc_name: string;
  page_number?: number;
  section_title?: string;
  content: string;
  similarity: number;
}

/**
 * Computes cosine similarity between two numeric vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * RAG Search: Retrieves top-K chunks grounded in the user's uploaded materials for a subject
 */
export async function retrieveRelevantChunks(params: {
  subjectId: string;
  userId: string;
  query: string;
  limit?: number;
}): Promise<RetrievedChunk[]> {
  const { subjectId, userId, query, limit = 5 } = params;
  const { provider } = getAIProvider();

  // Generate embedding for query
  const queryEmbedding = await provider.createEmbedding(query);

  // 1. Try Supabase pgvector RPC if connected
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_count: limit,
        filter_subject_id: subjectId,
        filter_user_id: userId,
      });

      if (!error && data && data.length > 0) {
        // Fetch document names
        const docs = await db.getDocuments(subjectId, userId);
        const docMap = new Map(docs.map(d => [d.id, d.name]));

        return data.map((item: {
          id: string;
          document_id: string;
          page_number?: number;
          section_title?: string;
          content: string;
          similarity: number;
        }) => ({
          id: item.id,
          document_id: item.document_id,
          doc_name: docMap.get(item.document_id) || 'Uploaded Material',
          page_number: item.page_number,
          section_title: item.section_title,
          content: item.content,
          similarity: Number(item.similarity.toFixed(4)),
        }));
      }
    } catch (err) {
      console.warn('Supabase vector RPC fallback to local retrieval:', err);
    }
  }

  // 2. Local store semantic + keyword fallback
  const allChunks = await db.getChunksBySubject(subjectId, userId);
  const docs = await db.getDocuments(subjectId, userId);
  const docMap = new Map(docs.map(d => [d.id, d.name]));

  if (allChunks.length === 0) {
    return [];
  }

  // Score each chunk using embedding similarity + keyword bonus
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const scored = await Promise.all(
    allChunks.map(async chunk => {
      const chunkEmbedding = await provider.createEmbedding(chunk.content);
      const semScore = cosineSimilarity(queryEmbedding, chunkEmbedding);

      // Simple keyword term match bonus
      const lowerContent = chunk.content.toLowerCase();
      let keywordMatches = 0;
      for (const w of queryWords) {
        if (lowerContent.includes(w)) keywordMatches++;
      }
      const keywordScore = queryWords.length > 0 ? (keywordMatches / queryWords.length) * 0.3 : 0;

      const totalScore = semScore * 0.7 + keywordScore;

      return {
        id: chunk.id,
        document_id: chunk.document_id,
        doc_name: docMap.get(chunk.document_id) || 'Uploaded Document',
        page_number: chunk.page_number,
        section_title: chunk.section_title,
        content: chunk.content,
        similarity: Number(totalScore.toFixed(4)),
      };
    })
  );

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit);
}
