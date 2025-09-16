// src/api/ingreso/content-types/ingreso/lifecycles.js
module.exports = {
  async afterCreate(event) {
    const { result } = event;
    
    // Solo procesar si el estado es "Aprobado"
    if (result.estado === 'Aprobado') {
      await updateInventoryFromIngreso(result);
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    
    // Si se cambió el estado a "Aprobado", actualizar inventario
    if (result.estado === 'Aprobado') {
      await updateInventoryFromIngreso(result);
    }
  }
};

async function updateInventoryFromIngreso(ingreso) {
  const { Productos } = ingreso;
  
  for (const item of Productos) {
    const { producto, stock_por_colores } = item;
    
    for (const stockColor of stock_por_colores) {
      const { color, cantidad } = stockColor;
      
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
    await updateInventoryFromSalida(result);
  }
};

async function updateInventoryFromSalida(salida) {
  const { Productos } = salida;
  
  for (const item of Productos) {
    const { producto, color, cantidad } = item;
    
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
      throw new Error(`Stock insuficiente para ${producto.nombre} en color ${color.nombre}`);
    }
  }
}