import { gql } from '@apollo/client/core';

export const GQL_DELETE_RAILWAY_SERVICE_MUTATION = gql`
  mutation DeleteRailwayService($id: String!) {
    serviceDelete(id: $id) 
  }
`;

export const GQL_CREATE_RAILWAY_PROJECT_SERVICE_MUTATION = gql`
  mutation ProjectCreateService($input: ServiceCreateInput!) {
    serviceCreate(input: $input) { 
      id
      name
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
      deployments {
        edges {
          node {
            id
            status
            createdAt
            canRedeploy
            suggestAddServiceDomain
            staticUrl
            environment {
              id
              name
            }
          }
        }
      }
    }
  }
`;
