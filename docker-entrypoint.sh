#!/bin/sh

# Exit on error
set -e

echo "Starting deployment script..."

# Run migrations
echo "Running database migrations..."
if prisma migrate deploy; then
  echo "Migrations completed successfully."
else
  echo "Migrations failed! Check the database connection."
  exit 1
fi

echo "Starting application..."
exec node server.js
