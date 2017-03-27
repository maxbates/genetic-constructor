# Admin API

The Admin methods are NOT meant to be used or even exposed in protected environments. They can permanently remove user data leaving only very costly recovery methods. They are provided for use in local development and testing automation scenarios.

All admin storage methods start with `/api/admin`

#### Destory All Data with an OwnerId

`DELETE /api/admin/owner/:ownerId`

Permantely delete all [Projects](./PROJECTS.md), [Orders](./ORDERS.md), and [Snapshots](./SNAPSHOTS.md) for a given `ownerId`.

Returns a map of key value pairs indicating how many of each record was deleted.

```
{
  "projects": <num projects deleted>,
  "orders": <num orders deleted>,
  "snapshots": <num snapshots deleted>
}
```

The method will **NOT** return a 404 if the `ownerId` matches zero records; the map will just have all zero counts.

#### Fetch All Projects

```
GET /api/admin/allprojects
GET /api/admin/allprojects?deleted=true
```

Fetch an array of abridged project objects. Only `uuid`, `owner`, `id`, `version`, and `status` is returned. `owner` is the owner's UUID.
 
* Will return an empty array (not `404`) if no projects exist
* By default will *NOT* return deleted projects
* Accepts optional query string param `deleted` to include deleted projects in result array

Example Result:
```
[
  {
    "uuid": "6a2a98d0-f254-11e6-8852-bfa64d9f0ae0",
    "owner": "68899300-f254-11e6-bd80-1d047e817112",
    "id": "project-6a296050-f254-11e6-bd80-1d047e817112",
    "version": 0,
    "status": 1
  },
  {
    "uuid": "6a2b3510-f254-11e6-8852-bfa64d9f0ae0",
    "owner": "68899301-f254-11e6-bd80-1d047e817112",
    "id": "project-6a298760-f254-11e6-bd80-1d047e817112",
    "version": 0,
    "status": 1
  },
  {
    "uuid": "6a2b8330-f254-11e6-8852-bfa64d9f0ae0",
    "owner": "6889ba10-f254-11e6-bd80-1d047e817112",
    "id": "project-6a298761-f254-11e6-bd80-1d047e817112",
    "version": 0,
    "status": 1
  },
  {
    "uuid": "6a2bd150-f254-11e6-8852-bfa64d9f0ae0",
    "owner": "6889ba11-f254-11e6-bd80-1d047e817112",
    "id": "project-6a29ae70-f254-11e6-bd80-1d047e817112",
    "version": 0,
    "status": 1
  }
]
```