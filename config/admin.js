module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '07b71cea00d61265f146d60bf4b4aaf4'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  // AGREGA ESTO para forzar regeneración de permisos
  autoOpen: false,
  watchIgnoreFiles: [
    '**/config/sync/**',
    '**/src/api/**/schema.json'
  ],
});