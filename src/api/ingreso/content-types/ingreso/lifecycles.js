module.exports = {
  //async afterCreate(event) {
    afterCreate: async event => {
    const { result } = event;
    //console.log(result);
    
    result.Productos.forEach(async element => {
      const entry = await strapi.query('api::inventario.inventario').findOne({
        select: ['stock_actual', 'id'],
        populate: { producto: true },
        where: {
          producto: element.producto
        }
      });

      if (entry != null) {
        // Producto ya existente en el Inventario
        await strapi.query('api::inventario.inventario').update({
          where: { id: entry.id },
          data: {
            stock_actual: parseInt(entry.stock_actual) + parseInt(element.cantidad),
            ultimo_ingreso: Date.now()
          }
        });
      } else {
        // Producto Nuevo el Inventario
        await strapi.query('api::inventario.inventario').create({
          data: {
            stock_actual: parseInt(element.cantidad),
            producto: element.producto,
            ultimo_ingreso: Date.now()
          }
        });
      }
    });
  },

  afterUpdate: async event => {
    const { result } = event;

    console.log("==========  UPDATE  ==========")
    console.log(result)
    console.log("==========  PRODUCTOS  ==========")
    console.log(result.Productos)
  }
}