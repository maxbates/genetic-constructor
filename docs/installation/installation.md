Genetic Constructor can be run a few different ways.

## Without Authentication

Easiest way to get set up, using mocked authentication. In this installation, there are no accounts. Everything will function normally, with the caveat that the user is forced and has an ID of 0. This is the recommended configuration for local development, at least initially.

`npm install`

`npm run start`

Please check `package.json` to ensure you have valid versions of globally installed software packages (e.g. node, npm, webpack).

## With Authentication

User authentication depends on the Bio/Nano User Platform project, which is currently not open source and requires access to the Autodesk internal GitHub.

As a result, user authentication is NOT enabled by default when running this application locally. Authentication routes and a user object is provided but is mocked in middleware and routes provided in this project by default.

If you have the bio-user-platform installed, you can run the server with authentication by running:

`npm run start-auth-stack`.

[Click here to read how to install the bio-user-platform](./installation-bio-user-platform.md)

## Troubleshooting

If you encounter an issue in installation, it may be covered in notes on [troubleshooting](./troubleshooting.md).

Otherwise, please [file an issue on GitHub](https://github.com/autodesk-bionano/genome-designer/issues/new)