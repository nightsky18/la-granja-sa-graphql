const mongoose = require('mongoose');

const historialAlimentacionSchema = new mongoose.Schema({
  alimentacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Alimentacion', required: true },
  nombreSnapshot: { type: String },         // nuevo
  descripcionSnapshot: { type: String },    // nuevo
  dosis: { type: Number, required: true },
  fecha: { type: Date, default: Date.now }
});

const porcinoSchema = new mongoose.Schema({
  identificacion: { type: String, unique: true, required: true },
  raza: { type: Number, required: true },
  edad: { type: Number, required: true }, // meses
  peso: { type: Number, required: true }, // kg
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
  historialAlimentacion: [historialAlimentacionSchema] // nuevo campo registro
});

module.exports = mongoose.model('Porcino', porcinoSchema);
