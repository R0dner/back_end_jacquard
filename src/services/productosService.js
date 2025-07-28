// src/services/productosService.js
import axios from 'axios';

const apiUrl = process.env.VUE_APP_STRAPI_URL || 'https://delicate-attraction-2c7f961647.strapiapp.com';

export default {
  // Obtener todos los productos con posibles filtros
  async getProductos(filters = {}) {
    try {
      // Construir parámetros de consulta para filtros
      let queryString = '?populate=*'; // Incluir relaciones y medios
      
      // Añadir filtros si existen
      if (Object.keys(filters).length > 0) {
        for (const [key, value] of Object.entries(filters)) {
          queryString += `&filters[${key}][$eq]=${value}`;
        }
      }
      
      const response = await axios.get(`${apiUrl}/api/productos${queryString}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  },
  
  // Obtener un producto específico por ID
  async getProducto(id) {
    try {
      const response = await axios.get(`${apiUrl}/api/productos/${id}?populate=*`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener producto:', error);
      throw error;
    }
  },
  
  // Obtener productos en oferta
  async getProductosEnOferta() {
    try {
      const response = await axios.get(`${apiUrl}/api/productos?filters[en_oferta][$eq]=true&populate=*`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener productos en oferta:', error);
      throw error;
    }
  },
  
  // Obtener productos relacionados con un grupo
  async getProductosPorGrupo(grupoId) {
    try {
      const response = await axios.get(`${apiUrl}/api/productos?filters[grupo_de_productos][id][$eq]=${grupoId}&populate=*`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener productos por grupo:', error);
      throw error;
    }
  },
  
  // Obtener productos por color
  async getProductosPorColor(colorId) {
    try {
      const response = await axios.get(`${apiUrl}/api/productos?filters[color][id][$eq]=${colorId}&populate=*`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener productos por color:', error);
      throw error;
    }
  },
  
  // Obtener productos por talla
  async getProductosPorTalla(tallaId) {
    try {
      const response = await axios.get(`${apiUrl}/api/productos?filters[talla][id][$eq]=${tallaId}&populate=*`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener productos por talla:', error);
      throw error;
    }
  },
  
  // Buscar productos por nombre o descripción
  async buscarProductos(termino) {
    try {
      const response = await axios.get(`${apiUrl}/api/productos?filters[$or][0][nombre][$containsi]=${termino}&filters[$or][1][descripcion][$containsi]=${termino}&populate=*`);
      return response.data.data;
    } catch (error) {
      console.error('Error al buscar productos:', error);
      throw error;
    }
  }
};