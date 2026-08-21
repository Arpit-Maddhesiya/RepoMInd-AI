import mongoose, { Schema, model, type Document } from 'mongoose';

export type RepoStatus =
  | 'QUEUED'
  | 'CLONING'
  | 'ANALYZING'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'INDEXING'
  | 'COMPLETED'
  | 'FAILED';

export interface IRepository extends Document {
  userId: mongoose.Types.ObjectId;
  githubUrl: string;
  owner: string;
  name: string;
  fullName: string;
  branch: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  status: RepoStatus;
  progress: {
    stage: RepoStatus;
    percent: number;
  };
  totalFiles: number;
  totalLines: number;
  totalChunks: number;
  lastIndexedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const repositorySchema = new Schema<IRepository>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    githubUrl: { type: String, required: true, trim: true },
    owner: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    fullName: { type: String, default: '' },
    branch: { type: String, default: 'main' },
    description: { type: String, default: '' },
    language: { type: String, default: 'Unknown' },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['QUEUED', 'CLONING', 'ANALYZING', 'CHUNKING', 'EMBEDDING', 'INDEXING', 'COMPLETED', 'FAILED'],
      default: 'QUEUED',
    },
    progress: {
      stage: {
        type: String,
        enum: ['QUEUED', 'CLONING', 'ANALYZING', 'CHUNKING', 'EMBEDDING', 'INDEXING', 'COMPLETED', 'FAILED'],
        default: 'QUEUED',
      },
      percent: { type: Number, default: 0 },
    },
    totalFiles: { type: Number, default: 0 },
    totalLines: { type: Number, default: 0 },
    totalChunks: { type: Number, default: 0 },
    lastIndexedAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true },
);

repositorySchema.index({ userId: 1, githubUrl: 1 }, { unique: true });

export const Repository = model<IRepository>('Repository', repositorySchema);
