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
    description: 'Items de productos con precios y configuraciones';
    displayName: 'Productos Items';
  };
  attributes: {
    aplicar_oferta: Attribute.Boolean & Attribute.DefaultTo<false>;
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
    margen_ganancia: Attribute.Decimal &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<50>;
    observaciones: Attribute.Text;
    precio_oferta: Attribute.Decimal &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    precio_unitario: Attribute.Decimal &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    precio_venta_sugerido: Attribute.Decimal &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    producto: Attribute.Relation<
      'productos.items',
      'oneToOne',
      'api::producto.producto'
    > &
      Attribute.Required;
    stock_minimo: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Attribute.DefaultTo<5>;
    talla: Attribute.Relation<
      'productos.items',
      'oneToOne',
      'api::talla.talla'
    >;
    unidad_de_medida: Attribute.Enumeration<['docena', 'paquete', 'unidad']> &
      Attribute.DefaultTo<'unidad'>;
  };
}

export interface ProductosItemsSalida extends Schema.Component {
  collectionName: 'components_productos_items_salidas';
  info: {
    description: 'Items de productos con colores y tallas para salidas';
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
    producto: Attribute.Relation<
      'productos.items-salida',
      'oneToOne',
      'api::producto.producto'
    > &
      Attribute.Required;
    talla: Attribute.Relation<
      'productos.items-salida',
      'oneToOne',
      'api::talla.talla'
    >;
  };
}

export interface ProductosStockColor extends Schema.Component {
  collectionName: 'components_productos_stock_colores';
  info: {
    description: 'Cantidad de stock por color espec\u00EDfico con detalle opcional de tallas';
    displayName: 'Stock por Color';
  };
  attributes: {
    cantidad: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    color: Attribute.Relation<
      'productos.stock-color',
      'oneToOne',
      'api::color.color'
    > &
      Attribute.Required;
    stock_por_tallas: Attribute.Component<'productos.stock-por-tallas', true>;
  };
}

export interface ProductosStockPorTallas extends Schema.Component {
  collectionName: 'components_productos_stock_por_tallas';
  info: {
    description: 'Cantidad espec\u00EDfica por talla dentro de un color';
    displayName: 'Stock por Tallas';
  };
  attributes: {
    cantidad: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    talla: Attribute.Relation<
      'productos.stock-por-tallas',
      'oneToOne',
      'api::talla.talla'
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
      'productos.stock-por-tallas': ProductosStockPorTallas;
    }
  }
}
