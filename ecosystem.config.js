module.exports = {
  apps: [
    {
      name: 'strapi',
      cwd: '/var/www/jacquard-backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        DATABASE_HOST: 'db-postgresql-jzamora-do-user-224890-0.b.db.ondigitalocean.com', // database endpoint
        DATABASE_PORT: '25060',
        DATABASE_NAME: 'db-jacquard', // DB name
        DATABASE_USERNAME: 'doadmin', // your username for psql
        DATABASE_PASSWORD: 'AVNS_sGcOeR2LC0wjgtKpfM3', // your password for psql
      },
    },
  ],
};
