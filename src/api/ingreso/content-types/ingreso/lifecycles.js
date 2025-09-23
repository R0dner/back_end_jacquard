module.exports = {
  // Calcular totales antes de guardar
  async beforeCreate(event) {
    const { data } = event.params;
    await calculateTotals(data);
  },

  async beforeUpdate(event) {
    const { data } = event.params;
    if (data.Productos) {
      await calculateTotals(data);
    }
  },

  async afterCreate(event) {
    const { result } = event;
    
    try {
      console.log('=== INICIO afterCreate ===');
      
      if (result.estado === 'Aprobado') {
        console.log('✅ Estado es Aprobado, procesando ingreso con ID:', result.id);
        await processApprovedIngreso(result.id, 'create');
      } else {
        console.log('❌ Estado no es Aprobado:', result.estado);
      }
    } catch (error) {
      console.error('❌ Error en afterCreate de ingreso:', error);
      throw error;
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    
    try {
      console.log('=== INICIO afterUpdate ===');
      console.log('Estado actual:', result.estado);
      
      if (result.estado === 'Aprobado') {
        // Verificar qué productos son nuevos o tienen cambios de cantidad
        const productAnalysis = await analyzeProductChanges(result.id);
        
        if (productAnalysis.hasNewProducts || productAnalysis.hasQuantityChanges) {
          console.log('✅ Detectados cambios en productos, procesando:', {
            nuevosProductos: productAnalysis.hasNewProducts,
            cambiosCantidad: productAnalysis.hasQuantityChanges,
            productosNuevos: productAnalysis.newProducts.length,
            productosModificados: productAnalysis.modifiedProducts.length
          });
          await processIngresoChanges(result.id, productAnalysis);
        } else {
          console.log('🔄 Sin cambios en productos, solo actualizando precios - ID:', result.id);
          await processApprovedIngreso(result.id, 'update');
        }
      } else {
        console.log('❌ Estado no es Aprobado:', result.estado);
      }
    } catch (error) {
      console.error('❌ Error en afterUpdate de ingreso:', error);
      throw error;
    }
  }
};

// NUEVAS FUNCIONES: Análisis inteligente de cambios en productos
async function analyzeProductChanges(ingresoId) {
  try {
    // Obtener el ingreso con sus productos
    const ingreso = await strapi.entityService.findOne('api::ingreso.ingreso', ingresoId, {
      populate: {
        Productos: {
          populate: {
            producto: true,
            color: true,
            talla: true
          }
        }
      }
    });
    
    if (!ingreso || !ingreso.Productos?.length) {
      return {
        hasNewProducts: false,
        hasQuantityChanges: false,
        newProducts: [],
        modifiedProducts: [],
        existingProducts: []
      };
    }
    
    const newProducts = [];
    const modifiedProducts = [];
    const existingProducts = [];
    
    // Analizar cada producto del ingreso
    for (const item of ingreso.Productos) {
      const whereClause = {
        producto: item.producto.id,
        color: item.color.id
      };
      
      if (item.talla?.id) {
        whereClause.talla = item.talla.id;
      } else {
        whereClause.talla = null;
      }
      
      const existingRecord = await strapi.db.query('api::inventario-color.inventario-color').findOne({
        where: whereClause
      });
      
      if (!existingRecord) {
        // Producto completamente nuevo
        newProducts.push(item);
      } else {
        // Producto existe, verificar si cambió la cantidad o precios
        const currentQuantity = parseInt(item.cantidad) || 0;
        const currentPrice = parseFloat(item.precio_unitario) || 0;
        const existingPrice = parseFloat(existingRecord.precio_unitario) || 0;
        
        if (currentPrice !== existingPrice) {
          // Precio cambió, pero no cantidad
          modifiedProducts.push({
            item,
            existingRecord,
            priceChanged: true,
            quantityChanged: false
          });
        } else {
          // Solo actualización de precios/otros campos
          existingProducts.push({
            item,
            existingRecord
          });
        }
      }
    }
    
    const result = {
      hasNewProducts: newProducts.length > 0,
      hasQuantityChanges: false, // Por ahora no detectamos cambios de cantidad
      newProducts,
      modifiedProducts,
      existingProducts
    };
    
    console.log('📊 Análisis de productos:', {
      total: ingreso.Productos.length,
      nuevos: newProducts.length,
      modificados: modifiedProducts.length,
      existentes: existingProducts.length
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error analizando cambios en productos:', error);
    return {
      hasNewProducts: false,
      hasQuantityChanges: false,
      newProducts: [],
      modifiedProducts: [],
      existingProducts: []
    };
  }
}

async function processIngresoChanges(ingresoId, analysis) {
  try {
    const ingreso = await strapi.entityService.findOne('api::ingreso.ingreso', ingresoId, {
      populate: {
        Productos: {
          populate: {
            producto: true,
            color: true,
            talla: true
          }
        }
      }
    });
    
    if (!ingreso) return;
    
    console.log('🔄 Procesando cambios específicos en ingreso ID:', ingresoId);
    
    // Procesar solo productos nuevos con stock
    if (analysis.hasNewProducts) {
      console.log('➕ Procesando', analysis.newProducts.length, 'productos nuevos con stock');
      for (const item of analysis.newProducts) {
        await processProductItemWithStock(item, ingreso.fecha_ingreso);
      }
      
      // Actualizar inventario general solo para productos nuevos
      await updateGeneralInventoryForNewProducts(analysis.newProducts, ingreso.fecha_ingreso);
    }
    
    // Actualizar precios de productos modificados y existentes
    const productsToUpdatePrices = [...analysis.modifiedProducts.map(p => p.item), ...analysis.existingProducts.map(p => p.item)];
    if (productsToUpdatePrices.length > 0) {
      console.log('💰 Actualizando precios de', productsToUpdatePrices.length, 'productos');
      for (const item of productsToUpdatePrices) {
        await updateProductPricesOnly(item);
      }
    }
    
    console.log('✅ Cambios procesados exitosamente');
    
  } catch (error) {
    console.error('❌ Error procesando cambios del ingreso:', error);
    throw error;
  }
}

async function updateGeneralInventoryForNewProducts(newProducts, fechaIngreso) {
  try {
    if (!newProducts.length) return;
    
    console.log('🏪 Actualizando inventario general para productos nuevos...');
    
    // Agrupar productos nuevos por ID
    const productosAgrupados = {};
    
    for (const item of newProducts) {
      const productoId = item.producto.id;
      const cantidad = parseInt(item.cantidad) || 0;
      
      if (!productosAgrupados[productoId]) {
        productosAgrupados[productoId] = {
          producto: item.producto,
          totalCantidad: 0,
          unidad_de_medida: item.unidad_de_medida || 'unidad'
        };
      }
      
      productosAgrupados[productoId].totalCantidad += cantidad;
    }
    
    // Actualizar cada producto en el inventario general
    for (const [productoId, datos] of Object.entries(productosAgrupados)) {
      await updateGeneralInventoryRecord(productoId, datos, fechaIngreso);
    }
    
    console.log('✅ Inventario general actualizado para productos nuevos');
    
  } catch (error) {
    console.error('❌ Error actualizando inventario general para productos nuevos:', error);
    throw error;
  }
}

// FUNCIONES ANTERIORES (mantenidas para compatibilidad)
async function checkIfIngresoWasProcessed(ingresoId) {
  try {
    // Obtener el ingreso con sus productos
    const ingreso = await strapi.entityService.findOne('api::ingreso.ingreso', ingresoId, {
      populate: {
        Productos: {
          populate: {
            producto: true,
            color: true,
            talla: true
          }
        }
      }
    });
    
    if (!ingreso || !ingreso.Productos?.length) return false;
    
    // Verificar si al menos un producto del ingreso ya existe en inventario-color
    for (const item of ingreso.Productos) {
      const whereClause = {
        producto: item.producto.id,
        color: item.color.id
      };
      
      if (item.talla?.id) {
        whereClause.talla = item.talla.id;
      } else {
        whereClause.talla = null;
      }
      
      const existingRecord = await strapi.db.query('api::inventario-color.inventario-color').findOne({
        where: whereClause
      });
      
      // Si existe al menos un registro, consideramos que ya fue procesado
      if (existingRecord && existingRecord.stock_actual > 0) {
        console.log('📋 Ingreso ya fue procesado anteriormente - encontrado registro existente');
        return true;
      }
    }
    
    return false; // No se encontraron registros, es la primera vez
  } catch (error) {
    console.error('❌ Error verificando si ingreso fue procesado:', error);
    return false;
  }
}

async function markIngresoAsProcessed(ingresoId) {
  // Esta función ya no es necesaria con el nuevo enfoque
  // pero la mantenemos para no romper el código
  console.log('📝 Ingreso procesado exitosamente:', ingresoId);
}

// Función para calcular totales automáticamente
async function calculateTotals(data) {
  if (!data.Productos || !data.Productos.length) {
    data.total_costo = 0;
    data.total_items = 0;
    return;
  }

  let totalCosto = 0;
  let totalItems = 0;

  for (const item of data.Productos) {
    const cantidad = parseInt(item.cantidad) || 0;
    const precio = parseFloat(item.precio_unitario) || 0;
    
    totalCosto += cantidad * precio;
    totalItems += cantidad;

    // Calcular precio_venta_sugerido si no está definido
    if (!item.precio_venta_sugerido && item.margen_ganancia) {
      item.precio_venta_sugerido = precio * (1 + item.margen_ganancia / 100);
    }
  }

  data.total_costo = totalCosto;
  data.total_items = totalItems;
}

async function processApprovedIngreso(ingresoId, actionType) {
  try {
    // Populate con todos los campos nuevos
    const populatedIngreso = await strapi.entityService.findOne(
      'api::ingreso.ingreso',
      ingresoId,
      {
        populate: {
          Productos: {
            populate: {
              producto: true,
              color: true,
              talla: true
            }
          }
        }
      }
    );
    
    if (!populatedIngreso) {
      console.error('❌ No se pudo encontrar el ingreso con ID:', ingresoId);
      return;
    }
    
    console.log('📦 Ingreso encontrado:', {
      id: populatedIngreso.id,
      productos: populatedIngreso.Productos?.length || 0,
      total_costo: populatedIngreso.total_costo,
      total_items: populatedIngreso.total_items,
      accion: actionType
    });
    
    if (actionType === 'create') {
      await updateInventoryFromIngreso(populatedIngreso, true);
    } else {
      await updateInventoryFromIngreso(populatedIngreso, false);
    }
  } catch (error) {
    console.error('❌ Error en processApprovedIngreso:', error);
    throw error;
  }
}

async function updatePricesOnly(ingresoId) {
  try {
    const populatedIngreso = await strapi.entityService.findOne(
      'api::ingreso.ingreso',
      ingresoId,
      {
        populate: {
          Productos: {
            populate: {
              producto: true,
              color: true,
              talla: true
            }
          }
        }
      }
    );
    
    if (!populatedIngreso) {
      console.error('❌ No se pudo encontrar el ingreso con ID:', ingresoId);
      return;
    }
    
    console.log('💰 Actualizando solo precios para ingreso ID:', ingresoId);
    
    // Procesar cada item del ingreso para actualizar solo precios
    for (const item of populatedIngreso.Productos) {
      await updateProductPricesOnly(item);
    }
    
    console.log('✅ Precios actualizados exitosamente');
    
  } catch (error) {
    console.error('❌ Error en updatePricesOnly:', error);
    throw error;
  }
}

async function updateProductPricesOnly(item) {
  try {
    const {
      producto,
      color,
      talla,
      precio_unitario,
      margen_ganancia,
      precio_venta_sugerido,
      aplicar_oferta,
      precio_oferta
    } = item;

    const precioNumerico = parseFloat(precio_unitario) || 0;
    const margenNumerico = parseFloat(margen_ganancia) || 50;
    
    // Construir filtro de búsqueda
    const whereClause = {
      producto: producto.id,
      color: color.id
    };
    
    if (talla?.id) {
      whereClause.talla = talla.id;
    } else {
      whereClause.talla = null;
    }
    
    // Buscar registro existente en inventario por color
    let inventarioRecord = await strapi.db.query('api::inventario-color.inventario-color').findOne({
      where: whereClause
    });
    
    if (inventarioRecord) {
      // Determinar precio de venta sugerido
      const precioVentaCalculado = precio_venta_sugerido || (precioNumerico * (1 + margenNumerico / 100));
      
      // Actualizar solo los precios, NO el stock
      await strapi.db.query('api::inventario-color.inventario-color').update({
        where: { id: inventarioRecord.id },
        data: {
          precio_unitario: precioNumerico,
          precio_venta_sugerido: precioVentaCalculado,
          margen_ganancia: margenNumerico,
          en_oferta: aplicar_oferta || false,
          precio_oferta: aplicar_oferta ? (precio_oferta || 0) : null,
          fecha_ultimo_cambio_precio: new Date()
        }
      });
      
      const descripcion = talla ? 
        `${producto.nombre} - ${color.nombre} - ${talla.sigla}` : 
        `${producto.nombre} - ${color.nombre}`;
      
      console.log(`💰 Precios actualizados: ${descripcion}`);
      console.log(`   Precio unitario: $${precioNumerico.toFixed(2)}`);
      console.log(`   Precio venta sugerido: $${precioVentaCalculado.toFixed(2)} (Margen: ${margenNumerico}%)`);
    }
    
  } catch (error) {
    console.error('❌ Error en updateProductPricesOnly:', error);
    throw error;
  }
}

async function updateInventoryFromIngreso(ingreso, addStock) {
  try {
    if (!ingreso?.Productos?.length) {
      console.error('❌ No se encontraron productos en el ingreso');
      return;
    }
    
    console.log('📦 Procesando', ingreso.Productos.length, 'productos del ingreso');
    console.log('➕ Add Stock:', addStock);
    
    // Procesar cada item del ingreso
    for (const item of ingreso.Productos) {
      if (addStock) {
        await processProductItemWithStock(item, ingreso.fecha_ingreso);
      } else {
        await updateProductPricesOnly(item);
      }
    }
    
    // NUEVA FUNCIONALIDAD: Actualizar inventario general
    if (addStock) {
      await updateGeneralInventoryFromIngreso(ingreso);
    }
    
    console.log('✅ Inventario actualizado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en updateInventoryFromIngreso:', error);
    throw error;
  }
}

// NUEVA FUNCIÓN: Actualizar inventario general
async function updateGeneralInventoryFromIngreso(ingreso) {
  try {
    console.log('🏪 Actualizando inventario general...');
    
    // Agrupar productos por ID para sumar todas sus cantidades
    const productosAgrupados = {};
    
    for (const item of ingreso.Productos) {
      const productoId = item.producto.id;
      const cantidad = parseInt(item.cantidad) || 0;
      
      if (!productosAgrupados[productoId]) {
        productosAgrupados[productoId] = {
          producto: item.producto,
          totalCantidad: 0,
          unidad_de_medida: item.unidad_de_medida || 'unidad'
        };
      }
      
      productosAgrupados[productoId].totalCantidad += cantidad;
    }
    
    // Actualizar cada producto en el inventario general
    for (const [productoId, datos] of Object.entries(productosAgrupados)) {
      await updateGeneralInventoryRecord(productoId, datos, ingreso.fecha_ingreso);
    }
    
    console.log('✅ Inventario general actualizado');
    
  } catch (error) {
    console.error('❌ Error en updateGeneralInventoryFromIngreso:', error);
    throw error;
  }
}

// NUEVA FUNCIÓN: Actualizar registro del inventario general
async function updateGeneralInventoryRecord(productoId, datos, fechaIngreso) {
  try {
    const { producto, totalCantidad, unidad_de_medida } = datos;
    
    // Buscar registro existente en inventario general
    let inventarioGeneral = await strapi.db.query('api::inventario.inventario').findOne({
      where: { producto: productoId },
      populate: ['producto']
    });
    
    if (inventarioGeneral) {
      // Actualizar registro existente - SUMAR stock
      const stockAnterior = inventarioGeneral.stock_total || 0;
      const nuevoStock = stockAnterior + totalCantidad;
      
      await strapi.db.query('api::inventario.inventario').update({
        where: { id: inventarioGeneral.id },
        data: {
          stock_total: nuevoStock,
          ultimo_ingreso: fechaIngreso || new Date(),
          unidad_de_medida: unidad_de_medida || inventarioGeneral.unidad_de_medida
        }
      });
      
      console.log(`✅ Inventario general actualizado: ${producto.nombre}`);
      console.log(`   Stock: ${stockAnterior} + ${totalCantidad} = ${nuevoStock}`);
      
    } else {
      // Crear nuevo registro en inventario general
      const codigo = `INV-${producto.codigo || producto.id}`;
      
      await strapi.db.query('api::inventario.inventario').create({
        data: {
          producto: productoId,
          stock_total: totalCantidad,
          ultimo_ingreso: fechaIngreso || new Date(),
          codigo: codigo,
          unidad_de_medida: unidad_de_medida || 'unidad'
        }
      });
      
      console.log(`✅ Inventario general creado: ${producto.nombre}`);
      console.log(`   Stock inicial: ${totalCantidad}`);
      console.log(`   Código: ${codigo}`);
    }
    
  } catch (error) {
    console.error('❌ Error en updateGeneralInventoryRecord:', error);
    throw error;
  }
}

async function processProductItemWithStock(item, fechaIngreso) {
  try {
    const { 
      producto, 
      color, 
      talla, 
      cantidad, 
      precio_unitario,
      margen_ganancia,
      precio_venta_sugerido,
      stock_minimo,
      unidad_de_medida,
      aplicar_oferta,
      precio_oferta,
      observaciones
    } = item;
    
    // Validaciones
    if (!producto?.id) {
      console.error('❌ Producto no válido en item:', item);
      return;
    }
    
    if (!color?.id) {
      console.error('❌ Color no válido en item:', item);
      return;
    }
    
    if (!cantidad || cantidad <= 0) {
      console.error('❌ Cantidad no válida en item:', item);
      return;
    }
    
    console.log(`📦 Procesando: ${producto.nombre} - ${color.nombre}${talla ? ` - ${talla.sigla}` : ''}`);
    console.log(`   Cantidad: ${cantidad}, Precio: ${precio_unitario}, Margen: ${margen_ganancia}%`);
    
    // Actualizar inventario por color/talla con stock y precios
    await updateInventoryRecordWithStock(item, fechaIngreso);
    
  } catch (error) {
    console.error('❌ Error en processProductItemWithStock:', error);
    throw error;
  }
}

async function updateInventoryRecordWithStock(item, fechaIngreso) {
  try {
    const {
      producto,
      color,
      talla,
      cantidad,
      precio_unitario,
      margen_ganancia,
      precio_venta_sugerido,
      stock_minimo,
      unidad_de_medida,
      aplicar_oferta,
      precio_oferta,
      observaciones
    } = item;

    const cantidadNumerica = parseInt(cantidad) || 0;
    const precioNumerico = parseFloat(precio_unitario) || 0;
    const margenNumerico = parseFloat(margen_ganancia) || 50;
    const stockMinimoNumerico = parseInt(stock_minimo) || 5;
    
    // Construir filtro de búsqueda
    const whereClause = {
      producto: producto.id,
      color: color.id
    };
    
    if (talla?.id) {
      whereClause.talla = talla.id;
    } else {
      whereClause.talla = null;
    }
    
    // Buscar registro existente
    let inventarioRecord = await strapi.db.query('api::inventario-color.inventario-color').findOne({
      where: whereClause,
      populate: ['producto', 'color', 'talla']
    });
    
    const descripcion = talla ? 
      `${producto.nombre} - ${color.nombre} - ${talla.sigla}` : 
      `${producto.nombre} - ${color.nombre}`;
    
    // Determinar precio de venta sugerido
    const precioVentaCalculado = precio_venta_sugerido || (precioNumerico * (1 + margenNumerico / 100));
    
    if (inventarioRecord) {
      // Actualizar registro existente - SUMAR stock
      const stockAnterior = inventarioRecord.stock_actual || 0;
      const nuevoStock = stockAnterior + cantidadNumerica;
      
      await strapi.db.query('api::inventario-color.inventario-color').update({
        where: { id: inventarioRecord.id },
        data: {
          stock_actual: nuevoStock,
          stock_minimo: stock_minimo !== undefined ? stockMinimoNumerico : inventarioRecord.stock_minimo,
          ultimo_ingreso: fechaIngreso || new Date(),
          unidad_de_medida: unidad_de_medida || inventarioRecord.unidad_de_medida,
          precio_unitario: precioNumerico,
          precio_venta_sugerido: precioVentaCalculado,
          margen_ganancia: margenNumerico,
          en_oferta: aplicar_oferta || false,
          precio_oferta: aplicar_oferta ? (precio_oferta || 0) : null,
          fecha_ultimo_cambio_precio: new Date(),
          estado_producto: 'Activo',
          observaciones: observaciones || inventarioRecord.observaciones
        }
      });
      
      console.log(`✅ Actualizado con stock: ${descripcion}`);
      console.log(`   Stock: ${stockAnterior} + ${cantidadNumerica} = ${nuevoStock}`);
      console.log(`   Precio unitario: $${precioNumerico.toFixed(2)}`);
      console.log(`   Precio venta sugerido: $${precioVentaCalculado.toFixed(2)} (Margen: ${margenNumerico}%)`);
      
    } else {
      // Crear nuevo registro
      const codigoSufijo = talla ? `-${talla.sigla || talla.id}` : '';
      const codigoColor = color.codigo || color.nombre || color.id;
      const codigo = `${producto.codigo || 'PROD'}-${codigoColor}${codigoSufijo}`;
      
      await strapi.db.query('api::inventario-color.inventario-color').create({
        data: {
          producto: producto.id,
          color: color.id,
          talla: talla?.id || null,
          stock_actual: cantidadNumerica,
          stock_minimo: stockMinimoNumerico,
          ultimo_ingreso: fechaIngreso || new Date(),
          codigo: codigo,
          unidad_de_medida: unidad_de_medida || 'unidad',
          precio_unitario: precioNumerico,
          precio_venta_sugerido: precioVentaCalculado,
          margen_ganancia: margenNumerico,
          en_oferta: aplicar_oferta || false,
          precio_oferta: aplicar_oferta ? (precio_oferta || 0) : null,
          fecha_ultimo_cambio_precio: new Date(),
          estado_producto: 'Activo',
          observaciones: observaciones || ''
        }
      });
      
      console.log(`✅ Creado: ${descripcion}`);
      console.log(`   Stock inicial: ${cantidadNumerica} (Mínimo: ${stockMinimoNumerico})`);
      console.log(`   Precio unitario: $${precioNumerico.toFixed(2)}`);
      console.log(`   Precio venta: $${precioVentaCalculado.toFixed(2)} (Margen: ${margenNumerico}%)`);
      console.log(`   Código: ${codigo}`);
      if (aplicar_oferta) {
        console.log(`   En oferta: $${precio_oferta || 0}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en updateInventoryRecordWithStock:', error);
    console.error('Item con error:', item);
    throw error;
  }
}