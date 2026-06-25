#!/bin/sh
set -e

echo "Running database migrations..."
node scripts/with-prisma.mjs migrate deploy

if [ "${RUN_DB_SEED}" = "true" ]; then
  echo "Seeding database..."
  node scripts/with-prisma.mjs db seed
fi

echo "Starting server..."
exec node server.js
