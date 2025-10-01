import { gql } from '@apollo/client';

// Listados
export const Q_PORCINOS = gql`
  query Porcinos {
    porcinos {
      _id
      identificacion
      raza
      edad
      peso
      cliente { _id cedula nombres apellidos }
      historialAlimentacion { dosis fecha nombreSnapshot }
    }
  }
`;

export const Q_PORCINOS_MIN = gql`
  query PorcinosMin {
    porcinos { _id identificacion }
  }
`;

export const Q_ALIMENTACIONES_MIN = gql`
  query AlimentacionesMin {
    alimentaciones { _id nombre }
  }
`;

export const Q_CLIENTES_MIN = gql`
  query ClientesMin {
    clientes { _id cedula nombres apellidos }
  }
`;

// Mutations CRUD
export const M_CREAR_PORCINO = gql`
  mutation CrearPorcino($data: PorcinoInput!) {
    crearPorcino(data: $data) {
      _id identificacion raza edad peso
      cliente { _id cedula nombres apellidos }
    }
  }
`;

export const M_ACTUALIZAR_PORCINO = gql`
  mutation ActualizarPorcino($id: ID!, $data: PorcinoUpdateInput!) {
    actualizarPorcino(id: $id, data: $data) {
      _id identificacion raza edad peso
      cliente { _id cedula nombres apellidos }
    }
  }
`;

export const M_ELIMINAR_PORCINO = gql`
  mutation EliminarPorcino($id: ID!) {
    eliminarPorcino(id: $id)
  }
`;

// Operación de negocio
export const M_ALIMENTAR_PORCINO = gql`
  mutation AlimentarPorcino($input: AlimentarPorcinoInput!) {
    alimentarPorcino(input: $input) {
      _id
      identificacion
      historialAlimentacion { dosis fecha nombreSnapshot }
    }
  }
`;
export const M_EDITAR_HISTORIAL = gql`
  mutation EditarHistorial($input: EditarHistorialInput!) {
    editarHistorialAlimentacion(input: $input) {
      _id
      identificacion
      historialAlimentacion { dosis fecha nombreSnapshot }
    }
  }
`;

export const M_ACTUALIZAR_HISTORIAL = gql`
  mutation ActualizarHistorial($porcinoId: ID!, $historialId: ID!, $data: HistorialUpdateInput!) {
    actualizarHistorialAlimentacion(porcinoId: $porcinoId, historialId: $historialId, data: $data) {
      _id
      historialAlimentacion { _id dosis fecha nombreSnapshot alimentacion { _id nombre } }
    }
  }
`;
export const M_ELIMINAR_HISTORIAL = gql`
  mutation EliminarHistorial($porcinoId: ID!, $historialId: ID!) {
    eliminarHistorialAlimentacion(porcinoId: $porcinoId, historialId: $historialId) {
      _id
      historialAlimentacion {
  _id
  dosis
  fecha
  nombreSnapshot
  alimentacion { _id nombre }
}
    }
  }
`;
