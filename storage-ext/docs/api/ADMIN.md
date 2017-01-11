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
