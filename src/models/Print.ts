import { Schema, model, models } from 'mongoose';

const PrintSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  googleDriveLink: {
    type: String,
    required: [true, 'Google Drive link is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required']
  },
  status: {
    type: String,
    enum: ['pending', 'printing', 'completed', 'failed'],
    default: 'pending'
  },
  startedAt: {
    type: Date,
    default: null
  },
  scheduledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  printer: {
    type: Schema.Types.ObjectId,
    ref: 'Printer',
    required: [true, 'Printer is required']
  }
}); 

const Print = models.Print || model('Print', PrintSchema);

export default Print;
