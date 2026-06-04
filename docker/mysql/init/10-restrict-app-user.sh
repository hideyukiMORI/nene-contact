#!/bin/bash
# ADR 0016 (defense in depth): the runtime DB user must not be able to physically
# delete rows. Revoke DELETE on the app database, leaving SELECT/INSERT/UPDATE and DDL
# (for migrations) intact. Personal-data erasure is an UPDATE (erase-in-place), so the
# app and the purge job are unaffected.
#
# Runs once on a fresh data volume (docker-entrypoint-initdb.d). To apply to an existing
# local stack: `docker compose down -v && docker compose up -d`.
set -e

# The mysql entrypoint escapes `_` (a grant-pattern wildcard) when it grants the schema,
# so the REVOKE target must escape it too, else MySQL reports "no such grant" (1141).
escaped_db=$(printf '%s' "${MYSQL_DATABASE}" | sed 's/_/\\_/g')

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
	REVOKE DELETE ON \`${escaped_db}\`.* FROM '${MYSQL_USER}'@'%';
	FLUSH PRIVILEGES;
EOSQL

echo "ADR 0016: DELETE revoked from '${MYSQL_USER}' on '${MYSQL_DATABASE}'."
