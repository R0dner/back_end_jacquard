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
    description: 'Items de productos con m\u00FAltiples colores para ingresos';
    displayName: 'items';
    icon: 'asterisk';
  };
  attributes: {
    costo_total: Attribute.Decimal & Attribute.Required;
    costo_unitario: Attribute.Decimal & Attribute.Required;
    observaciones: Attribute.Text;
    producto: Attribute.Relation<
      'productos.items',
      'oneToOne',
      'api::producto.producto'
    > &
      Attribute.Required;
    stock_por_colores: Attribute.Component<'productos.stock-color', true> &
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
    cantidad: Attribute.Integer &
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
    precio_unitario: Attribute.Decimal;
    producto: Attribute.Relation<
      'productos.items-salida',
      'oneToOne',
      'api::producto.producto'
    > &
      Attribute.Required;
  };
}

export interface ProductosStockColor extends Schema.Component {
  collectionName: 'components_productos_stock_colores';
  info: {
    description: 'Cantidad de stock por color espec\u00EDfico';
    displayName: 'Stock por Color';
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
      'productos.stock-color',
      'oneToOne',
      'api::color.color'
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
      'productos.stock-color': ProductosStockColor;
    }
  }
}
