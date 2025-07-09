import { Schema, model, models } from 'mongoose';

const PrinterSchema = new Schema({
  name: { type: String, required: true },
  occupied: { type: Boolean, default: false },
  lastPrint: { type: Schema.Types.ObjectId, ref: 'Print' },
  possibleFilaments: { type: [Number], default: [] },
});

const Printer = models.Printer || model('Printer', PrinterSchema);

export default Printer;