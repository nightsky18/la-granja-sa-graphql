const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');

const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');

(async () => {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.status(200).send('OK'));

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/la-granja';
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB conectado');

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: true,
  });
  await apollo.start();
  console.log('Apollo Server iniciado');

  // Handler POST /graphql compatible con Apollo v4 (sin adaptador externo)
  app.post('/graphql', async (req, res) => {
    try {
      apollo.assertStarted('Server no iniciado');

      // Body robusto
      const reqBody = typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body ?? {});

      // Headers WHATWG (Node 22 tiene Headers nativo)
      const hdrs = new Headers();
      for (const [k, v] of Object.entries(req.headers || {})) {
        hdrs.set(k, Array.isArray(v) ? v.join(', ') : String(v));
      }

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
      for (const [key, value] of httpGraphQLResponse.headers) {
        res.setHeader(key, value);
      }
      // Forzar content-type si falta
      if (!res.getHeader('content-type')) {
        res.setHeader('content-type', 'application/json; charset=utf-8');
      }
      res.status(httpGraphQLResponse.status || 200);

      // Enviar body siempre
      const body = httpGraphQLResponse.body;
      if (typeof body === 'string') {
        return res.send(body);
      }
      if (body && typeof body[Symbol.asyncIterator] === 'function') {
        let full = '';
        for await (const chunk of body) full += chunk;
        return res.send(full);
      }
      if (body) {
        return res.send(body);
      }
      // Fallback para evitar "Server response was missing"
      return res.send('{"data":null}');
    } catch (e) {
      console.error('Error en /graphql:', e);
      return res.status(500).json({ errors: [{ message: e.message || 'Error interno' }] });
    }
  }); // <-- cierre del handler

  app.get('/', (_req, res) =>
    res.status(200).send('Backend La Granja S.A. - GraphQL en POST /graphql')
  );

  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Servidor Express 5 listo en puerto ${PORT}`);
    console.log(`GraphQL disponible en POST http://localhost:${PORT}/graphql`);
  });
})();
