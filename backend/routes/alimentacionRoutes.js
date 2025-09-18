const express = require('express');
const router = express.Router();
const Alimentacion = require('../models/Alimentacion');

// Crear alimentación
router.post('/', async (req, res) => {
  try {
    const nuevo = new Alimentacion(req.body);
    const saved = await nuevo.save();
    return res.status(201).json(saved);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: 'El ID de alimentación ya existe.' });
    }
    return res.status(500).json({ mensaje: 'Error al crear alimentación.', error: error.message });
  }
});

// Obtener todas
router.get('/', async (req, res) => {
  try {
    const alimentaciones = await Alimentacion.find();
    return res.json(alimentaciones);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al listar alimentaciones.', error: error.message });
  }
});

// Actualizar
router.put('/:id', async (req, res) => {
  try {
    const actualizado = await Alimentacion.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    return res.json(actualizado);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: 'El ID de alimentación ya existe.' });
    }
    return res.status(500).json({ mensaje: 'Error al actualizar alimentación.', error: error.message });
  }
});

// Eliminar
router.delete('/:id', async (req, res) => {
  try {
    await Alimentacion.findByIdAndDelete(req.params.id);
    return res.json({ mensaje: 'Alimentación eliminada' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al eliminar alimentación.', error: error.message });
  }
});

module.exports = router;
