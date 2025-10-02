const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');

const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');

const importarRoutes = require('./routes/importarRoutes');

(async () => {
  const app = express();
  const httpServer = http.createServer(app);

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use('/api/importar', importarRoutes);
  
  // Healthcheck
  app.get('/health', (_req, res) => res.status(200).send('OK'));

  // Mongo
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/la-granja';
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB conectado');

  // Apollo
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: true,
  });
  await apollo.start();
  console.log('Apollo Server iniciado');

  // Handler GraphQL (POST /graphql) compatible con Apollo v4
  app.post('/graphql', async (req, res) => {
    try {
      apollo.assertStarted('Server no iniciado');

      // Asegurar body JSON
      const reqBody = typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body ?? {});

      // Construir Headers WHATWG
      const hdrs = new Headers();
      for (const [k, v] of Object.entries(req.headers || {})) {
        hdrs.set(k, Array.isArray(v) ? v.join(', ') : String(v));
      }

      // Ejecutar la operación
      const httpGraphQLResponse = await apollo.executeHTTPGraphQLRequest({
        httpGraphQLRequest: {
          method: req.method,
          headers: hdrs,
          search: req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '',
          body: reqBody,
        },
        context: async () => ({ token: req.headers.authorization || '' }),
      });

      // Propagar cabeceras
    // Propagar cabeceras que vengan de Apollo
for (const [key, value] of httpGraphQLResponse.headers) {
  res.setHeader(key, value);
}
// Forzar JSON si falta o es incorrecto
const ct = String(res.getHeader('content-type') || '');
if (!ct.includes('application/json')) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
}
res.status(httpGraphQLResponse.status || 200);

// Normalizar body a JSON string
let body = httpGraphQLResponse.body;

// 1) Si viene como objeto { kind, string }, usar string
if (body && typeof body === 'object' && 'kind' in body && 'string' in body) {
  body = body.string;
}

// 2) Si es async iterable, concatenar
if (body && typeof body[Symbol.asyncIterator] === 'function') {
  let full = '';
  for await (const chunk of body) {
    full += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8');
  }
  return res.send(full);
}

// 3) Si es Buffer/Uint8Array
if (body && typeof body === 'object' && (Buffer.isBuffer(body) || body.constructor?.name === 'Uint8Array')) {
  return res.send(Buffer.from(body).toString('utf-8'));
}

// 4) Si es string, enviarlo tal cual
if (typeof body === 'string') {
  return res.send(body);
}

// 5) Si es objeto serializable (p.ej. { data: ... }), enviarlo como JSON
if (body && typeof body === 'object') {
  return res.send(JSON.stringify(body));
}

// 6) Fallback para evitar "missing response"
return res.send('{"data":null}');

    } catch (e) {
      console.error('Error en /graphql:', e);
      return res.status(500).json({ errors: [{ message: e.message || 'Error interno' }] });
    }
  });

  // Raíz
  app.get('/', (_req, res) =>
    res.status(200).send('Backend La Granja S.A. - GraphQL en POST /graphql')
  );

  // Arranque
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Servidor Express 5 listo en puerto ${PORT}`);
    console.log(`GraphQL disponible en POST http://localhost:${PORT}/graphql`);
  });
})();
