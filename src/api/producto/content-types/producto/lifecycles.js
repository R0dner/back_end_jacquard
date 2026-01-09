// Catálogo de categorías permitidas (fuera del export)
const CATEGORIAS_PERMITIDAS = {
  'ABR': 'ABRIGO',
  'BUF': 'BUFANDAS',
  'CAM': 'CAMISA',
  'CRD': 'CARDIGANS',
  'CHL': 'CHALECOS',
  'CHP': 'CHOMPAS',
  'PON': 'PONCHITOS',
  'CUE': 'CUELLERAS',
  'FLD': 'FALDAS',
  'GOR': 'GORRITOS',
  'BOI': 'BOINAS'
};

// Géneros permitidos
const GENEROS_PERMITIDOS = ['VR', 'MJ', 'NÑ', 'UN']; // VR=Varón, MJ=Mujer, NÑ=Niño, UN=Unisex

/**
 * Valida el formato del código del producto
 * Formato esperado: JTX-CHL-VR-100
 */
function validarCodigo(codigo) {
  // Convertir a mayúsculas y limpiar
  codigo = codigo.toUpperCase().trim();

  // Si no empieza con JTX-, agregarlo automáticamente
  if (!codigo.startsWith('JTX-')) {
    // Si el usuario escribió algo como "CHL-VR-100", agregamos "JTX-"
    codigo = 'JTX-' + codigo;
  }

  // Validar longitud (11-15 caracteres)
  if (codigo.length < 11 || codigo.length > 15) {
    throw new Error('El código debe tener entre 11 y 15 caracteres. Formato: JTX-CAT-GEN-NUM');
  }

  // Validar formato general con regex
  const formatoRegex = /^JTX-[A-Z]{3}-[A-Z]{2}-\d{1,3}$/;
  if (!formatoRegex.test(codigo)) {
    throw new Error(
      'Formato de código inválido. Debe ser: JTX-CATEGORÍA-GÉNERO-NÚMERO\n' +
      'Ejemplo: JTX-CHL-VR-100 o solo CHL-VR-100 (se agregará JTX- automáticamente)'
    );
  }

  // Separar las partes del código
  const partes = codigo.split('-');
  const [prefijo, categoria, genero, numero] = partes;

  // Validar prefijo (siempre debe ser JTX)
  if (prefijo !== 'JTX') {
    throw new Error('El código debe iniciar obligatoriamente con "JTX-"');
  }

  // Validar categoría
  if (!CATEGORIAS_PERMITIDAS[categoria]) {
    const categoriasDisponibles = Object.keys(CATEGORIAS_PERMITIDAS).join(', ');
    throw new Error(
      `Categoría inválida: "${categoria}"\n` +
      `Categorías permitidas: ${categoriasDisponibles}\n` +
      `Ejemplo: JTX-CHL-VR-100 (Chalecos)`
    );
  }

  // Validar género
  if (!GENEROS_PERMITIDOS.includes(genero)) {
    const generosDisponibles = GENEROS_PERMITIDOS.join(', ');
    throw new Error(
      `Género inválido: "${genero}"\n` +
      `Géneros permitidos: ${generosDisponibles}`
    );
  }

  // Validar número
  const num = parseInt(numero, 10);
  if (num < 1 || num > 999) {
    throw new Error('El número del código debe estar entre 1 y 999');
  }

  return codigo;
}

module.exports = {
  // Validaciones antes de crear
  async beforeCreate(event) {
    const { data } = event.params;
    
    // Validar código
    if (data.codigo) {
      try {
        data.codigo = validarCodigo(data.codigo);
      } catch (error) {
        throw new Error(`Error en el código: ${error.message}`);
      }
    } else {
      throw new Error('El código es obligatorio');
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
      try {
        data.codigo = validarCodigo(data.codigo);
      } catch (error) {
        throw new Error(`Error en el código: ${error.message}`);
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