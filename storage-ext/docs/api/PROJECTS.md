# Projects API

The API for fetching and saving Genetic Constructor projects starts with `/api/projects`.

There are two ways to uniquely indentify a particular project record:

* `projectId` and `projectVersion`
  * `projectId` is a string and **MUST** be provided by the caller
  * `projectVersion` is an integer and can be provided by caller, but will be created, assumed, or increased in most cases to make the API easier to use
* `uuid` -> UUIDv1 created by the underlying RDBMS; not specifiable or changable by the caller

#### v0 schema

* `uuid` -> UUIDv1
* `owner`-> UUIDv1
* `id` -> String
* `version` -> Integer
* `status` -> Integer: 0 -> **deleted**, 1-> **active**
* `data` -> JSON
* `createdAt` -> Timestamp
* `updatedAt` -> Timestamp

All calls for fetching projects will return the whole schema defined above.

#### Ownership

All versions of a `projectId` must be owned by the same `owner`. This is enforced by ensuring that (`id`, `version`) is unique and (`owner` `id`, `version`) is unique.

_This isn't actually true, the above doesn't make sense, and this is a bug at the time of this writing._ [Issue #1267](https://github.com/Autodesk/genetic-constructor/issues/1267)

#### Creating Projects

`POST /api/projects`

Create a project record by posting only the project JSON object

When saving a new project, or creating a new version of a project, this method is the easiest because it requires no URI or query string parameters.

Returns the full project object with new values created by the RDBMS.

* `owner`, `id`, and `data` are required
* `version` may be include, but may not already exist
  * `version` will default to `0` if not provided
  * The method will respond with `500` if the provided `version` already exists, or `version` isn't provided and `version` `0` already exists.

#### Manage a Project with ProjectId

4 methods are provided for managing a project and its versions using its `projectId` in the URI

`GET /api/projects/:projectId`

Fetch a version of the project with the specified `projectId`.

* Optional query string parameters:
  * `version` -> fetch a specific version
  * `owner` -> limit results to a particular owner UUID
* If `version` isn't provided, the latest version of the project will be returned.
* The method will **NOT** return a `403` if the project exists, but does not belong to the specified `owner`. This is done for efficiency.
* Returns `404` if the project doesn't exist or the project doesn't belong to the specifed owner.

**Experimental Optimized Method:** `GET /api/projects/fast/project/:projectId`

---
`HEAD /api/projects/:projectId`

Check to see if a project exists

* Same optional query string parameter functionaliy as the `GET` method
* Returns `404` if the project doesn't exist
* HTTP Response Headers:
  * `Latest-Version-UUID` -> UUID of the latest version of the project or the specific version if specified
  * `Latest-Version` -> latest version of the project or the spcified version
  * `Owner` -> UUID of the project owner

**Experimental Optimized Method:** `HEAD /api/projects/fast/project/:projectId`

---
`POST /api/projects/:projectId`

Update a project

_Probably the most complicated method for managing projects, read carefully..._

Requires a post body with just one key: `data`

```
{
  "data": {
    // project data here
  }
}
```

Returns a full project object with updated `data`, and incremented `version` and new `uuid` if applicable.

* Method **ONLY** updates the `data` field of the project record, or creates a new version of the project with the updated `data`.
* The default behavior, with no query string params, is to create a new project version with the posted data. Will return `404` if the `projectId` doesn't exist.
* Optional query string params:
  * `version` - update a specific verison
    * will return `404` if the specifed `version` (or `projectId`) doesn't exist
  * `overwrite` - overwrite the lastest version
    * usage: `overwrite=true`
    * will be ignored if `version` is specified in the query string
    * finds the latest version of the project matching the specified `projectId` and updates it
    * returns `404` if the project doesn't exist

---
`DELETE /api/projects/:projectId`

This method is **POWERFUL**. While it will **NOT** actually remove any records from the RDBMS, it has the ability to mark many records as deleted with one call if limiters aren't specified.

The method will mark all project records matching the `projectId` and optional `version` specified as deleted. It will also mark any [Snapshots](./SNAPSHOTS.md) and [Orders](./ORDERS.md) matching deleted project version(s) as deleted.

_At the time of this writing there is **NO** automated way to un-delete projects, snapshots, or orders._

Returns JSON with deleted counts:

```
{
  "projects": <number of project versions deleted>,
  "snapshots": <number of snapshot deleted>,
  "orders": <number of orders deleted>
}
```

Recommended, but optional query string params:

 * `version` - only delete the specified version and any snapshots and/or orders that reference it
 * `owner` - ensure the specied `projectId` belongs to the `owner` UUID passed before marking it deleted.
 
The DELETE method will return `404` if no project records match the specifed values.

---
`GET /api/projects/versions/:projectId`

Fetch metadata for all versions of the specified `projectId`

Returns an array of objects containing all fields but the `data` field for each `version` of the specified `projectId`.

* Optional `owner` query string param can be provided to limit results to a specific owner UUID.
* Returns `404` if no project records match specified `projectId`.

#### Fetch Projects with Owner UUID

`GET /api/projects/owner/:ownerId`

Fetch all projects for a given `ownerId` UUID. The latest version of each project will be returned. By default the `blocks` value from the `data` object will be omitted in each project object.

* Optional `blocks` query string param can be set to "true" in order to fetch populated `blocks` values in the project object results.
* Returns `404` if no project records match the specified `owner` UUID.
  * The projects RDBMS does not contain the source of truth for valid, existing owner UUIDs, so a `404` doesn't incidate that the owner UUID doesn't exist.

---
`HEAD /api/projects/owner/:ownerId`

Checks to see if at least one project exists for the specified `ownerId` UUID.

Returns `404` if the specified `ownerId` UUID doesn't match any project records.

Returns HTTP headers to the be used for efficient, subsequent project fetches.

* HTTP Response Headers
  * `Last-Project` -> `projectId` of the last project the owner updated
  * `Last-Project-UUID` -> `uuid` of the specifc project record for the last version of the last project the owner updated

#### Fetch Projects with specific Block ID

`GET /api/projects/block/:blockId`

Fetch all projects containing the specified `blockId`. The latest version of each project will be returned.

Returns an array of full project objects

* Optional `owner` query string param can be provided to limit results to a specific owner UUID.
* Returns `404` if no project records match specified `blockId`.

#### Fetch Project with Project UUID

`GET /api/projects/uuid/:uuid`

Fetch a project record by the project `uuid`. Only one `version` of a `projectId` will match a specific `uuid` if it exists. The method returns `404` if no project records matches the specified `uuid`.
