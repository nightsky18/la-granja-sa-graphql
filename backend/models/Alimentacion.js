const mongoose = require('mongoose');

const alimentoPorcinoSchema = new mongoose.Schema({
  porcino: { type: mongoose.Schema.Types.ObjectId, ref: 'Porcino', required: true },
  dosis: { type: Number, required: true, min: 0 },
  fecha: { type: Date, default: Date.now }
}, { _id: true });

const alimentacionSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true, trim: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true, default: '' },   // opcional
  cantidadLibras: { type: Number, required: true, min: 0 }, // stock
  historialPorcinos: [alimentoPorcinoSchema]
}, { timestamps: true });



module.exports = mongoose.model('Alimentacion', alimentacionSchema);
