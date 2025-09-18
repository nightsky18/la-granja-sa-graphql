const mongoose = require('mongoose');

const alimentoPorcinoSchema = new mongoose.Schema({
  porcino: { type: mongoose.Schema.Types.ObjectId, ref: 'Porcino', required: true },
  dosis: { type: Number, required: true }, // libras
  fecha: { type: Date, default: Date.now }
});

const alimentacionSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  cantidadLibras: { type: Number, required: true }, // stock
  historialPorcinos: [alimentoPorcinoSchema] // nuevos registros
});

module.exports = mongoose.model('Alimentacion', alimentacionSchema);
