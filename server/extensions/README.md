Extensions handling on the server.

[Server Extensions](../docs/ServerExtensions.md) are dynamically included and are installed via `npm run install-extensions` from the project root, which will install packages listed in `package.json` in this directory. These extensions are installed in `node_modules`.

[Native Extensions](native/README.md) are included statically as part of the application bundle, and have deep access to the application and data.

