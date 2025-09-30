// backend/index.js
console.log('Cargando index.js desde:', __filename);

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');

// Carga de modelos (ajusta rutas si difieren)
require('./models/Cliente');
require('./models/Alimentacion');
require('./models/Porcino');

// Apollo Server v4
const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');

// NOTA IMPORTANTE:
// En algunos entornos, @apollo/server ya no expone el subpath '/express4' y el adaptador
// externo '@as-integrations/express' puede no estar disponible en el registry utilizado.
// Por ello, montaremos el middleware manualmente con un handler POST en /graphql,
// lo cual es totalmente compatible con Express 5 y Apollo v4.

const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');

(async () => {
  try {
    const app = express();
    const httpServer = http.createServer(app);

    // Middlewares base
    app.use(cors());
    app.use(express.json());

    // Salud
    app.get('/health', (_req, res) => res.status(200).send('OK'));

    // Conexión MongoDB
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

    // Montaje manual del endpoint GraphQL en Express 5:
    // Acepta POST application/json y reenvía al servidor Apollo.
    app.post('/graphql', async (req, res) => {
      try {
        // Apollo v4 expone el método 'executeHTTPGraphQLRequest' a través de 'apollo.executeHTTPGraphQLRequest'
        // Pero como API interna puede variar; por compatibilidad usaremos 'server.assertStarted' + 'server.executeHTTPGraphQLRequest'.
        apollo.assertStarted('Server no iniciado');

        const httpGraphQLResponse = await apollo.executeHTTPGraphQLRequest({
          httpGraphQLRequest: {
            method: req.method,
            headers: req.headers,
            search: req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '',
            body: req.body,
          },
          context: async () => ({ token: req.headers.authorization || '' }),
        });

        // Preparar respuesta
        for (const [key, value] of httpGraphQLResponse.headers) {
          res.setHeader(key, value);
        }
        res.status(httpGraphQLResponse.status || 200);
        const responseBody = httpGraphQLResponse.body;
        if (typeof responseBody === 'string') {
          res.send(responseBody);
        } else {
          // Para cuerpos async-iterable, concatenar
          let fullBody = '';
          for await (const chunk of responseBody) {
            fullBody += chunk;
          }
          res.send(fullBody);
        }
      } catch (e) {
        console.error('Error en /graphql:', e);
        res.status(500).json({ errors: [{ message: e.message || 'Error interno' }] });
      }
    });

    // Página informativa
    app.get('/', (_req, res) => res.status(200).send('Backend La Granja S.A. - GraphQL en POST /graphql'));

    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Servidor Express 5 listo en puerto ${PORT}`);
      console.log(`GraphQL disponible en POST http://localhost:${PORT}/graphql`);
    });
  } catch (err) {
    console.error('Fallo al iniciar:', err);
    process.exit(1);
  }
})();
