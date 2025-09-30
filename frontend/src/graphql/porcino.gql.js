import { gql } from '@apollo/client';

export const M_ALIMENTAR_PORCINO = gql`
  mutation AlimentarPorcino($input: AlimentarPorcinoInput!) {
    alimentarPorcino(input: $input) {
      _id
      identificacion
      historialAlimentacion { dosis fecha nombreSnapshot }
    }
  }
`;

export const Q_PORCINOS_MIN = gql`
  query Porcinos {
    porcinos { _id identificacion }
  }
`;
