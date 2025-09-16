module.exports = {
  async afterCreate(event) {
    const { result } = event;
    
    try {
      // Validar que el result existe y tiene ID
      if (!result || !result.id) {
        console.error('Resultado del evento no válido:', result);
        return;
      }
      
      console.log('Procesando salida con ID:', result.id);
      
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
        console.error('No se pudo encontrar la salida con ID:', result.id);
        return;
      }
      
      console.log('Salida poblada encontrada:', JSON.stringify(populatedSalida, null, 2));
      
      await updateInventoryFromSalida(populatedSalida);
      
    } catch (error) {
      console.error('Error en afterCreate de salida:', error);
      throw error;
    }
  }
};

async function updateInventoryFromSalida(salida) {
  try {
    // Validar que salida existe
    if (!salida) {
      console.error('Salida es null o undefined');
      return;
    }
    
    console.log('Procesando updateInventoryFromSalida con:', JSON.stringify(salida, null, 2));
    
    // Validar que existan los productos
    if (!salida.Productos || !Array.isArray(salida.Productos)) {
      console.error('No se encontraron productos en la salida o no es un array:', salida.Productos);
      return;
    }
    
    if (salida.Productos.length === 0) {
      console.log('No hay productos para procesar en la salida');
      return;
    }
    
    for (const item of salida.Productos) {
      const { producto, color, cantidad } = item;
      
      console.log('Procesando item:', { producto: producto?.id, color: color?.id, cantidad });
      
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
        const nuevoStock = inventarioColor.stock_actual - cantidad;
        
        await strapi.db.query('api::inventario-color.inventario-color').update({
          where: { id: inventarioColor.id },
          data: {
            stock_actual: nuevoStock,
            ultima_salida: new Date()
          }
        });
        
        console.log(`Stock actualizado para producto ${producto.id}, color ${color.id}: ${inventarioColor.stock_actual} - ${cantidad} = ${nuevoStock}`);
        
        // Actualizar inventario general
        await updateGeneralInventory(producto.id);
      } else {
        const productoNombre = producto.nombre || 'Producto desconocido';
        const colorNombre = color.nombre || 'Color desconocido';
        const stockDisponible = inventarioColor ? inventarioColor.stock_actual : 0;
        
        const errorMessage = `Stock insuficiente para ${productoNombre} en color ${colorNombre}. Stock disponible: ${stockDisponible}, cantidad solicitada: ${cantidad}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    }
    
    console.log('updateInventoryFromSalida completado exitosamente');
    
  } catch (error) {
    console.error('Error en updateInventoryFromSalida:', error);
    throw error;
  }
}