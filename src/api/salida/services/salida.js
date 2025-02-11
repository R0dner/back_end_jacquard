'use strict';

/**
 * salida service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::salida.salida');
