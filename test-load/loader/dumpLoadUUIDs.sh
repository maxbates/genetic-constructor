#!/usr/bin/env bash
set -e
which psql

DIR=$(dirname "$0")
QUERYINPUT="${DIR}/load-uuid-query.sql"
psql -U storage -h platform-db.dev.bionano.bio -W -f ${QUERYINPUT} -q storage > ./loader-uuids.out
