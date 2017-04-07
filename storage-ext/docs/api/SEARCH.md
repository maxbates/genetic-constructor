# Search API

#### Search projects by project 'name'

`GET /api/search/projects/name/:nameQuery`

Fetch project UUIDs that have a user-specified name matching the provided name query.

The Project JSON schema currently specified by the Genetic Constructor application stores a user specified name in the `data` field.

```
{
  ...
  data: {
    project: {
      metadata: {
        name: 'The Project Name',
        ...
      }
    }
  }
}
```
The API will return the latest version of any project that contains the `nameString` within the `name` field in the Project `data` object.
  
The `nameQuery` must be [Base64 URL-encoded](https://www.npmjs.com/package/urlsafe-base64).

Returns an array of project UUUIDs.

The caller can specify an optional `owner` UUID as a query string parameter to limit the search to only projects owned by the specified `owner`. Example:

```
GET /api/search/projects/name/dG91Y2g?owner=810ffb30-1938-11e6-a132-dd99bc746800
```

Returns `404` if the no projects match the provided `nameQuery`. If the `owner` query string parameter is provided a `404` will be returned when projects _do_ match, but aren't owned by the provided owner.

#### Fetch Array of Projects with List of Project UUIDs

`POST /api/search/projects/list`

Post an list of Project UUIDs and receive an array of Project objects with or without `Blocks`.

This method is intended for use with other Search methods that return lists of Project UUIDs.

Optional query string param `blocks` can be provided and if set to `true`, will result in the project objects containing block information. Example:

```
POST /api/search/projects/list?blocks=true
[ 'f8fb0960-15a8-11e7-ad24-8fc646a92b2c',
  'f8fbccb0-15a8-11e7-ad24-8fc646a92b2c',
  'f8fc1ad0-15a8-11e7-ad24-8fc646a92b2c',
  'f8fc9000-15a8-11e7-ad24-8fc646a92b2c',
  'f8feb2e0-15a8-11e7-ad24-8fc646a92b2c',
  'f8ff0100-15a8-11e7-ad24-8fc646a92b2c' ]
```

The result array _may_ contain null values if a UUID provided wasn't valid.
