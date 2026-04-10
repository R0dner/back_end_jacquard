module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/reportes/movimientos',
      handler: 'reporte.getMovimientos',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/reportes/usuarios',
      handler: 'reporte.getUsuarios',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
}