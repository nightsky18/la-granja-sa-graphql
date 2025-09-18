const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Cliente = require('./models/Cliente');
const Alimentacion = require('./models/Alimentacion');
const Porcino = require('./models/Porcino');
const clienteRoutes = require('./routes/clienteRoutes');
const alimentacionRoutes = require('./routes/alimentacionRoutes');
const porcinoRoutes = require('./routes/porcinoRoutes');


const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/clientes', clienteRoutes);
app.use('/api/alimentaciones', alimentacionRoutes);
app.use('/api/porcinos', porcinoRoutes);

// Conexión a MongoDB local
mongoose.connect('mongodb://localhost:27017/la-granja', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error en MongoDB:', err));

app.get('/', (req, res) => {
  res.send('Bienvenido a La Granja S.A. backend!');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});


