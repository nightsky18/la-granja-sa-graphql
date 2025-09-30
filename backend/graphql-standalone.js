const mongoose = require('mongoose');
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/la-granja');
  console.log('MongoDB conectado');
  const server = new ApolloServer({ typeDefs, resolvers, introspection: true });
  const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
  console.log(`GraphQL en ${url}`);
})();
