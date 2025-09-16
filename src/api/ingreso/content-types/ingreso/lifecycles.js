// src/api/ingreso/content-types/ingreso/lifecycles.js
module.exports = {
  async afterCreate(event) {
    const { result } = event;
    
    // Solo procesar si el estado es "Aprobado"
    if (result.estado === 'Aprobado') {
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
      
      await updateInventoryFromIngreso(populatedIngreso);
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    
    // Si se cambió el estado a "Aprobado", actualizar inventario
    if (result.estado === 'Aprobado') {
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
      
      await updateInventoryFromIngreso(populatedIngreso);
    }
  }
};

async function updateInventoryFromIngreso(ingreso) {
  // Validar que existan los productos
  if (!ingreso.Productos || !Array.isArray(ingreso.Productos)) {
    console.error('No se encontraron productos en el ingreso:', ingreso);
    return;
  }
  
  for (const item of ingreso.Productos) {
    const { producto, stock_por_colores } = item;
    
    // Validar que el producto existe
    if (!producto || !producto.id) {
      console.error('Producto no válido en item:', item);
      continue;
    }
    
    // Validar que existan colores
    if (!stock_por_colores || !Array.isArray(stock_por_colores)) {
      console.error('No se encontraron colores para el producto:', producto);
      continue;
    }
    
    for (const stockColor of stock_por_colores) {
      const { color, cantidad } = stockColor;
      
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
        await strapi.db.query('api::inventario-color.inventario-color').update({
          where: { id: inventarioColor.id },
          data: {
            stock_actual: inventarioColor.stock_actual + cantidad,
            ultimo_ingreso: new Date()
          }
        });
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
      }
    }
    
    // Actualizar inventario general
    await updateGeneralInventory(producto.id);
  }
}

async function updateGeneralInventory(productoId) {
  // Validar que se recibió un ID válido
  if (!productoId) {
    console.error('ID de producto no válido:', productoId);
    return;
  }
  
  // Calcular stock total por producto
  const inventarioColores = await strapi.db.query('api::inventario-color.inventario-color').findMany({
    where: { producto: productoId }
  });
  
  const stockTotal = inventarioColores.reduce((total, item) => total + item.stock_actual, 0);
  
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
  } else {
    await strapi.db.query('api::inventario.inventario').create({
      data: {
        producto: productoId,
        stock_total: stockTotal,
        ultimo_ingreso: new Date()
      }
    });
  }
}

// src/api/salida/content-types/salida/lifecycles.js
module.exports = {
  async afterCreate(event) {
    const { result } = event;
    
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
    
    await updateInventoryFromSalida(populatedSalida);
  }
};

async function updateInventoryFromSalida(salida) {
  // Validar que existan los productos
  if (!salida.Productos || !Array.isArray(salida.Productos)) {
    console.error('No se encontraron productos en la salida:', salida);
    return;
  }
  
  for (const item of salida.Productos) {
    const { producto, color, cantidad } = item;
    
    // Validar que el producto, color y cantidad existen
    if (!producto || !producto.id) {
      console.error('Producto no válido en item:', item);
      continue;
    }
    
    if (!color || !color.id) {
      console.error('Color no válido en item:', item);
      continue;
    }
    
    if (cantidad === undefined || cantidad <= 0) {
      console.error('Cantidad no válida en item:', item);
      continue;
    }
    
    // Buscar inventario por color
    const inventarioColor = await strapi.db.query('api::inventario-color.inventario-color').findOne({
      where: {
        producto: producto.id,
        color: color.id
      }
    });
    
    if (inventarioColor && inventarioColor.stock_actual >= cantidad) {
      // Reducir stock
      await strapi.db.query('api::inventario-color.inventario-color').update({
        where: { id: inventarioColor.id },
        data: {
          stock_actual: inventarioColor.stock_actual - cantidad,
          ultima_salida: new Date()
        }
      });
      
      // Actualizar inventario general
      await updateGeneralInventory(producto.id);
    } else {
      const productoNombre = producto.nombre || 'Producto desconocido';
      const colorNombre = color.nombre || 'Color desconocido';
      const stockDisponible = inventarioColor ? inventarioColor.stock_actual : 0;
      
      throw new Error(`Stock insuficiente para ${productoNombre} en color ${colorNombre}. Stock disponible: ${stockDisponible}, cantidad solicitada: ${cantidad}`);
    }
  }
}