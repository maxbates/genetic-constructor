# Orders API

The Genetic Constructor `Order` API allows for storing typed metadata and JSON data corresponding to an order created from a specific version of a [Project](./PROJECTS.md). All methods for managing orders start with `/api/orders`.

An order record possesses a unique `uuid` created by the RDMBS. Each order record has a mandatory `id` string provided by the caller. Two orders cannot exist with the same `owner` and `id`. Unlike [Snapshots](./SNAPSHOTS.md) multiple orders may exist for the same project record version, `projectId` and `projectVersion`.

_At the time of this writing there is a data consistency bug trackced by [Issue #1270](https://github.com/Autodesk/genetic-constructor/issues/1270)_

#### v0 schema

* `uuid` -> UUIDv1 for order record
* `owner` -> UUIDv1
* `id` -> String
* `type` -> String
* `status` -> Integer: 0 -> **deleted**, 1-> **active**
* `data` -> JSON
* `projectUUID` -> UUIDv1 (`uuid` from the target project record)
* `projectId` -> String (`id` from the target project)
* `projectVersion` -> Integer (`version` from the target project)

#### Ownership

The owner of the order must be the owner of the project record.

#### Creating Orders

`POST /api/orders`

Create an order record by posting the order metadata, data, and the `projectId` of the target project. The latest version of the specified project will be used if `projectVersion` isn't provided in the post body.

All values are passed as one JSON object in the POST body.

```
{
  "id": "testOrder0"
  "owner": <ownerUUID>,
  "projectId": <projectId>,
  "type": "test",
  "data": {
    "test": true,
    "hello": "kitty",
    "stuff": ["ying", "yang"],
  }
}              
```		              
Returns the full order object with fields populated by the RDBMS.

* Required: `id`, `owner`, `projectId`, `type`, `data`
* Optional: `projectVersion`
* Returns `404` if the specified `projectId` doesn't exist

#### Fetch Orders with ProjectId

Orders can be fetched by specifying the `projectId` they reference.

`GET /api/orders/:projectId`

Fetch all orders referencing the specified `projectId`

Returns an array of order records.

* Optional `projectVersion` query string param can be provided to limit query to a specific version of a project.
* Returns `404` if no orders exist for the given `projectId`, and `projectVersion` if specified

---
`HEAD /api/orders/:projectId`

Check to see if any orders exist for the given `projectId`. Also allows an optional query string param `projectVersion` like the `GET` method. If one or more orders exist for the given `projectId` a HTTP header is included in the response for efficient, subsequent fetching.

* HTTP Reponse Headers
  * `Latest-Order-Id` -> `id` of the last order created/updated for the specified `projectId` and optional `projectVersion`
  * `Latest-Order-UUID` -> `uuid` of the last order created/updated for the specified `projectId` and optional `projectVersion`
* Returns `404` if no orders exist for the given `projectId`, and `projectVersion` if specified

#### Managing Orders with OrderId

Fetch an order using an `id`.

These methods assume the `id` field is unique across **ALL** order records, which currently isn't enforced by the RDBMS. See [Issue #1270](https://github.com/Autodesk/genetic-constructor/issues/1270)

`GET /api/orders/id/:orderId`

Fetch the order record for the provided `orderId`

Returns an order object if one matches the provided `orderId`

* The method will return `500` if more than one order matches the passed `orderId`
* Optional query string param `owner` may be provided to limit the search and/or enforce permissions. Passing `owner` is recommended to avoid a possible error if multiple orders have the same `id`.
* Returns `404` if no orders are found. 

---
`HEAD /api/orders/id/:orderId`

Check to see if an order exists for the provided `orderId`. Allows an optional query string param `owner` to limit search and enforce permissions like similar `GET` method. Also like the similar `GET` method the `HEAD` method will return `500` if more than one order matches the `orderId` and `owner` isn't specified. If one order is found, the HTTP Headers will help with an efficient, subsquent request.

* HTTP Response Headers
  * `Order-UUID` -> `uuid` of the order record
* Returns `404` if no orders are found.  

---
`DELETE /api/orders/id/:orderId`

Delete orders matching the provided `orderId`. This method gracefully handles multiple orders with the same `orderId`, but again the optional `owner` query string param is recommend to avoid deleting another user's order.

Returns a JSON object with the number of orders deleted to support the cascading delete functionality in the [Project](./PROJECTS.md) API.

```
{
  "numDeleted": 1
}
```

* Optional query string param `owner` is recommended
* Unlike the project DELETE API, orders can be permanently removed from the RDMBS using this API by specifying an optional query string param `destroy=true`. Otherwise the orders will be marked as deleted but not removed.
* Returns `404` if the `orderId` doesn't match any orders records.

#### Managing Orders with Order UUID

`GET /api/orders/uuid/:uuid`

Fetch the order record matching the specified `uuid`

Returns an order record or `404` if the specified `uuid` doesn't match any order records.

___
`DELETE /api/orders/uuid/:uuid`

Delete the order record with the specified `uuid` if it exists.

Returns a JSON object with the number of orders deleted to support the cascading delete functionality in the [Project](./PROJECTS.md) API.

* Unlike the project DELETE API, orders can be permanently removed from the RDMBS using this API by specifying an optional query string param `destroy=true`. Otherwise the orders will be marked as deleted but not removed.
* Returns `404` if the `uuid` doesn't match any orders records.
