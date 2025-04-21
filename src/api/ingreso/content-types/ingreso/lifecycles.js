module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Verifica si el campo 'Productos' está definido y es un array
    if (!result.Productos || !Array.isArray(result.Productos)) {
      console.error('El campo "Productos" no está definido o no es un array.');
      return;
    }

    // Itera sobre cada producto en el componente repetible
    for (const productoIngreso of result.Productos) {
      // Verifica si el campo 'producto' está definido
      if (!productoIngreso.producto || !productoIngreso.producto.id) {
        console.error('El campo "producto" no está definido o no tiene un ID válido.');
        continue;
      }

      try {
        // Obtén el producto relacionado
        const producto = await strapi.entityService.findOne(
          'api::producto.producto',
          productoIngreso.producto.id
        );

        if (!producto) {
          console.error(`No se encontró un producto con ID: ${productoIngreso.producto.id}`);
          continue;
        }

        // Obtén el registro de inventario correspondiente
        let inventario = await strapi.entityService.findMany('api::inventario.inventario', {
          filters: { producto: productoIngreso.producto.id },
        });

        if (inventario.length > 0) {
          inventario = inventario[0];

          // Convierte los valores a números
          const stockActual = Number(inventario.stock_actual);
          const cantidadIngreso = Number(productoIngreso.cantidad);

          // Actualiza el stock actual
          const nuevoStock = stockActual + cantidadIngreso;

          await strapi.entityService.update('api::inventario.inventario', inventario.id, {
            data: {
              stock_actual: nuevoStock,
              ultimo_ingreso: new Date(),
            },
          });
        } else {
          // Si no existe un registro de inventario, créalo
          const cantidadIngreso = Number(productoIngreso.cantidad);

          await strapi.entityService.create('api::inventario.inventario', {
            data: {
              producto: productoIngreso.producto.id,
              stock_actual: cantidadIngreso,
              ultimo_ingreso: new Date(),
            },
          });
        }
      } catch (error) {
        console.error('Error al actualizar el inventario:', error.message);
      }
    }
  },
};