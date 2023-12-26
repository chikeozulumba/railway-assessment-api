import { gql } from "@apollo/client";

export const GQL_GET_RAILWAY_DEPLOYMENT_BY_ID_QUERY = gql`
  query GetRailwayDeployment($id: String!) {
    deployment(id: $id) {
      id
      createdAt
      environment {
        id
        name
      }
      service {
        id
        name
        icon
        serviceInstances {
          edges {
            node {
              id
              domains {
                customDomains {
                  id
                  domain
                }
                serviceDomains {
                  id
                  domain
                }
              }
              healthcheckPath
              numReplicas
              region
              
            }
          }
        }
      }
      status
      canRedeploy
      canRollback
      meta
      projectId
      staticUrl
      url
    }
  }
`

export const GQL_GET_RAILWAY_DEPLOYMENT_LOGS_QUERY = gql`
  query GetRailwayDeploymentLogs($deploymentId: String!, $limit: Int) {
    deploymentLogs(deploymentId: $deploymentId, limit: $limit) {
      severity
      message 
      attributes {
        key
        value
      }
      timestamp
      tags {
        deploymentId
        deploymentInstanceId
        pluginId
        projectId
        serviceId
        snapshotId
        environmentId
      }
    }
  }
`

export const GQL_GET_RAILWAY_DEPLOYMENT_BUILD_LOGS_QUERY = gql`
  query GetRailwayDeploymentBuildLogs($deploymentId: String!, $limit: Int) {
    buildLogs(deploymentId: $deploymentId, limit: $limit) {
      severity
      message 
      attributes {
        key
        value
      }
      timestamp
      tags {
        deploymentId
        deploymentInstanceId
        pluginId
        projectId
        serviceId
        snapshotId
        environmentId
      }
    }
  }
`