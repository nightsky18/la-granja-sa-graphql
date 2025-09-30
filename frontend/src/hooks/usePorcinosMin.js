import { useQuery, useMutation } from '@apollo/client';
import { Q_PORCINOS_MIN, M_ALIMENTAR_PORCINO } from '../graphql/porcino.gql';

export function usePorcinosMin() {
  const porcinos = useQuery(Q_PORCINOS_MIN, { fetchPolicy: 'cache-and-network' });
  const [alimentar] = useMutation(M_ALIMENTAR_PORCINO);
  return { porcinos, alimentar };
}
