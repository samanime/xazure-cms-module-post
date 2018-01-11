import { Schema } from 'mongoose';

export default {
  type: String,
  title: String,
  slug: String,
  content: String,
  publishTime: Date,
  creationTime: { type: Date, default: new Date() },
  authorId: Schema.Types.ObjectId
}