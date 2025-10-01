import { useQuery, useMutation } from '@apollo/client';
import {
  Q_PORCINOS, Q_CLIENTES_MIN, Q_ALIMENTACIONES_MIN,
  M_CREAR_PORCINO, M_ACTUALIZAR_PORCINO, M_ELIMINAR_PORCINO, M_ALIMENTAR_PORCINO
} from '../graphql/porcino.gql';

export function usePorcinos() {
  const porcinos = useQuery(Q_PORCINOS, { fetchPolicy: 'cache-and-network' });
  const clientes = useQuery(Q_CLIENTES_MIN, { fetchPolicy: 'cache-and-network' });
  const alimentaciones = useQuery(Q_ALIMENTACIONES_MIN, { fetchPolicy: 'cache-and-network' });

  const [crear] = useMutation(M_CREAR_PORCINO, { refetchQueries: [Q_PORCINOS] });
  const [actualizar] = useMutation(M_ACTUALIZAR_PORCINO, { refetchQueries: [Q_PORCINOS] });
  const [eliminar] = useMutation(M_ELIMINAR_PORCINO, { refetchQueries: [Q_PORCINOS] });
  const [alimentar] = useMutation(M_ALIMENTAR_PORCINO, { refetchQueries: [Q_PORCINOS] });

  return { porcinos, clientes, alimentaciones, crear, actualizar, eliminar, alimentar };
}
