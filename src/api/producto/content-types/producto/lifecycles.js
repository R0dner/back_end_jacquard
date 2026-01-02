module.exports = {
  // Validaciones antes de crear
  async beforeCreate(event) {
    const { data } = event.params;
    
    // Validar código
    if (data.codigo) {
      // Convertir a mayúsculas
      data.codigo = data.codigo.toUpperCase().trim();
      
      // Validar formato (solo letras mayúsculas, números y guiones)
      const codigoRegex = /^[A-Z0-9-]+$/;
      if (!codigoRegex.test(data.codigo)) {
        throw new Error('El código solo puede contener letras mayúsculas, números y guiones. Ejemplo: PROD-001, CAM-2024');
      }
      
      // Validar longitud
      if (data.codigo.length < 3 || data.codigo.length > 20) {
        throw new Error('El código debe tener entre 3 y 20 caracteres');
      }
      
      // Verificar que no empiece con "producto"
      if (data.codigo.toLowerCase().startsWith('producto')) {
        throw new Error('El código no puede comenzar con la palabra "producto"');
      }
    }
    
    // Validar nombre
    if (data.nombre) {
      data.nombre = data.nombre.trim();
      if (data.nombre.length < 3) {
        throw new Error('El nombre debe tener al menos 3 caracteres');
      }
      if (data.nombre.length > 100) {
        throw new Error('El nombre no puede exceder 100 caracteres');
      }
    }
    
    // Validar descripción
    if (data.descripcion) {
      data.descripcion = data.descripcion.trim();
      if (data.descripcion.length < 10) {
        throw new Error('La descripción debe tener al menos 10 caracteres');
      }
      if (data.descripcion.length > 500) {
        throw new Error('La descripción no puede exceder 500 caracteres');
      }
    }
    
    // Validar valoración
    if (data.valoracion !== undefined && data.valoracion !== null) {
      if (data.valoracion < 0 || data.valoracion > 5) {
        throw new Error('La valoración debe estar entre 0 y 5');
      }
    }
  },
  
  // Validaciones antes de actualizar
  async beforeUpdate(event) {
    const { data } = event.params;
    
    // Validar código si se está modificando
    if (data.codigo !== undefined) {
      data.codigo = data.codigo.toUpperCase().trim();
      
      const codigoRegex = /^[A-Z0-9-]+$/;
      if (!codigoRegex.test(data.codigo)) {
        throw new Error('El código solo puede contener letras mayúsculas, números y guiones. Ejemplo: PROD-001, CAM-2024');
      }
      
      if (data.codigo.length < 3 || data.codigo.length > 20) {
        throw new Error('El código debe tener entre 3 y 20 caracteres');
      }
      
      if (data.codigo.toLowerCase().startsWith('producto')) {
        throw new Error('El código no puede comenzar con la palabra "producto"');
      }
    }
    
    // Validar nombre si se está modificando
    if (data.nombre !== undefined) {
      data.nombre = data.nombre.trim();
      if (data.nombre.length < 3 || data.nombre.length > 100) {
        throw new Error('El nombre debe tener entre 3 y 100 caracteres');
      }
    }
    
    // Validar descripción si se está modificando
    if (data.descripcion !== undefined) {
      data.descripcion = data.descripcion.trim();
      if (data.descripcion.length < 10 || data.descripcion.length > 500) {
        throw new Error('La descripción debe tener entre 10 y 500 caracteres');
      }
    }
    
    // Validar valoración
    if (data.valoracion !== undefined && data.valoracion !== null) {
      if (data.valoracion < 0 || data.valoracion > 5) {
        throw new Error('La valoración debe estar entre 0 y 5');
      }
    }
  }
};