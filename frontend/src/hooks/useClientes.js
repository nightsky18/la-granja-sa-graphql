// src/hooks/useClientes.js
import { useQuery, useMutation } from '@apollo/client';
import { Q_CLIENTES, M_CREAR_CLIENTE, M_ACTUALIZAR_CLIENTE, M_ELIMINAR_CLIENTE } from '../graphql/cliente.gql';

export function useClientes(opts = {}) {
  const list = useQuery(Q_CLIENTES, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

 const [crear] = useMutation(M_CREAR_CLIENTE, {
    refetchQueries: [{ query: Q_CLIENTES }],
    awaitRefetchQueries: true,
    ...opts,
    update(cache, { data }) {
      const nuevo = data?.crearCliente;
      if (!nuevo) return;
      const prev = cache.readQuery({ query: Q_CLIENTES }) || { clientes: [] };
      if (!prev.clientes.some(c => c._id === nuevo._id)) {
        cache.writeQuery({ query: Q_CLIENTES, data: { clientes: [nuevo, ...prev.clientes] } });
      }
    },
  });

  const [actualizar] = useMutation(M_ACTUALIZAR_CLIENTE, {
    refetchQueries: [{ query: Q_CLIENTES }],
    awaitRefetchQueries: true,
    ...opts,
    update(cache, { data }) {
      const upd = data?.actualizarCliente;
      if (!upd) return;
      const prev = cache.readQuery({ query: Q_CLIENTES }) || { clientes: [] };
      cache.writeQuery({
        query: Q_CLIENTES,
        data: { clientes: prev.clientes.map(c => (c._id === upd._id ? upd : c)) },
      });
    },
  });

  const [eliminar] = useMutation(M_ELIMINAR_CLIENTE, {
    refetchQueries: [{ query: Q_CLIENTES }],
    awaitRefetchQueries: true,
    ...opts,
    update(cache, { variables }) {
      const id = variables?.id;
      const prev = cache.readQuery({ query: Q_CLIENTES }) || { clientes: [] };
      cache.writeQuery({
        query: Q_CLIENTES,
        data: { clientes: prev.clientes.filter(c => c._id !== id) },
      });
    },
  });

  return { list, crear, actualizar, eliminar };
}
