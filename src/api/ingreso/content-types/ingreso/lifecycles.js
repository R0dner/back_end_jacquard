module.exports = {
  async afterCreate(event) {
    const { result } = event;
    
    try {
      console.log('=== INICIO afterCreate ===');
      
      if (result.estado === 'Aprobado') {
        console.log('✅ Estado es Aprobado, procesando ingreso con ID:', result.id);
        await processApprovedIngreso(result.id);
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
      
      if (result.estado === 'Aprobado') {
        console.log('✅ Estado cambió a Aprobado, procesando ingreso con ID:', result.id);
        await processApprovedIngreso(result.id);
      }
    } catch (error) {
      console.error('❌ Error en afterUpdate de ingreso:', error);
      throw error;
    }
  }
};

async function processApprovedIngreso(ingresoId) {
  try {
    const populatedIngreso = await strapi.entityService.findOne(
      'api::ingreso.ingreso',
      ingresoId,
      {
        populate: {
          Productos: {
            populate: {
              producto: true,
              stock_por_colores: {
                populate: {
                  color: true,
                  stock_por_tallas: {
                    populate: {
                      talla: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    );
    
    if (!populatedIngreso) {
      console.error('❌ No se pudo encontrar el ingreso con ID:', ingresoId);
      return;
    }
    
    await updateInventoryFromIngreso(populatedIngreso);
  } catch (error) {
    console.error('❌ Error en processApprovedIngreso:', error);
    throw error;
  }
}

async function updateInventoryFromIngreso(ingreso) {
  try {
    if (!ingreso?.Productos?.length) {
      console.error('❌ No se encontraron productos en el ingreso');
      return;
    }
    
    console.log('📦 Procesando', ingreso.Productos.length, 'productos');
    
    for (const item of ingreso.Productos) {
      await processProductItem(item);
    }
    
    // Actualizar inventario general después de procesar todos los productos
    for (const item of ingreso.Productos) {
      await updateGeneralInventory(item.producto.id);
    }
    
    console.log('✅ Inventario actualizado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en updateInventoryFromIngreso:', error);
    throw error;
  }
}

async function processProductItem(item) {
  try {
    const { producto, stock_por_colores } = item;
    
    if (!producto?.id || !stock_por_colores?.length) {
      console.error('❌ Producto o colores no válidos');
      return;
    }
    
    console.log('📦 Procesando producto:', producto.nombre);
    
    for (const stockColor of stock_por_colores) {
      await processColorStock(producto, stockColor);
    }
    
  } catch (error) {
    console.error('❌ Error en processProductItem:', error);
    throw error;
  }
}

async function processColorStock(producto, stockColor) {
  try {
    const { color, cantidad, stock_por_tallas } = stockColor;
    
    if (!color?.id) {
      console.error('❌ Color no válido');
      return;
    }
    
    console.log('🎨 Procesando color:', color.nombre);
    
    // CASO 1: Con detalle de tallas
    if (stock_por_tallas?.length > 0) {
      console.log('👕 Procesando con tallas detalladas');
      
      for (const stockTalla of stock_por_tallas) {
        await updateInventoryRecord(producto, color, stockTalla.talla, stockTalla.cantidad);
      }
      
      // Actualizar registro consolidado por color (sin talla)
      await updateColorSummary(producto, color);
    }
    // CASO 2: Solo por color (sin tallas)
    else if (cantidad > 0) {
      console.log('🎨 Procesando solo por color (sin tallas)');
      
      await updateInventoryRecord(producto, color, null, cantidad);
    }
    
  } catch (error) {
    console.error('❌ Error en processColorStock:', error);
    throw error;
  }
}

async function updateInventoryRecord(producto, color, talla, cantidad) {
  try {
    const cantidadNumerica = parseInt(cantidad) || 0;
    
    // Buscar registro existente
    const whereClause = {
      producto: producto.id,
      color: color.id
    };
    
    // Agregar talla al filtro si existe
    if (talla) {
      whereClause.talla = talla.id;
    } else {
      whereClause.talla = null;
    }
    
    let inventarioRecord = await strapi.db.query('api::inventario-color.inventario-color').findOne({
      where: whereClause
    });
    
    const descripcion = talla ? 
      `${producto.nombre} - ${color.nombre} - ${talla.sigla}` : 
      `${producto.nombre} - ${color.nombre}`;
    
    if (inventarioRecord) {
      // Actualizar existente
      const nuevoStock = inventarioRecord.stock_actual + cantidadNumerica;
      
      await strapi.db.query('api::inventario-color.inventario-color').update({
        where: { id: inventarioRecord.id },
        data: {
          stock_actual: nuevoStock,
          ultimo_ingreso: new Date()
        }
      });
      
      console.log(`✅ Actualizado: ${descripcion}: ${inventarioRecord.stock_actual} + ${cantidadNumerica} = ${nuevoStock}`);
    } else {
      // Crear nuevo
      const codigoSufijo = talla ? `-${talla.sigla}` : '';
      
      await strapi.db.query('api::inventario-color.inventario-color').create({
        data: {
          producto: producto.id,
          color: color.id,
          talla: talla?.id || null,
          stock_actual: cantidadNumerica,
          ultimo_ingreso: new Date(),
          codigo: `${producto.codigo || 'PROD'}-${color.nombre}${codigoSufijo}`,
          unidad_de_medida: 'unidad'
        }
      });
      
      console.log(`✅ Creado: ${descripcion}: ${cantidadNumerica}`);
    }
    
  } catch (error) {
    console.error('❌ Error en updateInventoryRecord:', error);
    throw error;
  }
}

async function updateColorSummary(producto, color) {
  try {
    // Sumar todas las tallas de este color
    const tallasStock = await strapi.db.query('api::inventario-color.inventario-color').findMany({
      where: {
        producto: producto.id,
        color: color.id,
        talla: { $notNull: true } // Solo registros con talla
      }
    });
    
    const totalStock = tallasStock.reduce((sum, record) => sum + record.stock_actual, 0);
    
    // Buscar o crear registro consolidado (sin talla)
    let consolidatedRecord = await strapi.db.query('api::inventario-color.inventario-color').findOne({
      where: {
        producto: producto.id,
        color: color.id,
        talla: null // Registro consolidado sin talla específica
      }
    });
    
    if (consolidatedRecord) {
      await strapi.db.query('api::inventario-color.inventario-color').update({
        where: { id: consolidatedRecord.id },
        data: {
          stock_actual: totalStock,
          ultimo_ingreso: new Date()
        }
      });
    } else {
      await strapi.db.query('api::inventario-color.inventario-color').create({
        data: {
          producto: producto.id,
          color: color.id,
          talla: null,
          stock_actual: totalStock,
          ultimo_ingreso: new Date(),
          codigo: `${producto.codigo || 'PROD'}-${color.nombre}-TOTAL`,
          unidad_de_medida: 'unidad'
        }
      });
    }
    
    console.log(`📊 Consolidado actualizado: ${producto.nombre} - ${color.nombre} TOTAL: ${totalStock}`);
    
  } catch (error) {
    console.error('❌ Error en updateColorSummary:', error);
    throw error;
  }
}

async function updateGeneralInventory(productoId) {
  try {
    // Calcular desde registros consolidados (sin talla específica)
    const inventarioColores = await strapi.db.query('api::inventario-color.inventario-color').findMany({
      where: { 
        producto: productoId,
        talla: null // Solo registros consolidados
      }
    });
    
    const stockTotal = inventarioColores.reduce((total, item) => {
      return total + (parseInt(item.stock_actual) || 0);
    }, 0);
    
    console.log(`📊 Stock total calculado para producto ${productoId}: ${stockTotal}`);
    
    let inventarioGeneral = await strapi.db.query('api::inventario.inventario').findOne({
      where: { producto: productoId }
    });
    
    if (inventarioGeneral) {
      await strapi.db.query('api::inventario.inventario').update({
        where: { id: inventarioGeneral.id },
        data: {
          stock_total: stockTotal,
          ultimo_ingreso: new Date()
        }
      });
    } else {
      await strapi.db.query('api::inventario.inventario').create({
        data: {
          producto: productoId,
          stock_total: stockTotal,
          ultimo_ingreso: new Date(),
          unidad_de_medida: 'unidad'
        }
      });
    }
    
    console.log(`✅ Inventario general actualizado: ${stockTotal}`);
    
  } catch (error) {
    console.error('❌ Error en updateGeneralInventory:', error);
    throw error;
  }
}