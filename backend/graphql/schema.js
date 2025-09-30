// backend/graphql/schema.js
const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar Date

  type Cliente {
    _id: ID!
    cedula: String!
    nombres: String!
    apellidos: String!
    direccion: String
    telefono: String!
  }

  type Alimentacion {
    _id: ID!
    id: String!
    nombre: String!
    descripcion: String
    cantidadLibras: Float!
  }

  type HistorialAlimentacion {
    _id: ID
    alimentacion: Alimentacion
    nombreSnapshot: String
    dosis: Float!
    fecha: Date!
  }

  type Porcino {
    _id: ID!
    identificacion: String!
    raza: Int!
    edad: Int!
    peso: Float!
    cliente: Cliente
    historialAlimentacion: [HistorialAlimentacion!]!
  }

  type Query {
    # Clientes
    clientes: [Cliente!]!
    cliente(id: ID!): Cliente

    # Alimentaciones
    alimentaciones: [Alimentacion!]!
    alimentacion(id: ID!): Alimentacion

    # Porcinos
    porcinos: [Porcino!]!
    porcino(id: ID!): Porcino
  }

  input ClienteInput {
    cedula: String!
    nombres: String!
    apellidos: String!
    direccion: String
    telefono: String!
  }

  input ClienteUpdateInput {
    cedula: String
    nombres: String
    apellidos: String
    direccion: String
    telefono: String
  }

 input AlimentacionInput {
  id: String!
  nombre: String!
  descripcion: String
  cantidadLibras: Float!
}

input AlimentacionUpdateInput {
  nombre: String
  descripcion: String
  cantidadLibras: Float
}




  input PorcinoInput {
    identificacion: String!
    raza: Int!
    edad: Int!
    peso: Float!
    clienteId: ID
  }

  input PorcinoUpdateInput {
    raza: Int
    edad: Int
    peso: Float
    clienteId: ID
  }

  input AlimentarPorcinoInput {
    porcinoId: ID!
    alimentacionId: ID!
    dosis: Float!
  }

  type Mutation {
    # Clientes
    crearCliente(data: ClienteInput!): Cliente!
    actualizarCliente(id: ID!, data: ClienteUpdateInput!): Cliente!
    eliminarCliente(id: ID!): Boolean!

    # Alimentaciones
    crearAlimentacion(data: AlimentacionInput!): Alimentacion!
    actualizarAlimentacion(id: ID!, data: AlimentacionUpdateInput!): Alimentacion!
    eliminarAlimentacion(id: ID!): Boolean!

    # Porcinos
    crearPorcino(data: PorcinoInput!): Porcino!
    actualizarPorcino(id: ID!, data: PorcinoUpdateInput!): Porcino!
    eliminarPorcino(id: ID!): Boolean!

    # Operación de negocio
    alimentarPorcino(input: AlimentarPorcinoInput!): Porcino!
  }
`;

module.exports = { typeDefs };
