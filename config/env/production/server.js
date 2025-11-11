// path: ./config/env/production/server.js
module.exports = ({ env }) => ({
  proxy: true,
  url: env('APP_URL', 'https://delicate-attraction-2c7f961647.strapiapp.com'),
  app: {
    keys: env.array('APP_KEYS'),
  },
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
