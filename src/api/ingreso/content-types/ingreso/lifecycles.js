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
    const { result } = event;
    
    try {
      console.log('=== INICIO afterUpdate ===');
      
      // Verificar si el estado cambió a Aprobado
      const previousState = event.params.where?.estado || 'Borrador';
      if (result.estado === 'Aprobado' && previousState !== 'Aprobado') {
        console.log('✅ Estado cambió a Aprobado, procesando ingreso con ID:', result.id);
        await processApprovedIngreso(result.id, 'update');
      } else if (result.estado === 'Aprobado') {
        console.log('🔄 Ingreso ya estaba aprobado, actualizando solo precios con ID:', result.id);
        await updatePricesOnly(result.id);
      }
    } catch (error) {
      console.error('❌ Error en afterUpdate de ingreso:', error);
      throw error;
    }
  }
};

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
    
    // Buscar registro existente
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
    
    console.log('✅ Inventario actualizado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en updateInventoryFromIngreso:', error);
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
    
    // Actualizar inventario con stock y precios
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