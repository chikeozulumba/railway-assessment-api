import { gql } from '@apollo/client/core';

export const GQL_CREATE_RAILWAY_PROJECT_MUTATION = gql`
  mutation CreateRailwayProject($payload: ProjectCreateInput!) {
    projectCreate(input: $payload) {
      id
      name
      createdAt
      updatedAt
      name
      description
      prDeploys
      prForks
      createdAt
      updatedAt
    }
  }
`;
