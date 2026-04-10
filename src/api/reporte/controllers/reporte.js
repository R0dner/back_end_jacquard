'use strict'

module.exports = {

  // GET /api/reportes/usuarios
  // Devuelve lista de usuarios admin para el filtro
  async getUsuarios(ctx) {
    try {
      const adminUsers = await strapi.db.query('admin::user').findMany({
        select: ['id', 'firstname', 'lastname', 'email', 'username'],
        where: { isActive: true },
        orderBy: { firstname: 'asc' },
      })

      ctx.body = { data: adminUsers }
    } catch (err) {
      ctx.throw(500, err)
    }
  },

  // GET /api/reportes/movimientos
  // Devuelve ingresos y salidas con el usuario admin populado
  async getMovimientos(ctx) {
    try {
      const {
        usuario_id,
        tipo,
        fecha_desde,
        fecha_hasta,
        estado,
      } = ctx.query

      const resultado = []

      // ── INGRESOS ──────────────────────────────────────────────
      if (tipo !== 'salidas') {
        const whereIngreso = {}

        if (estado) whereIngreso.estado = estado
        if (fecha_desde || fecha_hasta) {
          whereIngreso.fecha_ingreso = {}
          if (fecha_desde) whereIngreso.fecha_ingreso.$gte = fecha_desde
          if (fecha_hasta) whereIngreso.fecha_ingreso.$lte = fecha_hasta
        }
        if (usuario_id) {
          whereIngreso.ingresado_por = { id: Number(usuario_id) }
        }

        const ingresos = await strapi.db.query('api::ingreso.ingreso').findMany({
          where: whereIngreso,
          populate: ['Productos'],
          orderBy: { fecha_ingreso: 'desc' },
          limit: 500,
        })

        // Popular manualmente el usuario admin
        for (const ing of ingresos) {
          let usuarioNombre = '-'
          if (ing.ingresado_por) {
            const adminUser = await strapi.db.query('admin::user').findOne({
              where: { id: ing.ingresado_por },
              select: ['id', 'firstname', 'lastname', 'email'],
            })
            if (adminUser) {
              usuarioNombre = `${adminUser.firstname || ''} ${adminUser.lastname || ''}`.trim()
            }
          }

          resultado.push({
            id: ing.id,
            tipo: 'Ingreso',
            fecha: ing.fecha_ingreso,
            descripcion: ing.tipo_ingreso || '-',
            usuario: usuarioNombre,
            usuario_id: ing.ingresado_por || null,
            estado: ing.estado || '-',
            total_items: ing.total_items,
            total_costo: ing.total_costo,
            numero_documento: ing.numero_factura || null,
          })
        }
      }

      // ── SALIDAS ───────────────────────────────────────────────
      if (tipo !== 'ingresos') {
        const whereSalida = {}

        if (estado) whereSalida.estado = estado
        if (fecha_desde || fecha_hasta) {
          whereSalida.fecha_salida = {}
          if (fecha_desde) whereSalida.fecha_salida.$gte = fecha_desde
          if (fecha_hasta) whereSalida.fecha_salida.$lte = fecha_hasta
        }
        if (usuario_id) {
          whereSalida.solicitado_por = { id: Number(usuario_id) }
        }

        const salidas = await strapi.db.query('api::salida.salida').findMany({
          where: whereSalida,
          populate: ['Productos'],
          orderBy: { fecha_salida: 'desc' },
          limit: 500,
        })

        for (const sal of salidas) {
          let usuarioNombre = '-'
          if (sal.solicitado_por) {
            const adminUser = await strapi.db.query('admin::user').findOne({
              where: { id: sal.solicitado_por },
              select: ['id', 'firstname', 'lastname', 'email'],
            })
            if (adminUser) {
              usuarioNombre = `${adminUser.firstname || ''} ${adminUser.lastname || ''}`.trim()
            }
          }

          resultado.push({
            id: sal.id,
            tipo: 'Salida',
            fecha: sal.fecha_salida,
            descripcion: sal.tipo_solicitud || '-',
            usuario: usuarioNombre,
            usuario_id: sal.solicitado_por || null,
            estado: sal.estado || '-',
            total_items: sal.total_items,
            total_costo: null,
            numero_documento: sal.numero_documento || null,
          })
        }
      }

      // Ordenar por fecha descendente
      resultado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

      ctx.body = { data: resultado }
    } catch (err) {
      ctx.throw(500, err)
    }
  },
}