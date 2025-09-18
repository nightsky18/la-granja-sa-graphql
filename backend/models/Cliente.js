const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  cedula: { type: String, unique: true, required: true },
  nombres: { type: String, required: true, minlength: 3 },
  apellidos: { type: String, required: true, minlength: 3 },
  direccion: String,
  telefono: { type: String, required: true, match: /^\d{10}$/ }
});

module.exports = mongoose.model('Cliente', clienteSchema);
