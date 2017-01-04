# Blocks API

The `blocks` data entity is part of the Genetic Constructor [Project](./PROJECTS.md) object. The methods starting with `/api/blocks` provide functionality for finding blocks across projects and providing aggregate information about blocks irrespective of projects. The [Project](./PROJECTS.md) API supports fetching projects containing a specific `blockId`.

**ALL** methods in the Blocks API require an `ownerId` to limit the search scope.

#### Fetch Blocks by Name

`GET /api/blocks/name/:ownerId/:name`

Fetch all blocks in all of the owner's projects that match the `name` provided in the URI. The method will look for the `name` value _anywhere_ in the block's name, so it doesn't have to be exact.

Returns an array of block objects from the latest version of each project where `block.metadata.name` contains the specified `name` value.

Returns `404` if the 

#### Fetch Blocks by Role

`GET /api/blocks/role/:ownerId/:role`

Fetch all blocks in all of the owner's projects that match the `role` provided in the URI. The method will look for the `role` value _anywhere_ in the block's role, so it doesn't have to be exact.

To fetch roles with `null` or `undefined` role, specify a `role` value of **"none"**.

Returns an array of block objects from the latest version of each project where `block.rules.role` contains the specified `role` value.

#### Fetch Block Counts by Role

`GET /api/blocks/role/:ownerId`

Fetch a map where each key is a block `role` and the value is the number of blocks with the respective role in the latest version of each of the owner's projects.

Blocks without `role` will be grouped into the `none` key.

Retuns a map or `404`

Example:

```
{ 
  "none": 28,
  "terminator": 4,
  "promoter": 4
}
```
