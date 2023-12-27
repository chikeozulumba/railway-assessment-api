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


export const GQL_GET_RAILWAY_PROJECT_QUERY = gql`
  query GetProject($id: String!) {
    project(id: $id) {
      id
      name
      description
      createdAt
      prDeploys
      prForks
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
