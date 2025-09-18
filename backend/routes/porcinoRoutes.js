const express = require('express');
const router = express.Router();
const Porcino = require('../models/Porcino');
const Alimentacion = require('../models/Alimentacion');

// Crear porcino
router.post('/', async (req, res) => {
  try {
    const nuevo = new Porcino(req.body);
    const guardado = await nuevo.save();
    return res.status(201).json(guardado);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: 'La identificación ya está registrada.' });
    }
    return res.status(500).json({ mensaje: 'Error al crear porcino.', error: error.message });
  }
});

// Registrar alimentación adicional a un porcino
router.post('/:id/alimentar', async (req, res) => {
  try {
    const porcino = await Porcino.findById(req.params.id);
    if (!porcino) return res.status(404).json({ mensaje: 'Porcino no encontrado' });

    const { alimentacionId, dosis } = req.body;
    if (!alimentacionId || !dosis) {
      return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    const alimentacion = await Alimentacion.findById(alimentacionId);
    if (!alimentacion) return res.status(404).json({ mensaje: 'Alimentación no encontrada' });

    if (Number(dosis) > Number(alimentacion.cantidadLibras)) {
      return res.status(400).json({ mensaje: 'No hay suficiente stock de alimentación' });
    }

    // Actualizar historial porcino
   porcino.historialAlimentacion.push({
  alimentacion: alimentacion._id,
  nombreSnapshot: alimentacion.nombre,         // snapshot
  descripcionSnapshot: alimentacion.descripcion, // opcional
  dosis: Number(dosis),
  fecha: new Date()
});
await porcino.save();

    // Actualizar historial de alimentación y stock
    alimentacion.historialPorcinos.push({ porcino: porcino._id, dosis: Number(dosis) });
    alimentacion.cantidadLibras -= Number(dosis);
    await alimentacion.save();

    return res.json({ mensaje: 'Alimentación registrada correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al registrar alimentación', error: error.message });
  }
});

// Listar todos los porcinos (con cliente e historial poblado)
router.get('/', async (req, res) => {
  try {
    const porcinos = await Porcino.find()
      .populate('cliente')
      .populate('historialAlimentacion.alimentacion');
    return res.json(porcinos);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener porcinos.', error: error.message });
  }
});

// Actualizar porcino (datos básicos)
router.put('/:id', async (req, res) => {
  try {
    const actualizado = await Porcino.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    return res.json(actualizado);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: 'La identificación ya está registrada.' });
    }
    return res.status(500).json({ mensaje: 'Error al actualizar porcino.', error: error.message });
  }
});

// Eliminar porcino
router.delete('/:id', async (req, res) => {
  try {
    await Porcino.findByIdAndDelete(req.params.id);
    return res.json({ mensaje: 'Porcino eliminado' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al eliminar porcino.', error: error.message });
  }
});

// Editar un registro del historial (ajuste de stock por delta)
router.put('/:porcinoId/historial/:histId', async (req, res) => {
  try {
    const { alimentacionId, dosis } = req.body;
    const porcino = await Porcino.findById(req.params.porcinoId);
    if (!porcino) return res.status(404).json({ mensaje: 'Porcino no encontrado' });

    const idx = porcino.historialAlimentacion.findIndex(h => String(h._id) === req.params.histId);
    if (idx === -1) return res.status(404).json({ mensaje: 'Registro de historial no encontrado' });

    const anterior = porcino.historialAlimentacion[idx];
    const nuevaDosis = Number(dosis ?? anterior.dosis);

    // Alimentaciones involucradas
    const alimAnterior = await Alimentacion.findById(anterior.alimentacion);

    // Si la alimentación original ya NO existe, el registro es de solo lectura
    if (!alimAnterior) {
      return res.status(400).json({ mensaje: 'La alimentación original fue eliminada; este registro histórico es de solo lectura.' });
    }

    const alimNueva = await Alimentacion.findById(alimentacionId || anterior.alimentacion);
    if (!alimNueva) {
      return res.status(404).json({ mensaje: 'Alimentación no encontrada' });
    }

    if (String(alimNueva._id) === String(alimAnterior._id)) {
      // Misma alimentación: ajustar por delta
      const delta = nuevaDosis - Number(anterior.dosis);
      if (delta > 0) {
        if (delta > alimNueva.cantidadLibras) {
          return res.status(400).json({ mensaje: 'No hay stock suficiente para aumentar la dosis' });
        }
        alimNueva.cantidadLibras -= delta;
        await alimNueva.save();
      } else if (delta < 0) {
        alimNueva.cantidadLibras += Math.abs(delta);
        await alimNueva.save();
      }
    } else {
      // Cambió de alimentación: devolver y descontar
      alimAnterior.cantidadLibras += Number(anterior.dosis);
      await alimAnterior.save();

      if (nuevaDosis > alimNueva.cantidadLibras) {
        // revertir devolución
        alimAnterior.cantidadLibras -= Number(anterior.dosis);
        await alimAnterior.save();
        return res.status(400).json({ mensaje: 'No hay stock suficiente en la nueva alimentación' });
      }
      alimNueva.cantidadLibras -= nuevaDosis;
      await alimNueva.save();

      // Actualizar snapshot con datos de la nueva alimentación
      anterior.nombreSnapshot = alimNueva.nombre;
      anterior.descripcionSnapshot = alimNueva.descripcion;
    }

    // Actualizar el registro
    anterior.alimentacion = alimNueva._id;
    anterior.dosis = nuevaDosis;
    await porcino.save();

    return res.json({ mensaje: 'Registro de historial actualizado con ajuste de stock' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al actualizar historial', error: error.message });
  }
});


// Eliminar un registro del historial (y devolver stock)
router.delete('/:porcinoId/historial/:histId', async (req, res) => {
  try {
    const { porcinoId, histId } = req.params;

    const porcino = await Porcino.findById(porcinoId);
    if (!porcino) return res.status(404).json({ mensaje: 'Porcino no encontrado' });

    const idx = porcino.historialAlimentacion.findIndex(h => String(h._id) === histId);
    if (idx === -1) return res.status(404).json({ mensaje: 'Registro de historial no encontrado' });

    const reg = porcino.historialAlimentacion[idx];

    // Si la referencia existe, devuelve stock; si no, omite el ajuste
    if (reg.alimentacion) {
      const alim = await Alimentacion.findById(reg.alimentacion);
      if (alim) {
        alim.cantidadLibras += Number(reg.dosis);
        await alim.save();
      }
    }

    porcino.historialAlimentacion.splice(idx, 1);
    await porcino.save();

    return res.json({ mensaje: 'Registro de historial eliminado' });
  } catch (error) {
    // log opcional: console.error('DELETE historial error', error);
    return res.status(500).json({ mensaje: 'Error al eliminar historial', error: error.message });
  }
});


module.exports = router;
