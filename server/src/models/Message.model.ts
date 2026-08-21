import mongoose, { Schema, model, type Document } from 'mongoose';

export interface SourceReference {
  file: string;
  startLine: number;
  endLine: number;
  language: string;
  snippet: string;
}

export type MessageRole = 'user' | 'assistant';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  role: MessageRole;
  content: string;
  sources: SourceReference[];
  createdAt: Date;
}

const sourceSchema = new Schema<SourceReference>(
  {
    file: { type: String, required: true },
    startLine: { type: Number, default: 0 },
    endLine: { type: Number, default: 0 },
    language: { type: String, default: 'unknown' },
    snippet: { type: String, default: '' },
  },
  { _id: false },
);

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sources: { type: [sourceSchema], default: [] },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = model<IMessage>('Message', messageSchema);
