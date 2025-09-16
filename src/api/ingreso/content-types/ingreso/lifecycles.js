module.exports = {
  async afterCreate(event) {
    const { result } = event;
    
    try {
      // Solo procesar si el estado es "Aprobado"
      if (result.estado === 'Aprobado') {
        console.log('Procesando ingreso con ID:', result.id);
        
        // Poblar las relaciones antes de procesar
        const populatedIngreso = await strapi.entityService.findOne(
          'api::ingreso.ingreso',
          result.id,
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
          console.error('No se pudo encontrar el ingreso con ID:', result.id);
          return;
        }
        
        console.log('Ingreso poblado encontrado:', JSON.stringify(populatedIngreso, null, 2));
        
        await updateInventoryFromIngreso(populatedIngreso);
      }
    } catch (error) {
      console.error('Error en afterCreate de ingreso:', error);
      throw error;
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    
    try {
      // Si se cambió el estado a "Aprobado", actualizar inventario
      if (result.estado === 'Aprobado') {
        console.log('Procesando actualización de ingreso con ID:', result.id);
        
        // Poblar las relaciones antes de procesar
        const populatedIngreso = await strapi.entityService.findOne(
          'api::ingreso.ingreso',
          result.id,
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
          console.error('No se pudo encontrar el ingreso con ID:', result.id);
          return;
        }
        
        await updateInventoryFromIngreso(populatedIngreso);
      }
    } catch (error) {
      console.error('Error en afterUpdate de ingreso:', error);
      throw error;
    }
  }
};

async function updateInventoryFromIngreso(ingreso) {
  try {
    // Validar que ingreso existe
    if (!ingreso) {
      console.error('Ingreso es null o undefined');
      return;
    }
    
    console.log('Procesando updateInventoryFromIngreso con:', JSON.stringify(ingreso, null, 2));
    
    // Validar que existan los productos
    if (!ingreso.Productos || !Array.isArray(ingreso.Productos)) {
      console.error('No se encontraron productos en el ingreso o no es un array:', ingreso.Productos);
      return;
    }
    
    if (ingreso.Productos.length === 0) {
      console.log('No hay productos para procesar en el ingreso');
      return;
    }
    
    for (const item of ingreso.Productos) {
      const { producto, stock_por_colores } = item;
      
      // Validar que el producto existe
      if (!producto || !producto.id) {
        console.error('Producto no válido en item:', item);
        continue;
      }
      
      console.log('Procesando producto:', producto.id, producto.nombre);
      
      // Validar que existan colores
      if (!stock_por_colores || !Array.isArray(stock_por_colores)) {
        console.error('No se encontraron colores para el producto:', producto);
        continue;
      }
      
      for (const stockColor of stock_por_colores) {
        const { color, cantidad } = stockColor;
        
        console.log('Procesando color:', color?.id, color?.nombre, 'cantidad:', cantidad);
        
        // Validar color y cantidad
        if (!color || !color.id || cantidad === undefined) {
          console.error('Color o cantidad no válidos:', stockColor);
          continue;
        }
        
        // Buscar o crear registro de inventario por color
        let inventarioColor = await strapi.db.query('api::inventario-color.inventario-color').findOne({
          where: {
            producto: producto.id,
            color: color.id
          }
        });
        
        if (inventarioColor) {
          // Actualizar stock existente
          const nuevoStock = inventarioColor.stock_actual + cantidad;
          
          await strapi.db.query('api::inventario-color.inventario-color').update({
            where: { id: inventarioColor.id },
            data: {
              stock_actual: nuevoStock,
              ultimo_ingreso: new Date()
            }
          });
          
          console.log(`Stock actualizado: ${producto.nombre} - ${color.nombre}: ${inventarioColor.stock_actual} + ${cantidad} = ${nuevoStock}`);
        } else {
          // Crear nuevo registro
          await strapi.db.query('api::inventario-color.inventario-color').create({
            data: {
              producto: producto.id,
              color: color.id,
              stock_actual: cantidad,
              ultimo_ingreso: new Date(),
              codigo: `${producto.codigo}-${color.nombre}`,
              unidad_de_medida: 'unidad'
            }
          });
          
          console.log(`Nuevo inventario creado: ${producto.nombre} - ${color.nombre}: ${cantidad}`);
        }
      }
      
      // Actualizar inventario general
      await updateGeneralInventory(producto.id);
    }
    
    console.log('updateInventoryFromIngreso completado exitosamente');
    
  } catch (error) {
    console.error('Error en updateInventoryFromIngreso:', error);
    throw error;
  }
}

async function updateGeneralInventory(productoId) {
  try {
    // Validar que se recibió un ID válido
    if (!productoId) {
      console.error('ID de producto no válido:', productoId);
      return;
    }
    
    console.log('Actualizando inventario general para producto:', productoId);
    
    // Calcular stock total por producto
    const inventarioColores = await strapi.db.query('api::inventario-color.inventario-color').findMany({
      where: { producto: productoId }
    });
    
    const stockTotal = inventarioColores.reduce((total, item) => total + item.stock_actual, 0);
    
    console.log(`Stock total calculado para producto ${productoId}:`, stockTotal);
    
    // Buscar o crear inventario general
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
      
      console.log(`Inventario general actualizado para producto ${productoId}: ${stockTotal}`);
    } else {
      await strapi.db.query('api::inventario.inventario').create({
        data: {
          producto: productoId,
          stock_total: stockTotal,
          ultimo_ingreso: new Date()
        }
      });
      
      console.log(`Inventario general creado para producto ${productoId}: ${stockTotal}`);
    }
    
  } catch (error) {
    console.error('Error en updateGeneralInventory:', error);
    throw error;
  }
}