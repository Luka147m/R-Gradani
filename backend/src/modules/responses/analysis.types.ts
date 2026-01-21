import { z } from "zod";
import { OpenAI } from "openai";
import { Prisma } from "@prisma/client";

export const analizaSchema = z.object({
    komentar: z.string(),
    usvojenost: z.boolean(), // je li komentar usvojen ili ne
    podudarnost: z.number(), // postotak podudarnosti 
});

export type AnalizaResult = z.infer<typeof analizaSchema>;

export type Statement = {
    id: number;
    text: string;
    category?: string;
    analysis?: AnalizaResult;
    flag?: boolean;
};

export type MessageStructure = {
    izjave: Statement[];
};

export type StructuredCommentRow = {
    komentarId: number;
    odgovorId: number;
    message: Prisma.JsonValue | null;
    skupId: string | null;
};

export type Resource = {
    id: string;
    url: string | null;
    name: string | null;
    format: string | null;
    mimetype: string | null;
    size: number | null;
};

export type SkupGroup = {
    skup_id: string;
    title: string | null;
    refresh_frequency: string | null;
    theme: string | null;
    description: string | null;
    url: string | null;
    license_title: string | null;
    tags: string[] | null;
    resources: Resource[] | null;
    comments: StructuredCommentRow[];
};

export type StructuredCommentDict = Record<string, SkupGroup>;

export type VectorStoreResult = {
    vectorStore: OpenAI.VectorStore;
    fileIds: string[];
};

export type VectorStoreError = {
    error: string;
    reason: 'no_resources' | 'all_files_too_large' | 'all_files_failed' | 'processing_failed' | 'no_valid_formats';
};

export type VectorStoreResponse = VectorStoreResult | VectorStoreError;

export type FileUploadResult = {
    fileId: string | null;
    reason?: 'too_large' | 'invalid_url' | 'no_format' | 'unsupported_format' | 'fetch_error' | 'upload_error';
};

export type AnalyzeResult =
    | { success: true; message: "Analiza ažurirana", responseId: number }
    | { success: false; message: "Analiza nije ažurirana", reason: string };     
