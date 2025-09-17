module.exports = {
  async afterCreate(event) {
    const { result } = event;
    
    try {
      console.log('=== INICIO afterCreate ===');
      console.log('Resultado completo:', JSON.stringify(result, null, 2));
      
      // Solo procesar si el estado es "Aprobado"
      if (result.estado === 'Aprobado') {
        console.log('✅ Estado es Aprobado, procesando ingreso con ID:', result.id);
        await processApprovedIngreso(result.id);
      } else {
        console.log('❌ Estado no es Aprobado:', result.estado);
        console.log('El ingreso se procesará cuando cambie a estado "Aprobado"');
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
      console.log('Resultado actualizado:', JSON.stringify(result, null, 2));
      console.log('Parámetros de actualización:', JSON.stringify(params, null, 2));
      
      // Si se cambió el estado a "Aprobado", actualizar inventario
      if (result.estado === 'Aprobado') {
        console.log('✅ Estado cambió a Aprobado, procesando ingreso con ID:', result.id);
        await processApprovedIngreso(result.id);
      } else {
        console.log('❌ Estado no es Aprobado:', result.estado);
      }
    } catch (error) {
      console.error('❌ Error en afterUpdate de ingreso:', error);
      throw error;
    }
  }
};

async function processApprovedIngreso(ingresoId) {
  try {
    console.log('🔍 Buscando ingreso con ID:', ingresoId);
    
    // Poblar las relaciones antes de procesar
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
                  color: true
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
    
    console.log('✅ Ingreso encontrado y poblado:', JSON.stringify(populatedIngreso, null, 2));
    
    await updateInventoryFromIngreso(populatedIngreso);
  } catch (error) {
    console.error('❌ Error en processApprovedIngreso:', error);
    throw error;
  }
}

async function updateInventoryFromIngreso(ingreso) {
  try {
    console.log('🔄 Iniciando updateInventoryFromIngreso');
    
    // Validar que ingreso existe
    if (!ingreso) {
      console.error('❌ Ingreso es null o undefined');
      return;
    }
    
    // Validar que existan los productos
    if (!ingreso.Productos || !Array.isArray(ingreso.Productos)) {
      console.error('❌ No se encontraron productos en el ingreso:', ingreso.Productos);
      return;
    }
    
    if (ingreso.Productos.length === 0) {
      console.log('⚠️ No hay productos para procesar en el ingreso');
      return;
    }
    
    console.log('📦 Procesando', ingreso.Productos.length, 'productos');
    
    for (const item of ingreso.Productos) {
      await processProductItem(item);
    }
    
    console.log('✅ updateInventoryFromIngreso completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en updateInventoryFromIngreso:', error);
    throw error;
  }
}

async function processProductItem(item) {
  try {
    const { producto, stock_por_colores } = item;
    
    // Validar que el producto existe
    if (!producto || !producto.id) {
      console.error('❌ Producto no válido en item:', item);
      return;
    }
    
    console.log('📦 Procesando producto:', producto.id, producto.nombre);
    
    // Validar que existan colores
    if (!stock_por_colores || !Array.isArray(stock_por_colores)) {
      console.error('❌ No se encontraron colores para el producto:', producto.id);
      return;
    }
    
    let totalCantidadProducto = 0;
    
    for (const stockColor of stock_por_colores) {
      const { color, cantidad } = stockColor;
      
      console.log('🎨 Procesando color:', color?.nombre, 'cantidad:', cantidad);
      
      // Validar color y cantidad
      if (!color || !color.id || cantidad === undefined || cantidad === null) {
        console.error('❌ Color o cantidad no válidos:', stockColor);
        continue;
      }
      
      totalCantidadProducto += parseInt(cantidad) || 0;
      
      await updateInventarioColor(producto, color, cantidad);
    }
    
    console.log('📊 Total cantidad para producto', producto.nombre, ':', totalCantidadProducto);
    
    // Actualizar inventario general
    await updateGeneralInventory(producto.id);
    
  } catch (error) {
    console.error('❌ Error en processProductItem:', error);
    throw error;
  }
}

async function updateInventarioColor(producto, color, cantidad) {
  try {
    // Buscar registro existente
    let inventarioColor = await strapi.db.query('api::inventario-color.inventario-color').findOne({
      where: {
        producto: producto.id,
        color: color.id
      }
    });
    
    const cantidadNumerica = parseInt(cantidad) || 0;
    
    if (inventarioColor) {
      // Actualizar stock existente
      const nuevoStock = inventarioColor.stock_actual + cantidadNumerica;
      
      await strapi.db.query('api::inventario-color.inventario-color').update({
        where: { id: inventarioColor.id },
        data: {
          stock_actual: nuevoStock,
          ultimo_ingreso: new Date()
        }
      });
      
      console.log(`✅ Stock actualizado: ${producto.nombre} - ${color.nombre}: ${inventarioColor.stock_actual} + ${cantidadNumerica} = ${nuevoStock}`);
    } else {
      // Crear nuevo registro
      await strapi.db.query('api::inventario-color.inventario-color').create({
        data: {
          producto: producto.id,
          color: color.id,
          stock_actual: cantidadNumerica,
          ultimo_ingreso: new Date(),
          codigo: `${producto.codigo}-${color.nombre}`,
          unidad_de_medida: 'unidad'
        }
      });
      
      console.log(`✅ Nuevo inventario por color creado: ${producto.nombre} - ${color.nombre}: ${cantidadNumerica}`);
    }
    
  } catch (error) {
    console.error('❌ Error en updateInventarioColor:', error);
    throw error;
  }
}

async function updateGeneralInventory(productoId) {
  try {
    console.log('📊 Actualizando inventario general para producto:', productoId);
    
    // Validar que se recibió un ID válido
    if (!productoId) {
      console.error('❌ ID de producto no válido:', productoId);
      return;
    }
    
    // Calcular stock total por producto desde inventario por colores
    const inventarioColores = await strapi.db.query('api::inventario-color.inventario-color').findMany({
      where: { producto: productoId }
    });
    
    console.log('🎨 Inventarios por color encontrados:', inventarioColores.length);
    
    const stockTotal = inventarioColores.reduce((total, item) => {
      const stock = parseInt(item.stock_actual) || 0;
      console.log(`   Color ${item.id}: ${stock} unidades`);
      return total + stock;
    }, 0);
    
    console.log(`📊 Stock total calculado para producto ${productoId}:`, stockTotal);
    
    // Buscar inventario general existente
    let inventarioGeneral = await strapi.db.query('api::inventario.inventario').findOne({
      where: { producto: productoId }
    });
    
    if (inventarioGeneral) {
      // Actualizar existente
      await strapi.db.query('api::inventario.inventario').update({
        where: { id: inventarioGeneral.id },
        data: {
          stock_total: stockTotal,
          ultimo_ingreso: new Date()
        }
      });
      
      console.log(`✅ Inventario general ACTUALIZADO para producto ${productoId}: ${stockTotal}`);
    } else {
      // Crear nuevo
      const nuevoInventario = await strapi.db.query('api::inventario.inventario').create({
        data: {
          producto: productoId,
          stock_total: stockTotal,
          ultimo_ingreso: new Date(),
          unidad_de_medida: 'unidad'
        }
      });
      
      console.log(`✅ Inventario general CREADO para producto ${productoId}: ${stockTotal}`, nuevoInventario);
    }
    
    // Verificar que se guardó correctamente
    const verificacion = await strapi.db.query('api::inventario.inventario').findOne({
      where: { producto: productoId },
      populate: { producto: true }
    });
    
    console.log('🔍 Verificación - Inventario guardado:', verificacion);
    
  } catch (error) {
    console.error('❌ Error en updateGeneralInventory:', error);
    throw error;
  }
}