## Description

GraphQL API uilt for Railway assessment project (RunThrough) using the [NestJS](https://github.com/nestjs/nest) framework based on JavaScript/TypeScript.

## Stack

- Node - TypeScript/Javascript
- MongoDB - Data storage usign replica sets (using either MongoDB Atlas or run `run-rs` locally)
- Redis - for cache and background queues
- Apollo GraphQL - For handling requests to Railway GraphQL API server
- [Prisma](https://prisma.io/) - Database ORM
- [Clerk](https://clerk.com/) - NextJS Authentication

## Prerequisite

Ensure you have a MongoDB repllica set running locally or you can make use of MongoDB Atlas. Make use of `run-rs` to enable you run the MongoDB server you have locally on your machine as a replica set.
Also ensure you have [Clerk](https://clerk.com/) setup and have installed the environment variables as provided in the [.env.example](.env.example) file.

## Installation

```bash
# Install dependencies
$ pnpm install

# Generate and transform Prisma models into GraphQL types - found in src/models
$ pnpm prisma generate
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Build

The application has a [Dockerfile](Dockerfile) to enable you build and deploy on any container enabled service.

```bash
# build only
$ pnpm run build
```
