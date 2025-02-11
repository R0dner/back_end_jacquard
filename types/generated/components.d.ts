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
    description: '';
    displayName: 'items';
    icon: 'asterisk';
  };
  attributes: {
    cantidad: Attribute.Integer;
    costo_total: Attribute.BigInteger;
    costo_unitario: Attribute.Integer & Attribute.DefaultTo<0>;
    producto: Attribute.Relation<
      'productos.items',
      'oneToOne',
      'api::producto.producto'
    >;
  };
}

export interface ProductosItemsSalida extends Schema.Component {
  collectionName: 'components_productos_items_salidas';
  info: {
    displayName: 'Items_salida';
    icon: 'ambulance';
  };
  attributes: {
    cantidad_anterior: Attribute.BigInteger & Attribute.DefaultTo<'0'>;
    cantidad_posterior: Attribute.BigInteger;
    cantidad_solicitada: Attribute.BigInteger;
    producto: Attribute.Relation<
      'productos.items-salida',
      'oneToOne',
      'api::producto.producto'
    >;
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
