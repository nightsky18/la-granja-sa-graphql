import { useQuery } from '@apollo/client';
import { Q_TRAZABILIDAD, Q_CONSUMO_ALIMENTO, Q_CONSUMO_CLIENTE } from '../graphql/reportes.gql';

export function useTrazabilidad(alimentacionId, rango) {
  return useQuery(Q_TRAZABILIDAD, {
    variables: { alimentacionId, rango },
    fetchPolicy: 'cache-and-network',
  });
}

export function useConsumoPorCliente(rango) {
  return useQuery(Q_CONSUMO_CLIENTE, {
    variables: { rango },
    fetchPolicy: 'cache-and-network',
  });
}

export function useConsumoPorAlimentacion(rango) {
  return useQuery(Q_CONSUMO_ALIMENTO, {
    variables: { rango },
    fetchPolicy: 'cache-and-network',
  });
}
