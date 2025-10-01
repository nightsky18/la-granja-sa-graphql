import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
const URL = process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:5000/graphql';

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: URL }),
  cache: new InMemoryCache(),
});
