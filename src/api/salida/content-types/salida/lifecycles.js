module.exports = {
    async afterCreate(event) {
      const { result } = event;
  
      // Verifica si el campo 'Productos' está definido y es un array
      if (!result.Productos || !Array.isArray(result.Productos)) {
        console.error('El campo "Productos" no está definido o no es un array.');
        return;
      }
  
      // Itera sobre cada producto en el componente repetible
      for (const productoSalida of result.Productos) {
        // Verifica si el campo 'producto' está definido
        if (!productoSalida.producto || !productoSalida.producto.id) {
          console.error('El campo "producto" no está definido o no tiene un ID válido.');
          continue;
        }
  
        try {
          // Obtén el producto relacionado
          const producto = await strapi.entityService.findOne(
            'api::producto.producto',
            productoSalida.producto.id
          );
  
          if (!producto) {
            console.error(`No se encontró un producto con ID: ${productoSalida.producto.id}`);
            continue;
          }
  
          // Obtén el registro de inventario correspondiente
          let inventario = await strapi.entityService.findMany('api::inventario.inventario', {
            filters: { producto: productoSalida.producto.id },
          });
  
          if (inventario.length > 0) {
            inventario = inventario[0];
  
            // Convierte los valores a números
            const stockActual = Number(inventario.stock_actual);
            const cantidadSolicitada = Number(productoSalida.cantidad_solicitada);
  
            // Verifica si hay suficiente stock
            if (stockActual < cantidadSolicitada) {
              console.error(`No hay suficiente stock para el producto con ID: ${productoSalida.producto.id}`);
              continue;
            }
  
            // Actualiza el stock actual
            const nuevoStock = stockActual - cantidadSolicitada;
  
            await strapi.entityService.update('api::inventario.inventario', inventario.id, {
              data: {
                stock_actual: nuevoStock,
                ultima_salida: new Date(),
              },
            });
          } else {
            console.error(`No existe un registro de inventario para el producto con ID: ${productoSalida.producto.id}`);
          }
        } catch (error) {
          console.error('Error al actualizar el inventario:', error.message);
        }
      }
    },
  };