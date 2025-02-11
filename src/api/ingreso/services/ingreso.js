'use strict';

/**
 * ingreso service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::ingreso.ingreso');
