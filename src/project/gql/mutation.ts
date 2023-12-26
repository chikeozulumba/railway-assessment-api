import { gql } from '@apollo/client/core';

export const GQL_DELETE_RAILWAY_PROJECT_MUTATION = gql`
  mutation DeleteRailwayProject($id: String!) {
    projectDelete(id: $id)
  }
`;

export const GQL_CREATE_RAILWAY_PROJECT_MUTATION = gql`
  mutation CreateRailwayProject($input: ProjectCreateInput!) {
    projectCreate(input: $input) {
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
      services {
        edges {
          node {
            id
            name
            createdAt
            updatedAt
            serviceInstances {
              edges {
                node {
                  domains {
                    serviceDomains {
                      domain
                    }

                    customDomains {
                      domain
                    }
                  }
                  builder
                  buildCommand
                  id
                  source {
                    image
                    repo
                    template {
                      serviceName
                      serviceSource
                    }
                  }
                  startCommand
                  serviceId
                  numReplicas
                }
              }
            }
          }
        }
      }
    }
  }
`;
