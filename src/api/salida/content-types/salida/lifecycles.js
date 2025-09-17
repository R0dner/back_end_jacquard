module.exports = {
  async afterCreate(event) {
    const { result } = event;
    
    try {
      console.log('=== INICIO afterCreate SALIDA ===');
      
      // Validar que el result existe y tiene ID
      if (!result || !result.id) {
        console.error('❌ Resultado del evento no válido:', result);
        return;
      }
      
      console.log('📤 Procesando salida con ID:', result.id);
      
      // Poblar las relaciones antes de procesar
      const populatedSalida = await strapi.entityService.findOne(
        'api::salida.salida',
        result.id,
        {
          populate: {
            Productos: {
              populate: {
                producto: true,
                color: true
              }
            }
          }
        }
      );
      
      // Validar que se encontró el registro
      if (!populatedSalida) {
        console.error('❌ No se pudo encontrar la salida con ID:', result.id);
        return;
      }
      
      console.log('✅ Salida poblada encontrada:', JSON.stringify(populatedSalida, null, 2));
      
      await updateInventoryFromSalida(populatedSalida);
      
    } catch (error) {
      console.error('❌ Error en afterCreate de salida:', error);
      throw error;
    }
  },

  async afterUpdate(event) {
    const { result } = event;
    
    try {
      console.log('=== INICIO afterUpdate SALIDA ===');
      console.log('📤 Actualizando salida con ID:', result.id);
      
      // Poblar las relaciones antes de procesar
      const populatedSalida = await strapi.entityService.findOne(
        'api::salida.salida',
        result.id,
        {
          populate: {
            Productos: {
              populate: {
                producto: true,
                color: true
              }
            }
          }
        }
      );
      
      if (!populatedSalida) {
        console.error('❌ No se pudo encontrar la salida con ID:', result.id);
        return;
      }
      
      await updateInventoryFromSalida(populatedSalida);
      
    } catch (error) {
      console.error('❌ Error en afterUpdate de salida:', error);
      throw error;
    }
  }
};

async function updateInventoryFromSalida(salida) {
  try {
    console.log('🔄 Iniciando updateInventoryFromSalida');
    
    // Validar que salida existe
    if (!salida) {
      console.error('❌ Salida es null o undefined');
      return;
    }
    
    // Validar que existan los productos
    if (!salida.Productos || !Array.isArray(salida.Productos)) {
      console.error('❌ No se encontraron productos en la salida o no es un array:', salida.Productos);
      return;
    }
    
    if (salida.Productos.length === 0) {
      console.log('⚠️ No hay productos para procesar en la salida');
      return;
    }
    
    console.log('📦 Procesando', salida.Productos.length, 'productos en la salida');
    
    // Set para evitar actualizar el mismo producto múltiples veces
    const productosActualizados = new Set();
    
    for (const item of salida.Productos) {
      const { producto, color, cantidad } = item;
      
      console.log('🔍 Procesando item:', { 
        producto: producto?.id, 
        productoNombre: producto?.nombre,
        color: color?.id, 
        colorNombre: color?.nombre,
        cantidad 
      });
      
      // Validar que el producto, color y cantidad existen
      if (!producto || !producto.id) {
        console.error('❌ Producto no válido en item:', item);
        continue;
      }
      
      if (!color || !color.id) {
        console.error('❌ Color no válido en item:', item);
        continue;
      }
      
      if (cantidad === undefined || cantidad <= 0) {
        console.error('❌ Cantidad no válida en item:', item);
        continue;
      }
      
      // Buscar inventario por color
      const inventarioColor = await strapi.db.query('api::inventario-color.inventario-color').findOne({
        where: {
          producto: producto.id,
          color: color.id
        }
      });
      
      console.log('📊 Inventario color encontrado:', inventarioColor);
      
      if (inventarioColor && inventarioColor.stock_actual >= cantidad) {
        // Reducir stock
        const nuevoStock = inventarioColor.stock_actual - cantidad;
        
        await strapi.db.query('api::inventario-color.inventario-color').update({
          where: { id: inventarioColor.id },
          data: {
            stock_actual: nuevoStock,
            ultima_salida: new Date()
          }
        });
        
        console.log(`✅ Stock actualizado para producto ${producto.nombre || producto.id}, color ${color.nombre || color.id}: ${inventarioColor.stock_actual} - ${cantidad} = ${nuevoStock}`);
        
        // Añadir producto al set para actualización posterior
        productosActualizados.add(producto.id);
        
      } else {
        const productoNombre = producto.nombre || 'Producto desconocido';
        const colorNombre = color.nombre || 'Color desconocido';
        const stockDisponible = inventarioColor ? inventarioColor.stock_actual : 0;
        
        const errorMessage = `Stock insuficiente para ${productoNombre} en color ${colorNombre}. Stock disponible: ${stockDisponible}, cantidad solicitada: ${cantidad}`;
        console.error('❌', errorMessage);
        throw new Error(errorMessage);
      }
    }
    
    // Actualizar inventario general para cada producto único
    console.log('🔄 Actualizando inventario general para', productosActualizados.size, 'productos únicos');
    for (const productoId of productosActualizados) {
      await updateGeneralInventory(productoId);
    }
    
    console.log('✅ updateInventoryFromSalida completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en updateInventoryFromSalida:', error);
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
      console.log(`   Color ${item.color}: ${stock} unidades`);
      return total + stock;
    }, 0);
    
    console.log(`📊 Stock total calculado para producto ${productoId}:`, stockTotal);
    
    // Buscar inventario general existente
    let inventarioGeneral = await strapi.db.query('api::inventario.inventario').findOne({
      where: { producto: productoId }
    });
    
    if (inventarioGeneral) {
      // Actualizar existente
      const inventarioAnterior = inventarioGeneral.stock_total;
      
      await strapi.db.query('api::inventario.inventario').update({
        where: { id: inventarioGeneral.id },
        data: {
          stock_total: stockTotal,
          ultima_salida: new Date()
        }
      });
      
      console.log(`✅ Inventario general ACTUALIZADO para producto ${productoId}: ${inventarioAnterior} → ${stockTotal}`);
    } else {
      // Crear nuevo (aunque esto es raro en una salida)
      const nuevoInventario = await strapi.db.query('api::inventario.inventario').create({
        data: {
          producto: productoId,
          stock_total: stockTotal,
          ultima_salida: new Date(),
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
    
    console.log('🔍 Verificación - Inventario después de salida:', {
      id: verificacion.id,
      producto: verificacion.producto?.nombre,
      stock_total: verificacion.stock_total,
      ultima_salida: verificacion.ultima_salida
    });
    
  } catch (error) {
    console.error('❌ Error en updateGeneralInventory:', error);
    throw error;
  }
}