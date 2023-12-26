import { gql } from "@apollo/client/core";

export const GQL_GET_RAILWAY_PROJECT_DEPLOYMENTS_QUERY = gql`
  query GetRailwayProjectDeployments($input: DeploymentListInput!) {
    deployments(input: $input) {
      edges {
        node {
          id
          meta
          createdAt
          canRedeploy
          service {
            id
            icon
            name
            serviceInstances {
              edges {
                node {
                  buildCommand
                  builder
                  startCommand
                  nixpacksPlan
                  numReplicas
                  region
                  serviceId
                  source {
                    image
                    repo
                  }
                  createdAt
                }
              }
            }
          }
          status
          url
          environment {
            id
            name
            meta {
              baseBranch
              branch
              prNumber
              prRepo
              prTitle
            }
            changes {
              payload
              service {
                name
                id
                icon
              }
            }
          }
        }
      }
    }
  }
`;