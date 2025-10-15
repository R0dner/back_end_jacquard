'use strict';

/**
 * wishlist service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::wishlist.wishlist', ({ strapi }) => ({
  // Método personalizado: Obtener wishlist de un usuario
  async getUserWishlist(userId) {
    return await strapi.db.query('api::wishlist.wishlist').findMany({
      where: { user: userId },
      populate: {
        producto: {
          populate: ['imagen_principal', 'marca'],
        },
      },
    });
  },

  // Método personalizado: Verificar si un producto está en wishlist
  async isInWishlist(userId, productoId) {
    const wishlist = await strapi.db.query('api::wishlist.wishlist').findOne({
      where: {
        user: userId,
        producto: productoId,
      },
    });

    return !!wishlist;
  },

  // Método personalizado: Contar productos en wishlist
  async countUserWishlist(userId) {
    return await strapi.db.query('api::wishlist.wishlist').count({
      where: { user: userId },
    });
  },
}));