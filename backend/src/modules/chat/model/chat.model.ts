import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IChatSession extends Document {
  conversationId: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true }
}, { _id: false });

const chatSessionSchema = new Schema<IChatSession>({
  conversationId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'New Conversation' },
  messages: [messageSchema]
}, { timestamps: true });

export const ChatSession = mongoose.model<IChatSession>('ChatSession', chatSessionSchema);
