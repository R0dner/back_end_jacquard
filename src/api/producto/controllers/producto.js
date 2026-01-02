'use strict';

/**
 *  producto controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::producto.producto', ({ strapi }) => ({
  // Sobrescribir el método create para manejar errores personalizados
  async create(ctx) {
    try {
      const response = await super.create(ctx);
      return response;
    } catch (error) {
      // Capturar errores de validación y retornar mensaje amigable
      ctx.status = 400;
      return {
        error: {
          status: 400,
          name: 'ValidationError',
          message: error.message,
          details: {}
        }
      };
    }
  },
  
  // Sobrescribir el método update para manejar errores personalizados
  async update(ctx) {
    try {
      const response = await super.update(ctx);
      return response;
    } catch (error) {
      // Capturar errores de validación y retornar mensaje amigable
      ctx.status = 400;
      return {
        error: {
          status: 400,
          name: 'ValidationError',
          message: error.message,
          details: {}
        }
      };
    }
  },
  
  // Método adicional: buscar productos por código
  async findByCodigo(ctx) {
    try {
      const { codigo } = ctx.params;
      
      const productos = await strapi.entityService.findMany('api::producto.producto', {
        filters: { codigo: codigo.toUpperCase() },
        populate: '*'
      });
      
      if (!productos || productos.length === 0) {
        return ctx.notFound('Producto no encontrado');
      }
      
      return productos[0];
    } catch (error) {
      ctx.status = 400;
      return {
        error: {
          status: 400,
          message: error.message
        }
      };
    }
  }
}));