import type { Attribute, Schema } from '@strapi/strapi';

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Attribute.String;
    registrationToken: Attribute.String & Attribute.Private;
    resetPasswordToken: Attribute.String & Attribute.Private;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    username: Attribute.String;
  };
}

export interface ApiCarruselEmpresaCarruselEmpresa
  extends Schema.CollectionType {
  collectionName: 'carrusel_empresas';
  info: {
    description: 'Im\u00E1genes para el carrusel de la p\u00E1gina Empresa';
    displayName: 'Carrusel Empresa';
    pluralName: 'carrusel-empresas';
    singularName: 'carrusel-empresa';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::carrusel-empresa.carrusel-empresa',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    descripcion: Attribute.Text;
    empresa: Attribute.Relation<
      'api::carrusel-empresa.carrusel-empresa',
      'manyToOne',
      'api::empresa.empresa'
    >;
    imagen: Attribute.Media<'images'> & Attribute.Required;
    orden: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    publishedAt: Attribute.DateTime;
    titulo: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::carrusel-empresa.carrusel-empresa',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCategoriasCategorias extends Schema.CollectionType {
  collectionName: 'categoria';
  info: {
    description: '';
    displayName: 'Categorias';
    pluralName: 'categoria';
    singularName: 'categorias';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Attribute.Boolean & Attribute.DefaultTo<true>;
    codigo: Attribute.UID;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::categorias.categorias',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    descripcion: Attribute.String;
    grupos_de_productos: Attribute.Relation<
      'api::categorias.categorias',
      'oneToMany',
      'api::grupo-producto.grupo-producto'
    >;
    imagen: Attribute.Media<'images'>;
    nombre: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::categorias.categorias',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiColorColor extends Schema.CollectionType {
  collectionName: 'colores';
  info: {
    description: 'Colores disponibles para los productos';
    displayName: 'Colores';
    pluralName: 'colores';
    singularName: 'color';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    color_rgb: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::color.color',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    imagen: Attribute.Media<'images'>;
    nombre: Attribute.String & Attribute.Required & Attribute.Unique;
    productos: Attribute.Relation<
      'api::color.color',
      'oneToMany',
      'api::producto.producto'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::color.color',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiEmpresaEmpresa extends Schema.CollectionType {
  collectionName: 'empresas';
  info: {
    displayName: 'Empresa';
    pluralName: 'empresas';
    singularName: 'empresa';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    carruselItems: Attribute.Relation<
      'api::empresa.empresa',
      'oneToMany',
      'api::carrusel-empresa.carrusel-empresa'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::empresa.empresa',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    descripcion_historia: Attribute.Text;
    filosofia: Attribute.Text;
    publishedAt: Attribute.DateTime;
    titulo_historia: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::empresa.empresa',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiGaleriaEmpresaGaleriaEmpresa extends Schema.CollectionType {
  collectionName: 'galeria_empresas';
  info: {
    description: '';
    displayName: 'galeria-empresa';
    pluralName: 'galeria-empresas';
    singularName: 'galeria-empresa';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::galeria-empresa.galeria-empresa',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    Descripcion: Attribute.String;
    Enlace: Attribute.Text;
    imagen: Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>;
    orden: Attribute.Integer;
    publishedAt: Attribute.DateTime;
    titulo: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::galeria-empresa.galeria-empresa',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiGrupoProductoGrupoProducto extends Schema.CollectionType {
  collectionName: 'grupos_productos';
  info: {
    description: '';
    displayName: 'Grupos de Productos';
    pluralName: 'grupos-productos';
    singularName: 'grupo-producto';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Attribute.Boolean & Attribute.DefaultTo<true>;
    categoria: Attribute.Relation<
      'api::grupo-producto.grupo-producto',
      'manyToOne',
      'api::categorias.categorias'
    >;
    codigo: Attribute.UID;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::grupo-producto.grupo-producto',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    descripcion: Attribute.Text;
    imagen: Attribute.Media<'images'>;
    nombre: Attribute.String;
    productos: Attribute.Relation<
      'api::grupo-producto.grupo-producto',
      'manyToMany',
      'api::producto.producto'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::grupo-producto.grupo-producto',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiIngresoIngreso extends Schema.CollectionType {
  collectionName: 'ingresos';
  info: {
    description: 'Control de ingresos de productos con configuraciones de precios';
    displayName: 'Ingresos';
    pluralName: 'ingresos';
    singularName: 'ingreso';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    aprobado: Attribute.Boolean & Attribute.DefaultTo<false>;
    aprobado_por: Attribute.Relation<
      'api::ingreso.ingreso',
      'oneToOne',
      'admin::user'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::ingreso.ingreso',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    estado: Attribute.Enumeration<
      ['Borrador', 'Creado', 'Aprobado', 'Rechazado']
    > &
      Attribute.DefaultTo<'Borrador'>;
    fecha_ingreso: Attribute.Date & Attribute.Required;
    ingresado_por: Attribute.Relation<
      'api::ingreso.ingreso',
      'oneToOne',
      'admin::user'
    >;
    motivo_ingreso: Attribute.String;
    numero_factura: Attribute.String;
    observaciones_generales: Attribute.Text;
    Productos: Attribute.Component<'productos.items', true> &
      Attribute.Required;
    tipo_ingreso: Attribute.Enumeration<
      ['Producci\u00F3n', 'Compra', 'Donaci\u00F3n', 'Transferencia', 'Otros']
    > &
      Attribute.DefaultTo<'Producci\u00F3n'>;
    total_costo: Attribute.Decimal;
    total_items: Attribute.Integer;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::ingreso.ingreso',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiInventarioColorInventarioColor
  extends Schema.CollectionType {
  collectionName: 'inventario_colores';
  info: {
    description: 'Control de stock por producto, color y opcionalmente talla con precios';
    displayName: 'Inventario por Color y Talla';
    pluralName: 'inventario-colores';
    singularName: 'inventario-color';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    codigo: Attribute.UID;
    color: Attribute.Relation<
      'api::inventario-color.inventario-color',
      'manyToOne',
      'api::color.color'
    > &
      Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::inventario-color.inventario-color',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    en_oferta: Attribute.Boolean & Attribute.DefaultTo<false>;
    estado_producto: Attribute.Enumeration<
      ['Activo', 'Inactivo', 'Descontinuado', 'Agotado']
    > &
      Attribute.DefaultTo<'Activo'>;
    fecha_fin_oferta: Attribute.Date;
    fecha_inicio_oferta: Attribute.Date;
    fecha_ultimo_cambio_precio: Attribute.DateTime;
    margen_ganancia: Attribute.Decimal & Attribute.DefaultTo<0>;
    observaciones: Attribute.Text;
    precio_oferta: Attribute.Decimal;
    precio_unitario: Attribute.Decimal & Attribute.DefaultTo<0>;
    precio_venta_sugerido: Attribute.Decimal & Attribute.DefaultTo<0>;
    producto: Attribute.Relation<
      'api::inventario-color.inventario-color',
      'manyToOne',
      'api::producto.producto'
    > &
      Attribute.Required;
    stock_actual: Attribute.Integer &
      Attribute.Required &
      Attribute.DefaultTo<0>;
    stock_minimo: Attribute.Integer & Attribute.DefaultTo<0>;
    talla: Attribute.Relation<
      'api::inventario-color.inventario-color',
      'manyToOne',
      'api::talla.talla'
    >;
    ultima_salida: Attribute.DateTime;
    ultimo_ingreso: Attribute.DateTime;
    unidad_de_medida: Attribute.Enumeration<['docena', 'paquete', 'unidad']> &
      Attribute.DefaultTo<'unidad'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::inventario-color.inventario-color',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiInventarioInventario extends Schema.CollectionType {
  collectionName: 'inventarios';
  info: {
    description: 'Vista general del inventario por producto';
    displayName: 'Inventario General';
    pluralName: 'inventarios';
    singularName: 'inventario';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    codigo: Attribute.UID;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::inventario.inventario',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    producto: Attribute.Relation<
      'api::inventario.inventario',
      'oneToOne',
      'api::producto.producto'
    > &
      Attribute.Required;
    stock_total: Attribute.Integer & Attribute.DefaultTo<0>;
    ultima_salida: Attribute.DateTime;
    ultimo_ingreso: Attribute.DateTime;
    unidad_de_medida: Attribute.Enumeration<['docena', 'paquete', 'unidad']> &
      Attribute.DefaultTo<'unidad'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::inventario.inventario',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMensajeMensaje extends Schema.CollectionType {
  collectionName: 'mensajes';
  info: {
    description: '';
    displayName: 'Mensaje';
    pluralName: 'mensajes';
    singularName: 'mensaje';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::mensaje.mensaje',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.Text;
    fullName: Attribute.String & Attribute.Required;
    messageType: Attribute.Text & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::mensaje.mensaje',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiNovedadNovedad extends Schema.CollectionType {
  collectionName: 'novedades';
  info: {
    displayName: 'novedades';
    pluralName: 'novedades';
    singularName: 'novedad';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::novedad.novedad',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    DescripcionBreve: Attribute.String;
    Enlace: Attribute.String;
    FechadePublicacion: Attribute.Date;
    imagen: Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>;
    publishedAt: Attribute.DateTime;
    titulo: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::novedad.novedad',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPedidoPedido extends Schema.CollectionType {
  collectionName: 'pedidos';
  info: {
    displayName: 'Pedidos';
    pluralName: 'pedidos';
    singularName: 'pedido';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    comprobante: Attribute.Media<'images' | 'files'> & Attribute.Required;
    costo_envio: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<0>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::pedido.pedido',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    estado: Attribute.Enumeration<
      ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado']
    > &
      Attribute.Required &
      Attribute.DefaultTo<'pendiente'>;
    fecha_entrega_solicitada: Attribute.DateTime & Attribute.Required;
    fecha_pedido: Attribute.DateTime & Attribute.Required;
    metodo_pago: Attribute.String & Attribute.Required;
    productos: Attribute.JSON & Attribute.Required;
    publishedAt: Attribute.DateTime;
    referencia: Attribute.String & Attribute.Required & Attribute.Unique;
    subtotal: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    total: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::pedido.pedido',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    user: Attribute.Relation<
      'api::pedido.pedido',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    user_email: Attribute.Email & Attribute.Required;
    user_role: Attribute.String & Attribute.Required;
  };
}

export interface ApiProductoProducto extends Schema.CollectionType {
  collectionName: 'productos';
  info: {
    description: 'Cat\u00E1logo de productos';
    displayName: 'Productos';
    pluralName: 'productos';
    singularName: 'producto';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Attribute.Boolean & Attribute.DefaultTo<true>;
    codigo: Attribute.UID & Attribute.Required;
    colores: Attribute.Relation<
      'api::producto.producto',
      'oneToMany',
      'api::color.color'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::producto.producto',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    descripcion: Attribute.Text & Attribute.Required;
    fecha_disponible: Attribute.Date;
    grupos_de_productos: Attribute.Relation<
      'api::producto.producto',
      'manyToMany',
      'api::grupo-producto.grupo-producto'
    >;
    imagen_principal: Attribute.Media<'images'>;
    multimedia: Attribute.Media<'images' | 'videos', true>;
    nombre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    observaciones: Attribute.Text;
    tallas: Attribute.Relation<
      'api::producto.producto',
      'oneToMany',
      'api::talla.talla'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::producto.producto',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    valoracion: Attribute.Decimal &
      Attribute.SetMinMax<
        {
          max: 5;
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<1>;
  };
}

export interface ApiPublicacionesRecientePublicacionesReciente
  extends Schema.CollectionType {
  collectionName: 'publicaciones_recientes';
  info: {
    description: '';
    displayName: 'publicaciones-recientes';
    pluralName: 'publicaciones-recientes';
    singularName: 'publicaciones-reciente';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::publicaciones-reciente.publicaciones-reciente',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    enlace: Attribute.String;
    fecha: Attribute.Date;
    imagen: Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>;
    publishedAt: Attribute.DateTime;
    resumen: Attribute.String;
    titulo: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::publicaciones-reciente.publicaciones-reciente',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSalidaSalida extends Schema.CollectionType {
  collectionName: 'salidas';
  info: {
    description: 'Control de salidas de inventario';
    displayName: 'Salidas';
    pluralName: 'salidas';
    singularName: 'salida';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    Aclaracion: Attribute.Text;
    aprobado_por: Attribute.Relation<
      'api::salida.salida',
      'oneToOne',
      'admin::user'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::salida.salida',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    estado: Attribute.Enumeration<
      ['Borrador', 'Pendiente', 'Aprobada', 'Rechazada', 'Completada']
    > &
      Attribute.DefaultTo<'Borrador'>;
    fecha_salida: Attribute.Date & Attribute.Required;
    numero_documento: Attribute.String;
    Productos: Attribute.Component<'productos.items-salida', true> &
      Attribute.Required;
    solicitado_por: Attribute.Relation<
      'api::salida.salida',
      'oneToOne',
      'admin::user'
    >;
    tipo_solicitud: Attribute.Enumeration<
      [
        'Entrega',
        'Venta directa',
        'Preventa',
        'Devoluci\u00F3n',
        'Transferencia',
        'Otros'
      ]
    > &
      Attribute.DefaultTo<'Entrega'>;
    total_items: Attribute.Integer;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::salida.salida',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiTallaTalla extends Schema.CollectionType {
  collectionName: 'tallas';
  info: {
    displayName: 'Tallas';
    pluralName: 'tallas';
    singularName: 'talla';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::talla.talla',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    descripcion: Attribute.String;
    sigla: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::talla.talla',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    scheduledAt: Attribute.DateTime;
    status: Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Attribute.Required;
    timezone: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    entry: Attribute.Relation<
      'plugin::content-releases.release-action',
      'morphToOne'
    >;
    isEntryValid: Attribute.Boolean;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Attribute.String;
    caption: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    ext: Attribute.String;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    height: Attribute.Integer;
    mime: Attribute.String & Attribute.Required;
    name: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    size: Attribute.Decimal & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    url: Attribute.String & Attribute.Required;
    width: Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    type: Attribute.String & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    displayName: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    pedidos: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::pedido.pedido'
    >;
    provider: Attribute.String;
    resetPasswordToken: Attribute.String & Attribute.Private;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    tipo_usuario: Attribute.Enumeration<
      ['Administrador', 'Preventista', 'vendedor']
    > &
      Attribute.DefaultTo<'Preventista'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::carrusel-empresa.carrusel-empresa': ApiCarruselEmpresaCarruselEmpresa;
      'api::categorias.categorias': ApiCategoriasCategorias;
      'api::color.color': ApiColorColor;
      'api::empresa.empresa': ApiEmpresaEmpresa;
      'api::galeria-empresa.galeria-empresa': ApiGaleriaEmpresaGaleriaEmpresa;
      'api::grupo-producto.grupo-producto': ApiGrupoProductoGrupoProducto;
      'api::ingreso.ingreso': ApiIngresoIngreso;
      'api::inventario-color.inventario-color': ApiInventarioColorInventarioColor;
      'api::inventario.inventario': ApiInventarioInventario;
      'api::mensaje.mensaje': ApiMensajeMensaje;
      'api::novedad.novedad': ApiNovedadNovedad;
      'api::pedido.pedido': ApiPedidoPedido;
      'api::producto.producto': ApiProductoProducto;
      'api::publicaciones-reciente.publicaciones-reciente': ApiPublicacionesRecientePublicacionesReciente;
      'api::salida.salida': ApiSalidaSalida;
      'api::talla.talla': ApiTallaTalla;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
