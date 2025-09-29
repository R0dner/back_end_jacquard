'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    // Ejecutar regeneración de permisos para inventario-color
    regenerateInventarioPermissions(strapi);
  },
};

async function regenerateInventarioPermissions(strapi) {
  console.log('🔄 Regenerando permisos para inventario-color...');
  
  try {
    // Esperar un poco para que Strapi termine de cargar completamente
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Obtener roles existentes
    const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' }
    });
    
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' }
    });

    console.log('Roles encontrados:', {
      authenticated: authenticatedRole?.id,
      public: publicRole?.id
    });

    // Content type específico que no aparece en permisos
    const contentTypeUID = 'api::inventario-color.inventario-color';
    
    // Verificar que existe el content type
    const contentType = strapi.contentTypes[contentTypeUID];
    if (!contentType) {
      console.log('❌ Content type no encontrado:', contentTypeUID);
      return;
    }

    console.log('✅ Content type encontrado:', contentTypeUID);

    // Acciones disponibles para este content type
    const actions = ['find', 'findOne', 'create', 'update', 'delete'];
    
    // Crear permisos para rol autenticado
    if (authenticatedRole) {
      for (const action of actions) {
        try {
          const existingPermission = await strapi.query('plugin::users-permissions.permission').findOne({
            where: {
              action: `${contentTypeUID}.${action}`,
              role: authenticatedRole.id
            }
          });

          if (!existingPermission) {
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action: `${contentTypeUID}.${action}`,
                enabled: true, // Habilitado por defecto
                policy: '',
                role: authenticatedRole.id
              }
            });
            console.log(`✅ Permiso creado para authenticated: ${action}`);
          } else {
            console.log(`ℹ️ Permiso ya existe para authenticated: ${action}`);
          }
        } catch (actionError) {
          console.log(`⚠️ Error creando permiso ${action}:`, actionError.message);
        }
      }
    }

    // Crear permisos para rol público (deshabilitados por defecto)
    if (publicRole) {
      for (const action of actions) {
        try {
          const existingPermission = await strapi.query('plugin::users-permissions.permission').findOne({
            where: {
              action: `${contentTypeUID}.${action}`,
              role: publicRole.id
            }
          });

          if (!existingPermission) {
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action: `${contentTypeUID}.${action}`,
                enabled: false, // Deshabilitado por defecto para público
                policy: '',
                role: publicRole.id
              }
            });
            console.log(`✅ Permiso creado para public: ${action} (disabled)`);
          }
        } catch (actionError) {
          console.log(`⚠️ Error creando permiso público ${action}:`, actionError.message);
        }
      }
    }

    console.log('🎉 Regeneración completada para inventario-color');
    
  } catch (error) {
    console.error('❌ Error general al regenerar permisos:', error);
  }
}