import mongoose, { Schema, model, type Document } from 'mongoose';

export interface IRepoFile extends Document {
  repositoryId: mongoose.Types.ObjectId;
  path: string;
  language: string;
  size: number;
  lines: number;
  content: string;
  createdAt: Date;
}

const repoFileSchema = new Schema<IRepoFile>(
  {
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    path: { type: String, required: true },
    language: { type: String, default: 'unknown' },
    size: { type: Number, default: 0 },
    lines: { type: Number, default: 0 },
    content: { type: String, default: '' },
  },
  { timestamps: true },
);

repoFileSchema.index({ repositoryId: 1, path: 1 }, { unique: true });

export const RepoFile = model<IRepoFile>('RepoFile', repoFileSchema);
