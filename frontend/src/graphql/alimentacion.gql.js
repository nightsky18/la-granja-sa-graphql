import { gql } from '@apollo/client';

export const Q_ALIMENTACIONES = gql`
  query Alimentaciones {
    alimentaciones { _id id nombre descripcion cantidadLibras }
  }
`;

export const M_CREAR_ALIMENTACION = gql`
  mutation CrearAlimentacion($data: AlimentacionInput!) {
    crearAlimentacion(data: $data) { _id id nombre descripcion cantidadLibras }
  }
`;

export const M_ACTUALIZAR_ALIMENTACION = gql`
  mutation ActualizarAlimentacion($id: ID!, $data: AlimentacionUpdateInput!) {
    actualizarAlimentacion(id: $id, data: $data) { _id id nombre descripcion cantidadLibras }
  }
`;

export const M_ELIMINAR_ALIMENTACION = gql`
  mutation EliminarAlimentacion($id: ID!) {
    eliminarAlimentacion(id: $id)
  }
`;
