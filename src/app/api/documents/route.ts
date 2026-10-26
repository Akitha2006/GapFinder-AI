import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractTextFromBuffer, chunkDocumentText } from '@/lib/document-processor';
import { getAIProvider } from '@/lib/gemini';
import { DocumentCategory } from '@/types';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId parameter is required' }, { status: 400 });
    }

    const documents = await db.getDocuments(subjectId, userId);
    return NextResponse.json({ documents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching documents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as DocumentCategory) || 'notes';
    const subjectId = formData.get('subjectId') as string | null;

    if (!file || !subjectId) {
      return NextResponse.json({ error: 'Both file and subjectId are required.' }, { status: 400 });
    }

    // Validate size (max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 25MB.' }, { status: 400 });
    }

    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension !== 'pdf' && extension !== 'txt') {
      return NextResponse.json({ error: 'Unsupported file format. Please upload a PDF or TXT file.' }, { status: 400 });
    }

    // 1. Initial Document Record (Uploaded status)
    const docRecord = await db.createDocument({
      user_id: userId,
      subject_id: subjectId,
      name: fileName,
      file_type: extension as 'pdf' | 'txt',
      category,
      status: 'processing',
      file_size: file.size,
      page_count: 1,
    });

    try {
      // 2. Read bytes into Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 3. Extract text
      const { text, pageCount } = await extractTextFromBuffer(buffer, extension as 'pdf' | 'txt');

      if (!text || text.trim().length === 0) {
        throw new Error('Extracted text is empty. Document may be scanned or unreadable.');
      }

      // 4. Chunk text
      const chunks = chunkDocumentText(text, pageCount);

      // 5. Save chunks
      const chunkRecords = chunks.map(c => ({
        document_id: docRecord.id,
        subject_id: subjectId,
        user_id: userId,
        chunk_index: c.chunkIndex,
        page_number: c.pageNumber,
        section_title: c.sectionTitle,
        content: c.content,
      }));
      await db.saveChunks(chunkRecords);

      // 6. Update document status to ready
      await db.updateDocumentStatus(docRecord.id, userId, 'ready', {
        extracted_text: text.slice(0, 5000), // store preview
        page_count: pageCount,
      });

      // 7. If this is a syllabus, extract topics automatically
      if (category === 'syllabus') {
        try {
          const { provider } = getAIProvider();
          const extractedTopics = await provider.extractTopics(text);
          if (extractedTopics && extractedTopics.length > 0) {
            const mappedTopics = extractedTopics.map((t, idx) => ({
              subject_id: subjectId,
              user_id: userId,
              unit_number: t.unit_number || `Unit ${idx + 1}`,
              unit_name: t.unit_name || 'Core Syllabus',
              topic_name: t.topic_name,
              subtopics: t.subtopics || [],
              source_doc_id: docRecord.id,
              source_page: 1,
            }));
            await db.saveTopics(mappedTopics);
          }
        } catch (topicErr) {
          console.warn('Automatic syllabus topic extraction warning:', topicErr);
        }
      }

      return NextResponse.json({
        success: true,
        documentId: docRecord.id,
        chunksCreated: chunks.length,
        pageCount,
      }, { status: 201 });
    } catch (procErr: unknown) {
      const errMsg = procErr instanceof Error ? procErr.message : 'Processing failure';
      await db.updateDocumentStatus(docRecord.id, userId, 'failed', { error_message: errMsg });
      return NextResponse.json({ error: errMsg, documentId: docRecord.id }, { status: 422 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server upload error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'demo-student-uuid-42';
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document id is required' }, { status: 400 });
    }

    const success = await db.deleteDocument(id, userId);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
