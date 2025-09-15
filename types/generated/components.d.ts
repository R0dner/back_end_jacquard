import type { Attribute, Schema } from '@strapi/strapi';

export interface ProductosItemSimple extends Schema.Component {
  collectionName: 'components_productos_item_simples';
  info: {
    displayName: 'item_simple';
    icon: 'play';
  };
  attributes: {
    producto: Attribute.Relation<
      'productos.item-simple',
      'oneToOne',
      'api::producto.producto'
    >;
  };
}

export interface ProductosItems extends Schema.Component {
  collectionName: 'components_productos_items';
  info: {
    description: 'Items de productos con colores para ingresos';
    displayName: 'items';
    icon: 'asterisk';
  };
  attributes: {
    cantidad: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    color: Attribute.Relation<
      'productos.items',
      'oneToOne',
      'api::color.color'
    > &
      Attribute.Required;
    costo_total: Attribute.BigInteger;
    costo_unitario: Attribute.Integer & Attribute.DefaultTo<0>;
    observaciones: Attribute.Text;
    producto: Attribute.Relation<
      'productos.items',
      'oneToOne',
      'api::producto.producto'
    > &
      Attribute.Required;
  };
}

export interface ProductosItemsSalida extends Schema.Component {
  collectionName: 'components_productos_items_salidas';
  info: {
    description: 'Items de productos con colores para salidas';
    displayName: 'Items_salida';
    icon: 'ambulance';
  };
  attributes: {
    cantidad_anterior: Attribute.BigInteger & Attribute.DefaultTo<'0'>;
    cantidad_posterior: Attribute.BigInteger;
    cantidad_solicitada: Attribute.BigInteger &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    color: Attribute.Relation<
      'productos.items-salida',
      'oneToOne',
      'api::color.color'
    > &
      Attribute.Required;
    observaciones: Attribute.Text;
    producto: Attribute.Relation<
      'productos.items-salida',
      'oneToOne',
      'api::producto.producto'
    > &
      Attribute.Required;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'productos.item-simple': ProductosItemSimple;
      'productos.items': ProductosItems;
      'productos.items-salida': ProductosItemsSalida;
    }
  }
}
