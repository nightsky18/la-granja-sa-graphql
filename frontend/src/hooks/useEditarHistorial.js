import { useQuery, useMutation } from '@apollo/client';
import { Q_ALIMENTACIONES_MIN } from '../graphql/porcino.gql';
import { M_EDITAR_HISTORIAL } from '../graphql/porcino.gql';

export function useEditarHistorial() {
  const alimentaciones = useQuery(Q_ALIMENTACIONES_MIN, { fetchPolicy: 'cache-and-network' });
  const [editar] = useMutation(M_EDITAR_HISTORIAL);
  return { alimentaciones, editar };
}
