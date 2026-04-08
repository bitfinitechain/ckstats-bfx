#!/bin/bash
while true; do
    echo "Updating users..."
    pnpm run update-users
    sleep 30
done
