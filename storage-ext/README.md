# Genetic Constructor Storage

#### Background

Prior to the [v0.7.0](https://github.com/Autodesk/genetic-constructor/releases/tag/v0.7.0) release, the Genetic Constructor application stored all of its data to the local filesystem. This approach provided simplicity and use of file-system utilities for manipulating data, but resulted in the following limitations.

* A single, local filesystem can not be shared by multiple systems to provide increased user concurrency, workload segregation, or redundancy.
* A shared filesystem (i.e. NFS) brings cacheing and locking complexity in order to provide ACID-like storage operations.
* A filesystem must be indexed in order to find pieces of data quickly. This index must be maintained, ideally in a transactional manner, resulting in additional complexity, and often the use of a RDBMS.

The contents of this directory (`./storage-ext`) provides JSON storage functionality based on a RDBMS (PostgreSQL) as a stateless REST API. The RDBMS and provided API layer provide transactional, persisted storage functionality accessible by multiple applications at the same time. However, while the storage is transactional, clients may still have to handle write failure when attempting to save data that has been updated by another client. In some cases, implicit versioning is provided to make this easier.

In order to support linear scalability without hindering local development, the functionality is provided in two formats.

* An importable module that exposes the Storage API within the Genetic Constructor application. Developers must have [Docker](https://www.docker.com/what-docker) installed, but scripting is provided to start the application locally using a PostgreSQL DB running in a Docker container, with one command.
* A stand-alone Storage API REST application. In shared environments for development, testing, or production, the application can be deployed as a separate application. The Storage API will use CPU and memory for certain operations providing the Genetic Constructor application with more pure object access. Deploying the application separately allows for reduced latency and more efficient scaling.

### API

API methods use JSON for POST operations and as results for all methods.

API Reference documentation by purpose, matching URI prefix:

* `/api/projects` -> [Projects](docs/api/PROJECTS.md) - fetching and saving Projects
* `/api/blocks` -> [Blocks](docs/api/BLOCKS.md) - fetching Blocks used in Projects
* `/api/snapshots` -> [Snapshots](docs/api/SNAPSHOT.md) - Tagging versions of Projects
* `/api/orders` -> [Orders](docs/api/ORDERS.md) - fetching and saving orders for a version of a Project
* `/api/admin` -> [Admin](docs/api/ADMIN.md) - operations used during testing

### Application

As a result of being deployed as a stand-alone application, separate tests, deployment configuration, and dependencies are managed within the directory. While test coverage at the time of this writing is good, it's is advised to run all tests in the parent directory when committing changes to the storage API. Breaking changes to the API **MUST** be accompanied by a version change in `./storage-ext/package.json` to take affect by other local developers. When developing locally, and *not* running the storage application separately, you may need to repeatedly force installation of the storage API routes module such that your updated code is imported when running the Genetic Constructor application.

```
npm install ./storage-ext
```

#### Quick Start

The Storage API Application can be run within Docker in two commands.

```
npm run docker-build
npm run docker-run
```

With the automation to run the DB in Docker and import that storage API directly into the application provided in the parent directory, the main reason for using the quick start commands would be to test changes to the `Dockerfile`.

#### Local Development

The first step in local development, even running tests natively with `node` via `mocha`, is to have a PostgreSQL DB running. The easiest way to run a PostgreSQL DB locally is with Docker, but you can download and install PostgreSQL natively in most operating systems. You can start the DB locally with one command.

```npm run db``` 

This command will build and start a PostgreSQL DB in Docker within an interactive terminal, meaning the terminal will be blocked for the duration the DB is running. Data will **NOT** be persisted between executions of this command. All DB logs will be logged to the terminal and `ctrl-c` will kill the DB and remove the Docker container. It's possible to configure the PostgreSQL Docker image to use a file system that is persisted outside of the Docker container. [`docker-compose-quickstart.yml`](https://github.com/Autodesk/genetic-constructor/blob/master/storage-ext/docker-compose-quickstart.yml#L21) contains an example of using `docker-compose` to run the DB Container with a persisted storage volume.

Once you have a DB running, `npm test` and `npm start` can be used like most Node.js applications, after running `npm install`, of course.