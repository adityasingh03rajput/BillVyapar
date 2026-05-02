#!/bin/sh

# Allocate 512MB of swap space to prevent OOM kills on small instances
if [ ! -f /swapfile ]; then
    echo "Creating 512MB swap file..."
    dd if=/dev/zero of=/swapfile bs=1M count=512
    chmod 0600 /swapfile
    mkswap /swapfile
fi

echo "Enabling swap..."
swapon /swapfile || echo "Could not enable swap (maybe already enabled or no permission)"

# Start the application
exec node src/index.js
