module.exports = {
    apps: [
        {
            name: 'bitfinite-ckpool-stats',
            script: 'pnpm',
            args: 'start',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '2G',
            env: {
                NODE_ENV: 'production',
                PORT: 3003,
            },
        },
    ],
};
