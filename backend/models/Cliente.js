const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  cedula: { type: String, unique: true, required: true, trim: true },
  nombres: { type: String, required: true, minlength: 3, trim: true },
  apellidos: { type: String, required: true, minlength: 3, trim: true },
  direccion: { type: String, trim: true, default: '' },
  telefono: { type: String, required: true, match: /^\d{10}$/ }
}, { timestamps: true });


module.exports = mongoose.model('Cliente', clienteSchema);
