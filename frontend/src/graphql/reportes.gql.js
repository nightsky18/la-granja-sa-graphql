import { gql } from '@apollo/client';

export const Q_TRAZABILIDAD = gql`
  query Trazabilidad($alimentacionId: ID, $rango: RangoFechasInput) {
    trazabilidadPorAlimento(alimentacionId: $alimentacionId, rango: $rango) {
      porcino
      cliente
      alimento
      dosis
      fecha
    }
  }
`;

export const Q_CONSUMO_CLIENTE = gql`
  query ConsumoCliente($rango: RangoFechasInput) {
    consumoPorCliente(rango: $rango) {
      cliente
      totalLbs
      eventos
      porcinos
    }
  }
`;

export const Q_CONSUMO_ALIMENTO = gql`
  query ConsumoAlimentacion($rango: RangoFechasInput) {
    consumoPorAlimentacion(rango: $rango) {
      alimento
      eventos
      totalLbs
      porcentaje
    }
  }
`;
