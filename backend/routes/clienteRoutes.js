const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');             // IMPORTANTE [2]
const Cliente = require('../models/Cliente');
const Porcino = require('../models/Porcino');     // IMPORTANTE: para cascada

// Crear
router.post('/', async (req, res) => {
  try {
    const cliente = new Cliente(req.body);
    await cliente.save();
    return res.status(201).json(cliente);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: 'La cédula ya está registrada.' });
    }
    return res.status(500).json({ mensaje: 'Error al guardar el cliente.', error: error.message });
  }
});

// Listar todos
router.get('/', async (req, res) => {
  try {
    const clientes = await Cliente.find();
    return res.json(clientes);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al listar clientes.', error: error.message });
  }
});

// Buscar por ID
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    return res.json(cliente);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener cliente.', error: error.message });
  }
});

// Actualizar
router.put('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    return res.json(cliente);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: 'La cédula ya está registrada.' });
    }
    return res.status(500).json({ mensaje: 'Error al actualizar el cliente.', error: error.message });
  }
});

// Eliminar cliente y sus porcinos asociados (cascade)
router.delete('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    // cascada sin transacción
    const resultado = await Porcino.deleteMany({ cliente: cliente._id });
    await Cliente.deleteOne({ _id: cliente._id });

    return res.json({
      mensaje: 'Cliente y porcinos asociados eliminados',
      porcinosEliminados: resultado?.deletedCount || 0
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al eliminar cliente y porcinos asociados', error: error.message });
  }
});


module.exports = router;
