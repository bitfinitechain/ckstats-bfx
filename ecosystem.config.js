module.exports = {
    apps: [
        {
            name: 'bitfinite-stats',
            script: 'server.ts',
            interpreter: 'node_modules/.bin/tsx',
            env: {
                NODE_ENV: 'production',
                PORT: 3004,
            },
        },
    ],
};
