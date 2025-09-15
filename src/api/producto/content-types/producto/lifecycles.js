module.exports = {
  async afterUpdate(event) {
    const { result } = event;
    
    // Actualizar stock_disponible total del producto
    await updateProductoStockTotal(result.id);
  },
  
  async afterCreate(event) {
    const { result } = event;
    
    // Actualizar stock_disponible total del producto
    await updateProductoStockTotal(result.id);
  }
};

async function updateProductoStockTotal(productoId) {
  try {
    // Obtener todos los producto_colores relacionados
    const productoColores = await strapi.entityService.findMany(
      'api::producto-color.producto-color',
      {
        filters: { producto: productoId },
        fields: ['stock_disponible']
      }
    );
    
    // Calcular stock total
    const stockTotal = productoColores.reduce(
      (total, item) => total + (item.stock_disponible || 0), 
      0
    );
    
    // Actualizar el producto con el stock total
    await strapi.entityService.update('api::producto.producto', productoId, {
      data: {
        stock_disponible: stockTotal
      }
    });
    
  } catch (error) {
    console.error('Error updating producto stock total:', error);
  }
}