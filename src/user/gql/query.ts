import { gql } from '@apollo/client/core';

export const GQL_USER_GITHUB_REPOSITORIES_QUERY = gql`
  query GithubRepositories {
    githubRepos {
      defaultBranch
      fullName
      id
      installationId
      isPrivate
      name
    }
  }
`;

export const GQL_USER_GITHUB_REPOSITORY_WITH_BRANCHES_QUERY = gql`
  query GithubRepositories($owner: String!, $repo: String!) {
    githubRepoBranches(owner: $owner, repo: $repo) {
      name
    }
  }
`;

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
    }
  }
`;
