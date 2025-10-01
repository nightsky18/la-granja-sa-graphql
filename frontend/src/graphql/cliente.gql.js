// src/graphql/cliente.gql.js
import { gql } from '@apollo/client';

// LISTA COMPLETA
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

// LISTA MINIMA (para selects)
export const Q_CLIENTES_MIN = gql`
  query ClientesMin {
    clientes {
      _id
      cedula
      nombres
      apellidos
    }
  }
`;

// CREAR
export const M_CREAR_CLIENTE = gql`
  mutation CrearCliente($data: ClienteInput!) {
    crearCliente(data: $data) {
      _id
      cedula
      nombres
      apellidos
      direccion
      telefono
    }
  }
`;

// ACTUALIZAR
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


// ELIMINAR
export const M_ELIMINAR_CLIENTE = gql`
  mutation EliminarCliente($id: ID!) {
    eliminarCliente(id: $id)
  }
`;
