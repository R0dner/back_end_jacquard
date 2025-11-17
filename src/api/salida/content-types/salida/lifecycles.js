module.exports = {
  // Calcular totales antes de crear
  async beforeCreate(event) {
    const { data } = event.params;
    
    try {
      console.log('=== INICIO beforeCreate SALIDA ===');
      console.log('📦 Data completa recibida:', JSON.stringify(data, null, 2));
      
      // Calcular total de items
      await calculateTotals(data);
      
      // Solo validar stock si está aprobada o completada
      if (data.estado === 'Aprobada' || data.estado === 'Completada') {
        console.log('🔍 Validando stock para estado:', data.estado);
        
        // Verificar que Productos existe y tiene datos
        if (!data.Productos || data.Productos.length === 0) {
          console.log('⚠️ No hay productos para validar en beforeCreate');
          // No lanzar error, dejar que se procese en afterCreate cuando estén poblados
          return;
        }
        
        await validateStockAvailability(data.Productos);
      } else {
        console.log('ℹ️ Estado:', data.estado, '- No se valida stock aún');
      }
      
    } catch (error) {
      console.error('❌ Error en beforeCreate de salida:', error);
      throw error;
    }
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;
    
    try {
      console.log('=== INICIO beforeUpdate SALIDA ===');
      console.log('📦 Data de update:', JSON.stringify(data, null, 2));
      
      // Recalcular totales si hay cambios en productos
      if (data.Productos) {
        await calculateTotals(data);
      }
      
      // NO validar en beforeUpdate porque los datos no están completos
      // La validación se hará en afterUpdate con datos poblados
      if (data.estado === 'Aprobada' || data.estado === 'Completada') {
        console.log('ℹ️ Cambio a estado:', data.estado, '- Validación se hará en afterUpdate');
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
      
      console.log('📤 Salida creada con ID:', result.id, 'Estado:', result.estado);
      
      // Poblar la salida para tener todos los datos
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
      
      console.log('📦 Productos encontrados:', populatedSalida.Productos?.length || 0);
      
      // Validar y procesar si está aprobada o completada
      if (populatedSalida.estado === 'Aprobada' || populatedSalida.estado === 'Completada') {
        // Primero validar stock con los datos poblados
        try {
          await validateStockAvailabilityPopulated(populatedSalida.Productos);
          // Si la validación pasa, procesar
          await processApprovedSalida(populatedSalida);
        } catch (error) {
          // Si falla la validación, eliminar la salida creada
          console.error('❌ Validación de stock falló, eliminando salida:', error.message);
          await strapi.entityService.delete('api::salida.salida', result.id);
          throw error; // Re-lanzar el error
        }
      } else {
        console.log('ℹ️ Salida en estado:', result.estado, '- No se procesa inventario');
      }
      
    } catch (error) {
      console.error('❌ Error en afterCreate de salida:', error);
      throw error;
    }
  },

  async afterUpdate(event) {
    const { result } = event;
    
    try {
      console.log('=== INICIO afterUpdate SALIDA ===');
      console.log('Estado actual:', result.estado);
      
      // Detectar cambio de estado a Aprobada/Completada
      const debeProcesoarse = result.estado === 'Aprobada' || result.estado === 'Completada';
      
      if (debeProcesoarse) {
        // Poblar para tener todos los datos
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
        
        console.log('📦 Productos poblados:', populatedSalida.Productos?.length || 0);
        
        // Verificar si ya fue procesada
        const alreadyProcessed = await checkIfSalidaWasProcessed(result.id);
        
        if (alreadyProcessed) {
          console.log('⚠️ Salida ya fue procesada anteriormente - ID:', result.id);
          return;
        }
        
        // Validar stock con datos completos y procesar
        try {
          await validateStockAvailabilityPopulated(populatedSalida.Productos);
          await processApprovedSalida(populatedSalida);
          await markSalidaAsProcessed(result.id);
        } catch (error) {
          // Si falla, revertir el estado a Borrador
          console.error('❌ Error procesando salida, revirtiendo estado:', error.message);
          await strapi.entityService.update('api::salida.salida', result.id, {
            data: { estado: 'Borrador' }
          });
          throw error;
        }
      } else {
        console.log('ℹ️ Estado no requiere procesamiento:', result.estado);
      }
      
    } catch (error) {
      console.error('❌ Error en afterUpdate de salida:', error);
      throw error;
    }
  }
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function calculateTotals(data) {
  if (!data.Productos || !data.Productos.length) {
    data.total_items = 0;
    return;
  }

  let totalItems = 0;

  for (const item of data.Productos) {
    const cantidad = parseInt(item.cantidad) || 0;
    totalItems += cantidad;
  }

  data.total_items = totalItems;
  
  console.log('📊 Total de items calculado:', totalItems);
}

async function validateStockAvailability(productos) {
  if (!productos || !productos.length) {
    console.log('⚠️ No hay productos para validar');
    return; // No lanzar error, solo retornar
  }

  console.log('🔍 Validando disponibilidad de stock para', productos.length, 'items...');
  console.log('📦 Productos recibidos:', JSON.stringify(productos, null, 2));
  
  for (const item of productos) {
    console.log('🔍 Item completo:', JSON.stringify(item, null, 2));
    
    // En beforeCreate/beforeUpdate, las relaciones vienen como IDs
    const productoId = item.producto?.id || item.producto;
    const colorId = item.color?.id || item.color;
    const tallaId = item.talla?.id || item.talla || null;
    const cantidad = parseInt(item.cantidad) || 0;
    
    console.log('🔍 Validando item parseado:', {
      productoId,
      colorId,
      tallaId,
      cantidad,
      itemOriginal: item
    });
    
    // Si los datos están vacíos, probablemente aún no se han guardado los componentes
    if (!productoId || !colorId) {
      console.log('⚠️ Item sin producto o color, probablemente aún no guardado. Saltando validación.');
      continue; // Continuar con el siguiente en lugar de lanzar error
    }
    
    if (!cantidad || cantidad <= 0) {
      console.error('❌ Cantidad inválida:', cantidad);
      throw new Error('La cantidad debe ser mayor a 0');
    }
    
    // Construir whereClause
    const whereClause = {
      producto: productoId,
      color: colorId
    };
    
    if (tallaId) {
      whereClause.talla = tallaId;
    } else {
      whereClause.talla = null;
    }
    
    // Buscar en inventario
    const inventarioRecord = await strapi.db.query('api::inventario-color.inventario-color').findOne({
      where: whereClause,
      populate: ['producto', 'color', 'talla']
    });
    
    if (!inventarioRecord) {
      // Obtener nombres para mensaje de error más claro
      const producto = await strapi.db.query('api::producto.producto').findOne({
        where: { id: productoId }
      });
      const color = await strapi.db.query('api::color.color').findOne({
        where: { id: colorId }
      });
      
      let talla = null;
      if (tallaId) {
        talla = await strapi.db.query('api::talla.talla').findOne({
          where: { id: tallaId }
        });
      }
      
      const descripcion = talla
        ? `${producto?.nombre || 'Producto'} - ${color?.nombre || 'Color'} - ${talla?.sigla || 'Talla'}`
        : `${producto?.nombre || 'Producto'} - ${color?.nombre || 'Color'}`;
      
      throw new Error(`No existe registro de inventario para: ${descripcion}`);
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
    
    console.log(`✅ Stock validado: ${inventarioRecord.producto.nombre} - Disponible: ${stockDisponible} >= ${cantidad}`);
  }
  
  console.log('✅ Validación de stock completada exitosamente');
}

async function validateStockAvailabilityPopulated(productos) {
  if (!productos || !productos.length) {
    throw new Error('No hay productos en la salida');
  }

  console.log('🔍 Validando stock con datos poblados:', productos.length, 'items');
  
  for (const item of productos) {
    const { producto, color, talla, cantidad } = item;
    
    if (!producto?.id || !color?.id) {
      throw new Error('Datos incompletos: falta producto o color');
    }
    
    const cantidadNum = parseInt(cantidad) || 0;
    if (cantidadNum <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
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
    
    // Buscar en inventario
    const inventarioRecord = await strapi.db.query('api::inventario-color.inventario-color').findOne({
      where: whereClause,
      populate: ['producto', 'color', 'talla']
    });
    
    if (!inventarioRecord) {
      const descripcion = talla
        ? `${producto.nombre} - ${color.nombre} - ${talla.sigla}`
        : `${producto.nombre} - ${color.nombre}`;
      
      throw new Error(`No existe registro de inventario para: ${descripcion}`);
    }
    
    const stockDisponible = inventarioRecord.stock_actual || 0;
    
    if (stockDisponible < cantidadNum) {
      const descripcion = inventarioRecord.talla 
        ? `${inventarioRecord.producto.nombre} - ${inventarioRecord.color.nombre} - ${inventarioRecord.talla.sigla}`
        : `${inventarioRecord.producto.nombre} - ${inventarioRecord.color.nombre}`;
      
      throw new Error(
        `Stock insuficiente para ${descripcion}. Disponible: ${stockDisponible}, Solicitado: ${cantidadNum}`
      );
    }
    
    console.log(`✅ Stock OK: ${producto.nombre} - Disponible: ${stockDisponible} >= ${cantidadNum}`);
  }
  
  console.log('✅ Validación de stock completada');
}

async function checkIfSalidaWasProcessed(salidaId) {
  try {
    // Verificar si algún producto en inventario tiene esta salida como última_salida reciente
    const salida = await strapi.entityService.findOne(
      'api::salida.salida',
      salidaId,
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
    
    if (!salida || !salida.Productos?.length) return false;
    
    // Verificar el primer producto como muestra
    const primerItem = salida.Productos[0];
    const whereClause = {
      producto: primerItem.producto.id,
      color: primerItem.color.id
    };
    
    if (primerItem.talla?.id) {
      whereClause.talla = primerItem.talla.id;
    } else {
      whereClause.talla = null;
    }
    
    const inventario = await strapi.db.query('api::inventario-color.inventario-color').findOne({
      where: whereClause
    });
    
    if (!inventario) return false;
    
    // Si la última salida es muy reciente (menos de 5 segundos), probablemente ya fue procesada
    const ultimaSalida = inventario.ultima_salida;
    if (ultimaSalida) {
      const ahora = new Date();
      const diferencia = ahora - new Date(ultimaSalida);
      if (diferencia < 5000) {
        console.log('⏱️ Última salida muy reciente, probablemente ya procesada');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error verificando si salida fue procesada:', error);
    return false;
  }
}

async function markSalidaAsProcessed(salidaId) {
  console.log('✅ Salida marcada como procesada:', salidaId);
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
      // Crear si no existe
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