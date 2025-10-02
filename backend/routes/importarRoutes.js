const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const Cliente = require('../models/Cliente');
const Porcino = require('../models/Porcino');
const Alimentacion = require('../models/Alimentacion');

// Configurar multer para recibir archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta para importar cualquier tipo de entidad
router.post('/:tipo', upload.single('file'), async (req, res) => {
  try {
    const { tipo } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ mensaje: 'No se recibió ningún archivo' });
    }

    // Parsear CSV
    const registros = [];
    const stream = Readable.from(file.buffer.toString());

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => registros.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    if (registros.length === 0) {
      return res.status(400).json({ mensaje: 'El archivo CSV está vacío' });
    }

    // Procesar según el tipo
    let resultado;
    switch (tipo) {
      case 'clientes':
        resultado = await importarClientes(registros);
        break;
      case 'porcinos':
        resultado = await importarPorcinos(registros);
        break;
      case 'alimentaciones':
        resultado = await importarAlimentaciones(registros);
        break;
      default:
        return res.status(400).json({ mensaje: 'Tipo de importación no válido' });
    }

    return res.json(resultado);

  } catch (error) {
    console.error('Error en importación:', error);
    return res.status(500).json({ 
      mensaje: 'Error al procesar la importación', 
      error: error.message 
    });
  }
});

async function importarClientes(registros) {
  let exitosos = 0;
  let errores = 0;
  const detalleErrores = [];

  for (const [index, row] of registros.entries()) {
    try {
      const { cedula, nombres, apellidos, telefono, direccion } = row;

      // Validaciones
      if (!cedula || !nombres || !apellidos || !telefono) {
        throw new Error(`Fila ${index + 2}: Faltan campos obligatorios`);
      }

      if (!/^\d{10}$/.test(telefono)) {
        throw new Error(`Fila ${index + 2}: Teléfono debe tener exactamente 10 dígitos`);
      }

      // Crear cliente
      await Cliente.create({
        cedula: cedula.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim(),
        direccion: direccion?.trim() || ''
      });

      exitosos++;

    } catch (err) {
      errores++;
      if (err.code === 11000) {
        detalleErrores.push(`Fila ${index + 2}: Cédula ${row.cedula} ya existe`);
      } else {
        detalleErrores.push(err.message);
      }
    }
  }

  return { exitosos, errores, detalleErrores };
}

async function importarPorcinos(registros) {
  let exitosos = 0;
  let errores = 0;
  const detalleErrores = [];

  for (const [index, row] of registros.entries()) {
    try {
      // Limpiar espacios en blanco de las claves del CSV
      const cleanRow = {};
      for (const [key, value] of Object.entries(row)) {
        cleanRow[key.trim()] = value;
      }

      const { identificacion, raza, edad, peso, clienteCedula } = cleanRow;

      // Validación: identificacion del porcino es obligatoria
      if (!identificacion || !identificacion.trim()) {
        throw new Error(`Fila ${index + 2}: La identificación del porcino es obligatoria`);
      }

      // Validaciones de campos obligatorios
      if (!raza || !edad || !peso) {
        throw new Error(`Fila ${index + 2}: Los campos raza, edad y peso son obligatorios`);
      }

      // Validar que sean números válidos
      const razaNum = parseInt(raza);
      const edadNum = parseInt(edad);
      const pesoNum = parseFloat(peso);

      if (isNaN(razaNum) || razaNum < 1 || razaNum > 3) {
        throw new Error(`Fila ${index + 2}: Raza debe ser 1 (York), 2 (Hamp) o 3 (Duroc)`);
      }

      if (isNaN(edadNum) || edadNum < 0) {
        throw new Error(`Fila ${index + 2}: Edad debe ser un número no negativo`);
      }

      if (isNaN(pesoNum) || pesoNum <= 0) {
        throw new Error(`Fila ${index + 2}: Peso debe ser un número positivo`);
      }

      // Buscar cliente por cédula (OPCIONAL)
      let clienteId = null;
      if (clienteCedula && clienteCedula.trim()) {
        const cliente = await Cliente.findOne({ cedula: clienteCedula.trim() });
        if (!cliente) {
          throw new Error(`Fila ${index + 2}: Cliente con cédula "${clienteCedula}" no existe. Verifique que el cliente esté registrado en la pestaña Clientes.`);
        }
        clienteId = cliente._id;
      }

      // Crear porcino
      await Porcino.create({
        identificacion: identificacion.trim(),
        raza: razaNum,
        edad: edadNum,
        peso: pesoNum,
        cliente: clienteId,
        historialAlimentacion: []
      });

      exitosos++;

    } catch (err) {
      errores++;
      if (err.code === 11000) {
        detalleErrores.push(`Fila ${index + 2}: La identificación "${row.identificacion}" ya existe en la base de datos`);
      } else {
        detalleErrores.push(err.message);
      }
    }
  }

  return { exitosos, errores, detalleErrores };
}

async function importarAlimentaciones(registros) {
  let exitosos = 0;
  let errores = 0;
  const detalleErrores = [];

  for (const [index, row] of registros.entries()) {
    try {
      const { id, nombre, descripcion, cantidadLibras } = row;

      // Validaciones
      if (!id || !nombre || !cantidadLibras) {
        throw new Error(`Fila ${index + 2}: Faltan campos obligatorios`);
      }

      if (parseFloat(cantidadLibras) < 0) {
        throw new Error(`Fila ${index + 2}: Stock no puede ser negativo`);
      }

      // Crear alimentación
      await Alimentacion.create({
        id: id.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || '',
        cantidadLibras: parseFloat(cantidadLibras),
        historialPorcinos: []
      });

      exitosos++;

    } catch (err) {
      errores++;
      if (err.code === 11000) {
        detalleErrores.push(`Fila ${index + 2}: ID ${row.id} ya existe`);
      } else {
        detalleErrores.push(err.message);
      }
    }
  }

  return { exitosos, errores, detalleErrores };
}

module.exports = router;