'use strict';

/**
 * wishlist controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::wishlist.wishlist', ({ strapi }) => ({
  // Sobrescribir el método find para filtrar por usuario
  async find(ctx) {
    // Obtener el usuario autenticado
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('No estás autenticado');
    }

    // Filtrar solo los wishlists del usuario actual
    ctx.query = {
      ...ctx.query,
      filters: {
        ...ctx.query.filters,
        user: {
          id: user.id,
        },
      },
    };

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  // Sobrescribir create para asociar automáticamente al usuario
  async create(ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('No estás autenticado');
    }

    // Verificar si el producto ya está en el wishlist del usuario
    const existingWishlist = await strapi.db.query('api::wishlist.wishlist').findOne({
      where: {
        user: user.id,
        producto: ctx.request.body.data.producto,
      },
    });

    if (existingWishlist) {
      return ctx.badRequest('Este producto ya está en tu lista de deseados');
    }

    // Agregar el usuario automáticamente
    ctx.request.body.data = {
      ...ctx.request.body.data,
      user: user.id,
      fecha_agregado: new Date(),
    };

    const response = await super.create(ctx);
    return response;
  },

  // Sobrescribir delete para verificar que el usuario sea el dueño
  async delete(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    if (!user) {
      return ctx.unauthorized('No estás autenticado');
    }

    // Verificar que el wishlist pertenece al usuario
    const wishlist = await strapi.db.query('api::wishlist.wishlist').findOne({
      where: { id },
      populate: ['user'],
    });

    if (!wishlist) {
      return ctx.notFound('Wishlist no encontrado');
    }

    if (wishlist.user.id !== user.id) {
      return ctx.forbidden('No tienes permiso para eliminar este wishlist');
    }

    const response = await super.delete(ctx);
    return response;
  },

  // Método personalizado: Eliminar por producto
  async deleteByProduct(ctx) {
    const user = ctx.state.user;
    const { productoId } = ctx.params;

    if (!user) {
      return ctx.unauthorized('No estás autenticado');
    }

    const wishlist = await strapi.db.query('api::wishlist.wishlist').findOne({
      where: {
        user: user.id,
        producto: productoId,
      },
    });

    if (!wishlist) {
      return ctx.notFound('Producto no encontrado en wishlist');
    }

    await strapi.db.query('api::wishlist.wishlist').delete({
      where: { id: wishlist.id },
    });

    return { message: 'Producto removido del wishlist' };
  },
}));