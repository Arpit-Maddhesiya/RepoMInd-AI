import mongoose, { Schema, model, type Document } from 'mongoose';

export type ChunkType = 'function' | 'class' | 'method' | 'block' | 'line-block' | 'markdown-section' | 'config';

export interface IChunk extends Document {
  repositoryId: mongoose.Types.ObjectId;
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
  symbolName: string | null;
  chunkType: ChunkType;
  content: string;
  embedding: Buffer | null;
  createdAt: Date;
}

const chunkSchema = new Schema<IChunk>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    filePath: { type: String, required: true },
    language: { type: String, default: 'unknown' },
    startLine: { type: Number, required: true },
    endLine: { type: Number, required: true },
    symbolName: { type: String, default: null },
    chunkType: {
      type: String,
      enum: ['function', 'class', 'method', 'block', 'line-block', 'markdown-section', 'config'],
      default: 'block',
    },
    content: { type: String, required: true },
    embedding: { type: Buffer, default: null },
  },
  { timestamps: true },
);

chunkSchema.index({ repositoryId: 1, filePath: 1 });

export const Chunk = model<IChunk>('Chunk', chunkSchema);
