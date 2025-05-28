import { Schema, model } from 'mongoose';

const PrinterSchema = new Schema({
  name: { type: String, required: true },
  occupied: { type: Boolean, default: false },
});

const Printer = model('Printer', PrinterSchema);

export default Printer;