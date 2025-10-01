module.exports = {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    try {
      const publicRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

      if (!publicRole) {
        console.log('⚠️ Rol público no encontrado');
        return;
      }

      console.log('📋 Rol público encontrado, ID:', publicRole.id);

      const contentTypesToEnable = [
        {
          uid: 'api::inventario-color.inventario-color',
          actions: ['find', 'findOne']
        },
        {
          uid: 'api::producto.producto',
          actions: ['find', 'findOne']
        },
        {
          uid: 'api::color.color',
          actions: ['find', 'findOne']
        },
        {
          uid: 'api::talla.talla',
          actions: ['find', 'findOne']
        },
        {
          uid: 'api::inventario.inventario',
          actions: ['find', 'findOne']
        }
      ];

      for (const contentType of contentTypesToEnable) {
        for (const action of contentType.actions) {
          const permissionName = `${contentType.uid}.${action}`;
          
          // Buscar permiso existente
          let permission = await strapi
            .query('plugin::users-permissions.permission')
            .findOne({
              where: {
                role: publicRole.id,
                action: permissionName
              }
            });

          if (permission) {
            // Actualizar y FORZAR enabled = true
            await strapi
              .query('plugin::users-permissions.permission')
              .update({
                where: { id: permission.id },
                data: { enabled: true }
              });
            console.log(`✅ Permiso ACTUALIZADO y habilitado: ${permissionName}`);
          } else {
            // Crear nuevo permiso YA habilitado
            permission = await strapi
              .query('plugin::users-permissions.permission')
              .create({
                data: {
                  action: permissionName,
                  role: publicRole.id,
                  enabled: true
                }
              });
            console.log(`✅ Permiso CREADO y habilitado: ${permissionName}`);
          }

          // Verificar que quedó habilitado
          const verificar = await strapi
            .query('plugin::users-permissions.permission')
            .findOne({ where: { id: permission.id } });
          
          console.log(`🔍 Verificación ${permissionName}: enabled=${verificar.enabled}`);
        }
      }

      console.log('🎉 Configuración completada');
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  },
};