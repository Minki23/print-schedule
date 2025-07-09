import { Schema, model, models } from 'mongoose';

const FilamentSchema = new Schema({
  color: { type: String, required: true },
  brand: { type: String, required: true },
  material: { type: String, required: true },
  diameter: { type: Number, required: true },
  weight: { type: Number, required: true },
});

const Filament = models.Filament || model('Filament', FilamentSchema);

export default Filament;
