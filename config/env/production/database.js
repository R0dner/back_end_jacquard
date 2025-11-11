// path: ./config/env/production/database.js
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'delicate-attraction-2c7f961647.strapiapp.com'), // sin https://
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'db-jacquard'),
      user: env('DATABASE_USERNAME', 'postgres'),
      password: env('DATABASE_PASSWORD', '69827095roni'),
      ssl: false, // o agrega configuración si tu hosting lo requiere
    },
    debug: false,
  },
});
