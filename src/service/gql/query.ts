import { gql } from "@apollo/client/core";

export const GQL_GET_RAILWAY_SERVICE_DEPLOYMENTS_QUERY = gql`
  query GetRailwayServiceDeployments($input: DeploymentListInput!) {
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

export const GQL_GET_RAILWAY_SERVICE_WITH_INSTANCES_AND_REPO_TRIGGERS_QUERY = gql`
  query GetServiceWithInstancesAndRepoTriggers($serviceId: String!) {
    service(id: $serviceId) {
      id
      name
      icon
      projectId
      createdAt
      deletedAt
      project {
        id
        name
      }
      serviceInstances {
        edges {
          node {
            id
            builder
            buildCommand
            startCommand
            healthcheckPath
            nixpacksPlan
            numReplicas
            region
            restartPolicyType
            createdAt
            source {
              image
              repo
              template {
                serviceName
                serviceSource
              }
            }
            domains {
              customDomains {
                id
                status {
                  cdnProvider
                  certificateStatus
                }
                domain
              }
              serviceDomains {
                id
                domain
              }
            }
          }
        }
      }
      repoTriggers {
        edges {
          node {
            id
            repository
            branch
            provider
            validCheckSuites
          }
        }
      }
    }
  }
`