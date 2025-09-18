const express = require('express');
const router = express.Router();
const Porcino = require('../models/Porcino');
const Alimentacion = require('../models/Alimentacion');

// GET /api/reportes/trazabilidad-por-alimento
// Query: alimentacionId (opcional), fechaInicio, fechaFin (YYYY-MM-DD)
router.get('/trazabilidad-por-alimento', async (req, res) => {
  try {
    const { alimentacionId, fechaInicio, fechaFin } = req.query;
    const fi = fechaInicio ? new Date(fechaInicio) : new Date('1970-01-01');
    const ff = fechaFin ? new Date(new Date(fechaFin).getTime() + 24*60*60*1000) : new Date('2999-12-31');

    const matchFecha = { 'historialAlimentacion.fecha': { $gte: fi, $lt: ff } };

    const pipeline = [
      { $match: { 'historialAlimentacion.0': { $exists: true } } },
      { $unwind: '$historialAlimentacion' },                        // deconstruir historial [4]
      { $match: matchFecha },
      // filtrar por alimento si se envía
      ...(alimentacionId ? [{ $match: {
        $or: [
          { 'historialAlimentacion.alimentacion': alimentacionId },
        ]
      }}] : []),
      // traer cliente y alimento (si existe) opcional
      { $lookup: { from: 'clientes', localField: 'cliente', foreignField: '_id', as: 'cliente' } },
      { $unwind: { path: '$cliente', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'alimentacions', localField: 'historialAlimentacion.alimentacion', foreignField: '_id', as: 'alim' } },
      { $unwind: { path: '$alim', preserveNullAndEmptyArrays: true } },
      { $project: {
        porcino: '$identificacion',
        cliente: { $concat: [{$ifNull:['$cliente.nombres','']}, ' ', {$ifNull:['$cliente.apellidos','']}] },
        alimento: { $ifNull: ['$alim.nombre', '$historialAlimentacion.nombreSnapshot'] },
        dosis: '$historialAlimentacion.dosis',
        fecha: '$historialAlimentacion.fecha'
      }},
      { $sort: { fecha: 1 } }
    ]; // patrón unwind + project para trazabilidad [4][1]

    const rows = await Porcino.aggregate(pipeline);
    return res.json({ rows, filtros: { alimentacionId, fechaInicio, fechaFin } });
  } catch (e) {
    return res.status(500).json({ mensaje: 'Error al generar trazabilidad', error: e.message });
  }
});

router.get('/consumo-por-cliente', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const fi = fechaInicio ? new Date(fechaInicio) : new Date('1970-01-01');
    const ff = fechaFin ? new Date(new Date(fechaFin).getTime() + 24*60*60*1000) : new Date('2999-12-31');

    const pipeline = [
      { $match: { 'historialAlimentacion.0': { $exists: true } } },
      { $unwind: '$historialAlimentacion' },
      { $match: { 'historialAlimentacion.fecha': { $gte: fi, $lt: ff } } },
      { $lookup: { from: 'clientes', localField: 'cliente', foreignField: '_id', as: 'cliente' } },
      { $unwind: { path: '$cliente', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: '$cliente._id',
        cliente: { $first: { $concat: [{$ifNull:['$cliente.nombres','']}, ' ', {$ifNull:['$cliente.apellidos','']}] } },
        totalLbs: { $sum: '$historialAlimentacion.dosis' },         // sumatorias [9]
        eventos: { $sum: 1 },
        porcinos: { $addToSet: '$identificacion' }
      }},
      { $project: { cliente:1, totalLbs:1, eventos:1, porcinos: { $size: '$porcinos' } } },
      { $sort: { totalLbs: -1 } }
    ];

    const rows = await Porcino.aggregate(pipeline);
    return res.json({ rows, filtros: { fechaInicio, fechaFin } });
  } catch (e) {
    return res.status(500).json({ mensaje: 'Error en reporte consumo por cliente', error: e.message });
  }
});


router.get('/consumo-por-alimentacion', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const fi = fechaInicio ? new Date(fechaInicio) : new Date('1970-01-01');
    const ff = fechaFin ? new Date(new Date(fechaFin).getTime() + 24*60*60*1000) : new Date('2999-12-31');

    const pipeline = [
      { $match: { 'historialAlimentacion.0': { $exists: true } } },
      { $unwind: '$historialAlimentacion' },
      { $match: { 'historialAlimentacion.fecha': { $gte: fi, $lt: ff } } },
      { $lookup: { from: 'alimentacions', localField: 'historialAlimentacion.alimentacion', foreignField: '_id', as: 'alim' } },
      { $unwind: { path: '$alim', preserveNullAndEmptyArrays: true } },
      { $project: {
        alimento: { $ifNull: ['$alim.nombre', '$historialAlimentacion.nombreSnapshot'] },
        dosis: '$historialAlimentacion.dosis'
      }},
      { $group: {
        _id: '$alimento',
        alimento: { $first: '$alimento' },
        eventos: { $sum: 1 },
        totalLbs: { $sum: '$dosis' }
      }},
      { $sort: { totalLbs: -1 } }
    ]; // group by alimento nombre (ref o snapshot) [6][9]

    const rows = await Porcino.aggregate(pipeline);
    const total = rows.reduce((a,b)=>a + (b.totalLbs||0), 0);
    const withPct = rows.map(r => ({ ...r, porcentaje: total ? (r.totalLbs*100/total) : 0 }));
    return res.json({ rows: withPct, filtros: { fechaInicio, fechaFin } });
  } catch (e) {
    return res.status(500).json({ mensaje: 'Error en reporte consumo por alimentación', error: e.message });
  }
});


module.exports = router;
