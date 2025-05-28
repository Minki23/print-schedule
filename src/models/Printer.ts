import { Schema, model, models } from 'mongoose';

const PrinterSchema = new Schema({
  name: { type: String, required: true },
  occupied: { type: Boolean, default: false },
});

const Printer = models.Printer || model('Printer', PrinterSchema);

export default Printer;