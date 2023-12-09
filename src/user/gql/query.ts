import { gql } from '@apollo/client/core';

export const GQL_USER_PROJECTS_AND_PROFILE_QUERY = gql`
  query ProfileAndProjects {
    me {
      id
      name
      isVerified
      username
      email
      avatar
      cost {
        current
        estimated
      }
      registrationStatus
    }
    projects {
      edges {
        node {
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
                      buildCommand
                      id
                      source {
                        image
                        repo
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
    }
  }
`;
