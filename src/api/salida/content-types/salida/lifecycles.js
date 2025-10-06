module.exports = {
  // Calcular totales y validar stock antes de crear
  async beforeCreate(event) {
    const { data } = event.params;
    
    try {
      console.log('=== INICIO beforeCreate SALIDA ===');
      
      // Calcular totales automáticamente
      await calculateTotals(data);
      
      // Validar disponibilidad de stock
      if (data.estado === 'Aprobada' || data.estado === 'Completada') {
        await validateStockAvailability(data);
      }
      
    } catch (error) {
      console.error('❌ Error en beforeCreate de salida:', error);
      throw error;
    }
  },

  async beforeUpdate(event) {
    const { data } = event.params;
    
    try {
      console.log('=== INICIO beforeUpdate SALIDA ===');
      
      // Recalcular totales si hay cambios en productos
      if (data.Productos) {
        await calculateTotals(data);
      }
      
      // Validar stock si se está aprobando
      if (data.estado === 'Aprobada' || data.estado === 'Completada') {
        await validateStockAvailability(data);
      }
      
    } catch (error) {
      console.error('❌ Error en beforeUpdate de salida:', error);
      throw error;
    }
  },

  async afterCreate(event) {
    const { result } = event;
    
    try {
      console.log('=== INICIO afterCreate SALIDA ===');
      
      if (!result || !result.id) {
        console.error('❌ Resultado del evento no válido:', result);
        return;
      }
      
      console.log('📤 Procesando salida con ID:', result.id);
      
      // Solo procesar si está aprobada o completada
      if (result.estado === 'Aprobada' || result.estado === 'Completada') {
        const populatedSalida = await strapi.entityService.findOne(
          'api::salida.salida',
          result.id,
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
        
        if (!populatedSalida) {
          console.error('❌ No se pudo encontrar la salida con ID:', result.id);
          return;
        }
        
        await processApprovedSalida(populatedSalida);
      } else {
        console.log('ℹ️ Salida en estado:', result.estado, '- No se procesa inventario');
      }
      
    } catch (error) {
      console.error('❌ Error en afterCreate de salida:', error);
      throw error;
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    
    try {
      console.log('=== INICIO afterUpdate SALIDA ===');
      console.log('Estado actual:', result.estado);
      
      // Detectar cambio de estado a Aprobada/Completada
      const wasApproved = result.estado === 'Aprobada' || result.estado === 'Completada';
      
      if (wasApproved) {
        const populatedSalida = await strapi.entityService.findOne(
          'api::salida.salida',
          result.id,
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
        
        if (!populatedSalida) {
          console.error('❌ No se pudo encontrar la salida con ID:', result.id);
          return;
        }
        
        // Verificar si ya fue procesada anteriormente
        const alreadyProcessed = await checkIfSalidaWasProcessed(result.id);
        
        if (alreadyProcessed) {
          console.log('⚠️ Salida ya fue procesada anteriormente - ID:', result.id);
          return;
        }
        
        await processApprovedSalida(populatedSalida);
      } else {
        console.log('ℹ️ Estado no requiere procesamiento:', result.estado);
      }
      
    } catch (error) {
      console.error('❌ Error en afterUpdate de salida:', error);
      throw error;
    }
  }
};

// FUNCIONES AUXILIARES

async function calculateTotals(data) {
  if (!data.Productos || !data.Productos.length) {
    data.total_monto = 0;
    data.total_items = 0;
    return;
  }

  let totalMonto = 0;
  let totalItems = 0;

  for (const item of data.Productos) {
    const cantidad = parseInt(item.cantidad) || 0;
    const precioVenta = parseFloat(item.precio_venta) || 0;
    
    // Calcular subtotal para el item
    item.subtotal = cantidad * precioVenta;
    
    totalMonto += item.subtotal;
    totalItems += cantidad;
  }

  data.total_monto = totalMonto;
  data.total_items = totalItems;
  
  console.log('💰 Totales calculados:', {
    items: totalItems,
    monto: totalMonto
  });
}

async function validateStockAvailability(data) {
  if (!data.Productos || !data.Productos.length) {
    throw new Error('No hay productos en la salida');
  }

  console.log('🔍 Validando disponibilidad de stock...');
  
  for (const item of data.Productos) {
    const { producto, color, talla, cantidad } = item;
    
    if (!producto || !color || !cantidad) {
      throw new Error('Datos incompletos en item de salida');
    }
    
    const whereClause = {
      producto: producto.id || producto,
      color: color.id || color
    };
    
    if (talla) {
      whereClause.talla = talla.id || talla;
    } else {
      whereClause.talla = null;
    }
    
    const inventarioRecord = await strapi.db.query('api::inventario-color.inventario-color').findOne({
      where: whereClause,
      populate: ['producto', 'color', 'talla']
    });
    
    if (!inventarioRecord) {
      const productoNombre = producto.nombre || 'Producto';
      const colorNombre = color.nombre || 'Color';
      const tallaNombre = talla?.sigla || '';
      
      throw new Error(
        `No existe registro de inventario para ${productoNombre} - ${colorNombre}${tallaNombre ? ' - ' + tallaNombre : ''}`
      );
    }
    
    const stockDisponible = inventarioRecord.stock_actual || 0;
    
    if (stockDisponible < cantidad) {
      const descripcion = inventarioRecord.talla 
        ? `${inventarioRecord.producto.nombre} - ${inventarioRecord.color.nombre} - ${inventarioRecord.talla.sigla}`
        : `${inventarioRecord.producto.nombre} - ${inventarioRecord.color.nombre}`;
      
      throw new Error(
        `Stock insuficiente para ${descripcion}. Disponible: ${stockDisponible}, Solicitado: ${cantidad}`
      );
    }
    
    console.log(`✅ Stock validado: ${inventarioRecord.producto.nombre} - Stock: ${stockDisponible} >= ${cantidad}`);
  }
  
  console.log('✅ Validación de stock completada');
}

async function checkIfSalidaWasProcessed(salidaId) {
  // Verificar si esta salida ya redujo el inventario
  // Puedes usar un flag adicional o verificar por fecha de última salida
  // Por ahora, asumimos que no fue procesada si llegó hasta aquí
  return false;
}

async function processApprovedSalida(salida) {
  try {
    console.log('🔄 Procesando salida aprobada ID:', salida.id);
    
    if (!salida?.Productos?.length) {
      console.error('❌ No hay productos para procesar');
      return;
    }
    
    console.log('📦 Procesando', salida.Productos.length, 'productos');
    
    // Set para actualización de inventario general
    const productosActualizados = new Set();
    
    for (const item of salida.Productos) {
      const { producto, color, talla, cantidad } = item;
      
      // Validaciones
      if (!producto?.id || !color?.id || !cantidad) {
        console.error('❌ Item con datos incompletos:', item);
        continue;
      }
      
      // Construir whereClause
      const whereClause = {
        producto: producto.id,
        color: color.id
      };
      
      if (talla?.id) {
        whereClause.talla = talla.id;
      } else {
        whereClause.talla = null;
      }
      
      // Buscar registro de inventario
      const inventarioRecord = await strapi.db.query('api::inventario-color.inventario-color').findOne({
        where: whereClause,
        populate: ['producto', 'color', 'talla']
      });
      
      if (!inventarioRecord) {
        console.error('❌ No se encontró inventario para:', whereClause);
        continue;
      }
      
      // Reducir stock
      const stockAnterior = inventarioRecord.stock_actual || 0;
      const nuevoStock = stockAnterior - cantidad;
      
      if (nuevoStock < 0) {
        throw new Error(
          `Stock resultante negativo para ${inventarioRecord.producto.nombre}. ` +
          `Stock: ${stockAnterior}, Salida: ${cantidad}`
        );
      }
      
      await strapi.db.query('api::inventario-color.inventario-color').update({
        where: { id: inventarioRecord.id },
        data: {
          stock_actual: nuevoStock,
          ultima_salida: salida.fecha_salida || new Date()
        }
      });
      
      const descripcion = inventarioRecord.talla 
        ? `${inventarioRecord.producto.nombre} - ${inventarioRecord.color.nombre} - ${inventarioRecord.talla.sigla}`
        : `${inventarioRecord.producto.nombre} - ${inventarioRecord.color.nombre}`;
      
      console.log(`✅ Stock reducido: ${descripcion}`);
      console.log(`   ${stockAnterior} - ${cantidad} = ${nuevoStock}`);
      
      // Agregar al set para actualizar inventario general
      productosActualizados.add(producto.id);
    }
    
    // Actualizar inventario general
    console.log('🏪 Actualizando inventario general para', productosActualizados.size, 'productos');
    for (const productoId of productosActualizados) {
      await updateGeneralInventory(productoId, salida.fecha_salida);
    }
    
    console.log('✅ Salida procesada exitosamente');
    
  } catch (error) {
    console.error('❌ Error procesando salida:', error);
    throw error;
  }
}

async function updateGeneralInventory(productoId, fechaSalida) {
  try {
    console.log('📊 Actualizando inventario general para producto:', productoId);
    
    if (!productoId) {
      console.error('❌ ID de producto no válido');
      return;
    }
    
    // Calcular stock total desde inventario por colores/tallas
    const inventarioColores = await strapi.db.query('api::inventario-color.inventario-color').findMany({
      where: { producto: productoId }
    });
    
    const stockTotal = inventarioColores.reduce((total, item) => {
      return total + (parseInt(item.stock_actual) || 0);
    }, 0);
    
    console.log(`📊 Stock total calculado: ${stockTotal} (desde ${inventarioColores.length} registros)`);
    
    // Buscar o crear inventario general
    let inventarioGeneral = await strapi.db.query('api::inventario.inventario').findOne({
      where: { producto: productoId },
      populate: ['producto']
    });
    
    if (inventarioGeneral) {
      const stockAnterior = inventarioGeneral.stock_total;
      
      await strapi.db.query('api::inventario.inventario').update({
        where: { id: inventarioGeneral.id },
        data: {
          stock_total: stockTotal,
          ultima_salida: fechaSalida || new Date()
        }
      });
      
      console.log(`✅ Inventario general actualizado: ${stockAnterior} → ${stockTotal}`);
    } else {
      // Crear si no existe (raro en salidas, pero por seguridad)
      const producto = await strapi.db.query('api::producto.producto').findOne({
        where: { id: productoId }
      });
      
      const codigo = `INV-${producto?.codigo || productoId}`;
      
      await strapi.db.query('api::inventario.inventario').create({
        data: {
          producto: productoId,
          stock_total: stockTotal,
          ultima_salida: fechaSalida || new Date(),
          codigo: codigo,
          unidad_de_medida: 'unidad'
        }
      });
      
      console.log(`✅ Inventario general creado con stock: ${stockTotal}`);
    }
    
  } catch (error) {
    console.error('❌ Error en updateGeneralInventory:', error);
    throw error;
  }
}