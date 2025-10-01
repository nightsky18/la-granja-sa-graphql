import { gql } from '@apollo/client';



export const Q_CLIENTES = gql`
  query Clientes {
    clientes {
      _id
      cedula
      nombres
      apellidos
      direccion
      telefono
    }
  }
`;

export const M_CREAR_CLIENTE = gql`
  mutation CrearCliente($data: ClienteInput!) {
    crearCliente(data: $data) {
      _id
      cedula
      nombres
      apellidos
      telefono
    }
  }
`;

export const M_ACTUALIZAR_CLIENTE = gql`
  mutation ActualizarCliente($id: ID!, $data: ClienteUpdateInput!) {
    actualizarCliente(id: $id, data: $data) {
      _id
      cedula
      nombres
      apellidos
      direccion
      telefono
    }
  }
`;

export const M_ELIMINAR_CLIENTE = gql`
  mutation EliminarCliente($id: ID!) {
    eliminarCliente(id: $id)
  }
`;
