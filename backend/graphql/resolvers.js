// backend/graphql/resolvers.js
const { GraphQLScalarType, Kind } = require('graphql');
const mongoose = require('mongoose');
const Cliente = require('../models/Cliente');
const Alimentacion = require('../models/Alimentacion');
const Porcino = require('../models/Porcino');

// Scalar Date
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'ISO-8601 Date scalar',
  parseValue: (v) => new Date(v),
  serialize: (v) => new Date(v).toISOString(),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});

// Helpers
function duplicateKeyMessage(err, fallback = 'Registro duplicado') {
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return `Valor duplicado en campo ${field || 'único'}`;
  }
  return fallback;
}

const dateRange = (r) => {
  const fi = r?.fechaInicio ? new Date(r.fechaInicio) : new Date('1970-01-01');
  const ff = r?.fechaFin
    ? new Date(new Date(r.fechaFin).getTime() + 24 * 60 * 60 * 1000)
    : new Date('2999-12-31');
  return { fi, ff };
};

const resolvers = {
  Date: DateScalar,

  Query: {
    // Clientes
    clientes: async () => Cliente.find().lean(),
    cliente: async (_, { id }) => Cliente.findById(id).lean(),

    // Alimentaciones
    alimentaciones: async () => Alimentacion.find().lean(),
    alimentacion: async (_, { id }) => Alimentacion.findById(id).lean(),

    // Porcinos
    porcinos: async () => Porcino.find().populate('cliente').lean(),
    porcino: async (_, { id }) => Porcino.findById(id).populate('cliente').lean(),

    // Reportes
    trazabilidadPorAlimento: async (_, { alimentacionId, rango }) => {
      const { fi, ff } = dateRange(rango);
      const pipeline = [
        { $match: { 'historialAlimentacion.0': { $exists: true } } },
        { $unwind: '$historialAlimentacion' },
        { $match: { 'historialAlimentacion.fecha': { $gte: fi, $lt: ff } } },
        ...(alimentacionId
          ? [
              {
                $match: {
                  $or: [
                    {
                      'historialAlimentacion.alimentacion':
                        new mongoose.Types.ObjectId(alimentacionId),
                    },
                  ],
                },
              },
            ]
          : []),
        {
          $lookup: {
            from: 'clientes',
            localField: 'cliente',
            foreignField: '_id',
            as: 'cliente',
          },
        },
        { $unwind: { path: '$cliente', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'alimentacions',
            localField: 'historialAlimentacion.alimentacion',
            foreignField: '_id',
            as: 'alim',
          },
        },
        { $unwind: { path: '$alim', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            porcino: '$identificacion',
            cliente: {
              $concat: [
                { $ifNull: ['$cliente.nombres', ''] },
                ' ',
                { $ifNull: ['$cliente.apellidos', ''] },
              ],
            },
            alimento: {
              $ifNull: ['$alim.nombre', '$historialAlimentacion.nombreSnapshot'],
            },
            dosis: '$historialAlimentacion.dosis',
            fecha: '$historialAlimentacion.fecha',
          },
        },
        { $sort: { fecha: 1 } },
      ];
      return Porcino.aggregate(pipeline);
    },

    consumoPorCliente: async (_, { rango }) => {
      const { fi, ff } = dateRange(rango);
      const pipeline = [
        { $match: { 'historialAlimentacion.0': { $exists: true } } },
        { $unwind: '$historialAlimentacion' },
        { $match: { 'historialAlimentacion.fecha': { $gte: fi, $lt: ff } } },
        {
          $lookup: {
            from: 'clientes',
            localField: 'cliente',
            foreignField: '_id',
            as: 'cliente',
          },
        },
        { $unwind: { path: '$cliente', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$cliente._id',
            cliente: {
              $first: {
                $concat: [
                  { $ifNull: ['$cliente.nombres', ''] },
                  ' ',
                  { $ifNull: ['$cliente.apellidos', ''] },
                ],
              },
            },
            totalLbs: { $sum: '$historialAlimentacion.dosis' },
            eventos: { $sum: 1 },
            porcinos: { $addToSet: '$identificacion' },
          },
        },
        { $project: { cliente: 1, totalLbs: 1, eventos: 1, porcinos: { $size: '$porcinos' } } },
        { $sort: { totalLbs: -1 } },
      ];
      return Porcino.aggregate(pipeline);
    },

    consumoPorAlimentacion: async (_, { rango }) => {
      const { fi, ff } = dateRange(rango);
      const pipeline = [
        { $match: { 'historialAlimentacion.0': { $exists: true } } },
        { $unwind: '$historialAlimentacion' },
        { $match: { 'historialAlimentacion.fecha': { $gte: fi, $lt: ff } } },
        {
          $lookup: {
            from: 'alimentacions',
            localField: 'historialAlimentacion.alimentacion',
            foreignField: '_id',
            as: 'alim',
          },
        },
        { $unwind: { path: '$alim', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            alimento: {
              $ifNull: ['$alim.nombre', '$historialAlimentacion.nombreSnapshot'],
            },
            dosis: '$historialAlimentacion.dosis',
          },
        },
        {
          $group: {
            _id: '$alimento',
            alimento: { $first: '$alimento' },
            eventos: { $sum: 1 },
            totalLbs: { $sum: '$dosis' },
          },
        },
        { $sort: { totalLbs: -1 } },
      ];
      const rows = await Porcino.aggregate(pipeline);
      const total = rows.reduce((a, b) => a + (b.totalLbs || 0), 0);
      return rows.map((r) => ({
        ...r,
        porcentaje: total ? (r.totalLbs * 100) / total : 0,
      }));
    },
  },

  Mutation: {
    // Clientes
    crearCliente: async (_, { data }) => {
      data.cedula = (data.cedula || '').trim();
      data.nombres = (data.nombres || '').trim();
      data.apellidos = (data.apellidos || '').trim();
      data.direccion = (data.direccion || '').trim();
      if (!/^\d{10}$/.test(data.telefono || ''))
        throw new Error('Teléfono debe tener exactamente 10 números.');
      if (data.nombres.length < 3 || data.apellidos.length < 3)
        throw new Error('Nombre y apellido deben tener al menos 3 caracteres.');
      try {
        const doc = await Cliente.create(data);
        return doc.toObject();
      } catch (err) {
        throw new Error(duplicateKeyMessage(err, 'La cédula ya está registrada.'));
      }
    },

    actualizarCliente: async (_, { id, data }) => {
      if (data.telefono && !/^\d{10}$/.test(data.telefono)) {
        throw new Error('Teléfono debe tener exactamente 10 números.');
      }
      if (data.nombres && data.nombres.trim().length < 3) {
        throw new Error('Nombre debe tener al menos 3 caracteres.');
      }
      if (data.apellidos && data.apellidos.trim().length < 3) {
        throw new Error('Apellido debe tener al menos 3 caracteres.');
      }
      try {
        const updated = await Cliente.findByIdAndUpdate(id, data, {
          new: true,
          runValidators: true,
        }).lean();
        if (!updated) throw new Error('Cliente no encontrado.');
        return updated;
      } catch (err) {
        throw new Error(duplicateKeyMessage(err, 'No se pudo actualizar el cliente.'));
      }
    },

    eliminarCliente: async (_, { id }) => {
      const res = await Cliente.findByIdAndDelete(id);
      return !!res;
    },

    // Alimentaciones
    crearAlimentacion: async (_, { data }) => {
      if (!data.nombre?.trim()) throw new Error('El nombre es requerido.');
      if (data.cantidadLibras < 0) throw new Error('El stock no puede ser negativo.');
      try {
        const doc = await Alimentacion.create(data);
        return doc.toObject();
      } catch (err) {
        throw new Error(duplicateKeyMessage(err, 'No se pudo crear la alimentación.'));
      }
    },

    actualizarAlimentacion: async (_, { id, data }) => {
      if (data.cantidadLibras != null && data.cantidadLibras < 0) {
        throw new Error('El stock no puede ser negativo.');
      }
      try {
        const updated = await Alimentacion.findByIdAndUpdate(id, data, {
          new: true,
          runValidators: true,
        }).lean();
        if (!updated) throw new Error('Alimentación no encontrada.');
        return updated;
      } catch (err) {
        throw new Error(duplicateKeyMessage(err, 'No se pudo actualizar la alimentación.'));
      }
    },

    eliminarAlimentacion: async (_, { id }) => {
      const res = await Alimentacion.findByIdAndDelete(id);
      return !!res;
    },

    // Porcinos
    crearPorcino: async (_, { data }) => {
      const { identificacion, raza, edad, peso, clienteId } = data;
      if (!identificacion?.trim()) throw new Error('Identificación requerida.');
      if (edad < 0) throw new Error('La edad no puede ser negativa.');
      if (peso < 0) throw new Error('El peso no puede ser negativo.');

      const porcinoData = { identificacion, raza, edad, peso, historialAlimentacion: [] };

      if (clienteId) {
        const cli = await Cliente.findById(clienteId).lean();
        if (!cli) throw new Error('Cliente asociado no existe.');
        porcinoData.cliente = clienteId;
      }

      try {
        const doc = await Porcino.create(porcinoData);
        return await Porcino.findById(doc._id).populate('cliente').lean();
      } catch (err) {
        throw new Error(duplicateKeyMessage(err, 'No se pudo crear el porcino.'));
      }
    },
     async actualizarHistorialAlimentacion(_, { porcinoId, historialId, data }) {
    // Busca y actualiza el subdocumento
    const porcino = await Porcino.findById(porcinoId);
    if (!porcino) throw new Error('Porcino no encontrado');
    const item = porcino.historialAlimentacion.id(historialId);
    if (!item) throw new Error('Entrada de historial no encontrada');

    if (typeof data.dosis === 'number') item.dosis = data.dosis;
    if (data.fecha) item.fecha = new Date(data.fecha);
    if (data.alimentacionId) {
      // opcional: actualizar snapshot/nombre si cambias de alimentación
      const alim = await Alimentacion.findById(data.alimentacionId);
      if (!alim) throw new Error('Alimentación no encontrada');
      item.alimentacion = alim._id;
      item.nombreSnapshot = alim.nombre;
    }

    await porcino.save();
    return porcino;
  },

  async eliminarHistorialAlimentacion(_, { porcinoId, historialId }) {
    const porcino = await Porcino.findById(porcinoId);
    if (!porcino) throw new Error('Porcino no encontrado');
    const item = porcino.historialAlimentacion.id(historialId);
    if (!item) throw new Error('Entrada de historial no encontrada');
    item.deleteOne();
    await porcino.save();
    return porcino;
  },

    actualizarPorcino: async (_, { id, data }) => {
      const patch = { ...data };
      if (patch.edad != null && patch.edad < 0) throw new Error('La edad no puede ser negativa.');
      if (patch.peso != null && patch.peso < 0) throw new Error('El peso no puede ser negativo.');
      if (Object.prototype.hasOwnProperty.call(patch, 'clienteId')) {
        if (patch.clienteId) {
          const cli = await Cliente.findById(patch.clienteId).lean();
          if (!cli) throw new Error('Cliente asociado no existe.');
          patch.cliente = patch.clienteId;
        } else {
          patch.cliente = null;
        }
        delete patch.clienteId;
      }
      try {
        const updated = await Porcino.findByIdAndUpdate(id, patch, {
          new: true,
          runValidators: true,
        })
          .populate('cliente')
          .lean();
        if (!updated) throw new Error('Porcino no encontrado.');
        return updated;
      } catch (err) {
        throw new Error(duplicateKeyMessage(err, 'No se pudo actualizar el porcino.'));
      }
    },

    eliminarPorcino: async (_, { id }) => {
      const res = await Porcino.findByIdAndDelete(id);
      return !!res;
    },

    // Operación de negocio
    alimentarPorcino: async (_, { input }) => {
      const { porcinoId, alimentacionId, dosis } = input;
      if (dosis <= 0) throw new Error('La dosis debe ser mayor a 0.');

      const porcino = await Porcino.findById(porcinoId);
      if (!porcino) throw new Error('Porcino no encontrado.');

      const alimento = await Alimentacion.findById(alimentacionId);
      if (!alimento) throw new Error('Alimentación no encontrada.');

      if (alimento.cantidadLibras < dosis) throw new Error('Stock insuficiente para la dosis.');

      // Actualizar stock
      alimento.cantidadLibras -= dosis;
      await alimento.save();

      // Registrar historial con snapshot
      porcino.historialAlimentacion = porcino.historialAlimentacion || [];
      porcino.historialAlimentacion.push({
        alimentacion: alimento._id,
        nombreSnapshot: alimento.nombre,
        descripcionSnapshot: alimento.descripcion || null,
        dosis,
        fecha: new Date(),
      });
      await porcino.save();

      // Devolver porcino actualizado
      const refreshed = await Porcino.findById(porcinoId).populate('cliente').lean();
      return refreshed;
    },
  },

  
  Porcino: {
    // Resolvers de campos adicionales si se requieren
  },
};

module.exports = { resolvers };
