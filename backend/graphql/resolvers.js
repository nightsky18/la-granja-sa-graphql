// backend/graphql/resolvers.js
const { GraphQLScalarType, Kind } = require('graphql');
const mongoose = require('mongoose');
const Cliente = require('../models/Cliente');
const Alimentacion = require('../models/Alimentacion');
const Porcino = require('../models/Porcino');

const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'ISO-8601 Date scalar',
  parseValue: (v) => new Date(v),
  serialize: (v) => new Date(v).toISOString(),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});

function duplicateKeyMessage(err, fallback = 'Registro duplicado') {
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return `Valor duplicado en campo ${field || 'único'}`;
  }
  return fallback;
}

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
    porcinos: async () =>
      Porcino.find().populate('cliente').lean(),
    porcino: async (_, { id }) =>
      Porcino.findById(id).populate('cliente').lean(),
  },

  Mutation: {
    // Clientes
    crearCliente: async (_, { data }) => {
      if (!/^\d{10}$/.test(data.telefono || '')) {
        throw new Error('Teléfono debe tener exactamente 10 números.');
      }
      if ((data.nombres || '').trim().length < 3 || (data.apellidos || '').trim().length < 3) {
        throw new Error('Nombre y apellido deben tener al menos 3 caracteres.');
      }
      try {
        const doc = await Cliente.create(data);
        return doc.toObject();
      } catch (err) {
        throw new Error(duplicateKeyMessage(err, 'No se pudo crear el cliente.'));
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
        const updated = await Cliente.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
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
        const updated = await Alimentacion.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
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

      const porcinoData = {
        identificacion,
        raza,
        edad,
        peso,
        historialAlimentacion: [],
      };

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

    actualizarPorcino: async (_, { id, data }) => {
      const patch = { ...data };
      if (patch.edad != null && patch.edad < 0) throw new Error('La edad no puede ser negativa.');
      if (patch.peso != null && patch.peso < 0) throw new Error('El peso no puede ser negativo.');
      if (patch.clienteId) {
        const cli = await Cliente.findById(patch.clienteId).lean();
        if (!cli) throw new Error('Cliente asociado no existe.');
        patch.cliente = patch.clienteId;
        delete patch.clienteId;
      }
      try {
        const updated = await Porcino.findByIdAndUpdate(id, patch, { new: true, runValidators: true })
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

    // Operación de negocio: alimentar porcino
    alimentarPorcino: async (_, { input }) => {
      const { porcinoId, alimentacionId, dosis } = input;
      if (dosis <= 0) throw new Error('La dosis debe ser mayor a 0.');

      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const [porcino, alimento] = await Promise.all([
          Porcino.findById(porcinoId).session(session),
          Alimentacion.findById(alimentacionId).session(session),
        ]);
        if (!porcino) throw new Error('Porcino no encontrado.');
        if (!alimento) throw new Error('Alimentación no encontrada.');
        if (alimento.cantidadLibras < dosis) throw new Error('Stock insuficiente para la dosis.');

        // Descontar stock
        alimento.cantidadLibras = alimento.cantidadLibras - dosis;
        await alimento.save({ session });

        // Registrar en historial del porcino (embebido)
        porcino.historialAlimentacion = porcino.historialAlimentacion || [];
        porcino.historialAlimentacion.push({
          alimentacion: alimento._id,
          nombreSnapshot: alimento.nombre,
          dosis,
          fecha: new Date(),
        });
        await porcino.save({ session });

        await session.commitTransaction();
        session.endSession();

        const refreshed = await Porcino.findById(porcinoId).populate('cliente').lean();
        return refreshed;
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw new Error(err.message || 'No se pudo alimentar el porcino.');
      }
    },
  },

  // Resolvers de campos (si historial usa referencias)
  Porcino: {
    // Si se requiere poblar historial en lecturas, aquí se podría resolver cada item.
    // Mantener simple: se devuelve lo embebido tal como está; si se necesita el doc completo de Alimentacion,
    // podría agregarse una consulta aquí por cada item (o un data loader).
  },
};

module.exports = { resolvers };
