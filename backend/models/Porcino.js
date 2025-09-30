const mongoose = require('mongoose');

const historialAlimentacionSchema = new mongoose.Schema({
  alimentacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Alimentacion', required: true },
  nombreSnapshot: { type: String, trim: true },
  descripcionSnapshot: { type: String, trim: true },
  dosis: { type: Number, required: true, min: 0 },
  fecha: { type: Date, default: Date.now }
}, { _id: true });

const porcinoSchema = new mongoose.Schema({
  identificacion: { type: String, unique: true, required: true, trim: true },
  raza: { type: Number, required: true, min: 1 },
  edad: { type: Number, required: true, min: 0 }, // meses
  peso: { type: Number, required: true, min: 0 }, // kg
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', default: null },
  historialAlimentacion: [historialAlimentacionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Porcino', porcinoSchema);
