import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './styles/tockens.css';
import './styles/base.css';
import './components/Header.css';
import reportWebVitals from './reportWebVitals';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './graphql/client';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);

reportWebVitals();
