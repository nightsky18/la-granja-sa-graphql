import { useQuery, useMutation } from '@apollo/client';
import { Q_CLIENTES, M_CREAR_CLIENTE, M_ACTUALIZAR_CLIENTE, M_ELIMINAR_CLIENTE } from '../graphql/cliente.gql';

export function useClientes() {
  const list = useQuery(Q_CLIENTES);
  const [crear] = useMutation(M_CREAR_CLIENTE, { refetchQueries: [Q_CLIENTES] });
  const [actualizar] = useMutation(M_ACTUALIZAR_CLIENTE, { refetchQueries: [Q_CLIENTES] });
  const [eliminar] = useMutation(M_ELIMINAR_CLIENTE, { refetchQueries: [Q_CLIENTES] });
  return { list, crear, actualizar, eliminar };
}
