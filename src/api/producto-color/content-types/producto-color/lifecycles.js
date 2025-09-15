module.exports = {
  async afterCreate(event) {
    const { result } = event;
    
    // Crear registro de inventario correspondiente
    await createInventarioEntry(result);
    
    // Actualizar stock total del producto padre
    await updateProductoStockTotal(result.producto);
  },
  
  async afterUpdate(event) {
    const { result } = event;
    
    // Actualizar inventario correspondiente
    await updateInventarioEntry(result);
    
    // Actualizar stock total del producto padre
    await updateProductoStockTotal(result.producto);
  },
  
  async afterDelete(event) {
    const { result } = event;
    
    // Eliminar registro de inventario correspondiente
    await deleteInventarioEntry(result.id);
    
    // Actualizar stock total del producto padre
    await updateProductoStockTotal(result.producto);
  }
};

async function createInventarioEntry(productoColor) {
  try {
    const inventario = await strapi.entityService.create(
      'api::inventario.inventario',
      {
        data: {
          producto_color: productoColor.id,
          stock_actual: productoColor.stock_disponible || 0,
          disponible: productoColor.stock_disponible || 0,
          ultimo_ingreso: new Date()
        }
      }
    );
    
    return inventario;
  } catch (error) {
    console.error('Error creating inventario entry:', error);
  }
}

async function updateInventarioEntry(productoColor) {
  try {
    // Buscar inventario existente
    const inventarios = await strapi.entityService.findMany(
      'api::inventario.inventario',
      {
        filters: { producto_color: productoColor.id }
      }
    );
    
    if (inventarios.length > 0) {
      const inventario = inventarios[0];
      await strapi.entityService.update(
        'api::inventario.inventario',
        inventario.id,
        {
          data: {
            stock_actual: productoColor.stock_disponible || 0,
            disponible: (productoColor.stock_disponible || 0) - (inventario.reservado || 0),
            ultimo_ingreso: new Date()
          }
        }
      );
    }
  } catch (error) {
    console.error('Error updating inventario entry:', error);
  }
}

async function deleteInventarioEntry(productoColorId) {
  try {
    const inventarios = await strapi.entityService.findMany(
      'api::inventario.inventario',
      {
        filters: { producto_color: productoColorId }
      }
    );
    
    for (const inventario of inventarios) {
      await strapi.entityService.delete('api::inventario.inventario', inventario.id);
    }
  } catch (error) {
    console.error('Error deleting inventario entry:', error);
  }
}

async function updateProductoStockTotal(productoId) {
  try {
    const productoColores = await strapi.entityService.findMany(
      'api::producto-color.producto-color',
      {
        filters: { producto: productoId },
        fields: ['stock_disponible']
      }
    );
    
    const stockTotal = productoColores.reduce(
      (total, item) => total + (item.stock_disponible || 0), 
      0
    );
    
    await strapi.entityService.update('api::producto.producto', productoId, {
      data: {
        stock_disponible: stockTotal
      }
    });
    
  } catch (error) {
    console.error('Error updating producto stock total:', error);
  }
}