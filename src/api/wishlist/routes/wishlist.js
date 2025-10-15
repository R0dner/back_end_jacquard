'use strict';

/**
 * wishlist router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Rutas por defecto
const defaultRouter = createCoreRouter('api::wishlist.wishlist');

// Rutas personalizadas
const customRoutes = {
  routes: [
    {
      method: 'DELETE',
      path: '/wishlists/producto/:productoId',
      handler: 'wishlist.deleteByProduct',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

module.exports = {
  routes: [
    ...defaultRouter.routes,
    ...customRoutes.routes,
  ],
};