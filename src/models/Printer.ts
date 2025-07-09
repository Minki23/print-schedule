import { Schema, model, models } from 'mongoose';

const PrinterSchema = new Schema({
  name: { type: String, required: true },
  occupied: { type: Boolean, default: false },
  supportedFilamentDiameters: { type: [Number], required: true, default: [1.75] }, // Średnice filamentu (np. [1.75, 3.0])
  nozzleSize: { type: Number, required: true, default: 0.4 }, // Rozmiar dyszy w mm
  lastPrint: { type: Schema.Types.ObjectId, ref: 'Print' },
  possibleFilaments: { type: [Schema.Types.ObjectId], ref: 'Filament', default: [] },
}, {
  timestamps: true
});

// Middleware do automatycznego aktualizowania możliwych filamentów na podstawie średnic
PrinterSchema.pre('save', async function(next) {
  if (this.isModified('supportedFilamentDiameters')) {
    try {
      const FilamentModel = models.Filament;
      if (FilamentModel) {
        const compatibleFilaments = await FilamentModel.find({
          diameter: { $in: this.supportedFilamentDiameters }
        });
        this.possibleFilaments = compatibleFilaments.map(f => f._id);
      }
    } catch (error) {
      console.error('Error updating possible filaments:', error);
    }
  }
  next();
});

const Printer = models.Printer || model('Printer', PrinterSchema);

export default Printer;