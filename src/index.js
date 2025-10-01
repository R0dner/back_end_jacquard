module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }) {
    // Habilitar permisos públicos para inventario-color
    try {
      const publicRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

      if (!publicRole) {
        console.log('⚠️ Rol público no encontrado');
        return;
      }

      // Content types que necesitan permisos públicos
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
          
          // Buscar si el permiso ya existe
          const existingPermission = await strapi
            .query('plugin::users-permissions.permission')
            .findOne({
              where: {
                role: publicRole.id,
                action: permissionName
              }
            });

          if (existingPermission) {
            // Actualizar permiso existente
            await strapi
              .query('plugin::users-permissions.permission')
              .update({
                where: { id: existingPermission.id },
                data: { enabled: true }
              });
            console.log(`✅ Permiso habilitado: ${permissionName}`);
          } else {
            // Crear nuevo permiso
            await strapi
              .query('plugin::users-permissions.permission')
              .create({
                data: {
                  action: permissionName,
                  role: publicRole.id,
                  enabled: true
                }
              });
            console.log(`✅ Permiso creado: ${permissionName}`);
          }
        }
      }

      console.log('🎉 Todos los permisos públicos configurados correctamente');
    } catch (error) {
      console.error('❌ Error configurando permisos:', error);
    }
  },
};