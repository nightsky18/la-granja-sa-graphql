import { useMutation, useQuery } from '@apollo/client';
import { Q_ALIMENTACIONES } from '../graphql/alimentacion.gql';
import { Q_PORCINOS, M_ACTUALIZAR_HISTORIAL } from '../graphql/porcino.gql';

export function useEditarHistorial() {
  // catálogo de alimentaciones para el select
  const alimentaciones = useQuery(Q_ALIMENTACIONES, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });

  // mutation GraphQL para editar historial
  const [editar, editarState] = useMutation(M_ACTUALIZAR_HISTORIAL, {
    refetchQueries: [{ query: Q_PORCINOS }],
    awaitRefetchQueries: true,
    update(cache, { data }) {
      const porc = data?.actualizarHistorialAlimentacion;
      if (!porc) return;
      const prev = cache.readQuery({ query: Q_PORCINOS }) || { porcinos: [] };
      cache.writeQuery({
        query: Q_PORCINOS,
        data: { porcinos: prev.porcinos.map(p => (p._id === porc._id ? porc : p)) },
      });
    },
  });

  return { alimentaciones, editar, editarState };
}
