import { useQuery, useMutation } from '@apollo/client';
import {
  Q_ALIMENTACIONES,
  M_CREAR_ALIMENTACION,
  M_ACTUALIZAR_ALIMENTACION,
  M_ELIMINAR_ALIMENTACION,
} from '../graphql/alimentacion.gql';

export function useAlimentaciones() {
  const list = useQuery(Q_ALIMENTACIONES, { fetchPolicy: 'cache-and-network' });
  const [crear] = useMutation(M_CREAR_ALIMENTACION, { refetchQueries: [Q_ALIMENTACIONES] });
  const [actualizar] = useMutation(M_ACTUALIZAR_ALIMENTACION, { refetchQueries: [Q_ALIMENTACIONES] });
  const [eliminar] = useMutation(M_ELIMINAR_ALIMENTACION, { refetchQueries: [Q_ALIMENTACIONES] });
  return { list, crear, actualizar, eliminar };
}
