// ==========================================
//  C🌍in - Renderizador de Recomendaciones (CORREGIDO)
// ==========================================

import { 
  formatearUSD, getEmojiRecomendacion, calcularEngagementPromedio, 
  calcularPrecioVenta, obtenerRecomendacionMes 
} from '../core.js';

// Funciones auxiliares de cálculo
function calcularRotacion(p) {
  const dias = Math.max(1, (Date.now() - new Date(p.fechaLlegada).getTime()) / (1000 * 60 * 60 * 24));
  return (p.totalVendido || 0) / dias * 30;
}

function calcularTasaConversion(p) {
  const totalPreguntas = Array.isArray(p.preguntasRegistradas) 
    ? p.preguntasRegistradas.reduce((s, r) => s + r.cantidad, 0) 
    : (p.preguntasRegistradas || 0);
  return totalPreguntas > 0 ? ((p.totalVendido || 0) / totalPreguntas) * 100 : 0;
}

function calcularFrecuenciaVentas(p) {
  const ventas = Array.isArray(p.ventasRegistradas) ? p.ventasRegistradas : [];
  if (ventas.length < 2) return 0;
  const fechas = ventas.map(v => new Date(v.fecha)).sort((a, b) => a - b);
  let sumaDiferencia = 0;
  for (let i = 1; i < fechas.length; i++) {
    sumaDiferencia += (fechas[i] - fechas[i-1]) / (1000 * 60 * 60 * 24);
  }
  return sumaDiferencia / (fechas.length - 1);
}

function calcularPrioridad(p) {
  const rotacion = calcularRotacion(p);
  const engagement = calcularEngagementPromedio(p.interacciones || {});
  const tasaConversion = calcularTasaConversion(p);
  const frecuencia = calcularFrecuenciaVentas(p);
  // Usar la función importada de core
  return window.calcularIndicePrioridad ? window.calcularIndicePrioridad(p.costoUnitarioTotal, rotacion, engagement, tasaConversion, frecuencia) : { indice: 0, recomendacion: 'SIN DATOS' };
}

export function renderizarRecomendaciones(productos, filtro = 'todos') {
  if (!productos || productos.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>No hay productos aún. Ve a "Registro" para crear tu primer lote.</p>
      </div>
    `;
  }

  // Filtrar
  let productosFiltrados = productos;
  if (filtro === 'traer-mas') {
    productosFiltrados = productos.filter(p => {
      const prioridad = calcularPrioridad(p);
      return prioridad.recomendacion && prioridad.recomendacion.includes('TRAER MÁS');
    });
  } else if (filtro === 'mantener') {
    productosFiltrados = productos.filter(p => {
      const prioridad = calcularPrioridad(p);
      return prioridad.recomendacion && prioridad.recomendacion.includes('MANTENER');
    });
  } else if (filtro === 'dejar') {
    productosFiltrados = productos.filter(p => {
      const prioridad = calcularPrioridad(p);
      return prioridad.recomendacion && prioridad.recomendacion.includes('DEJAR');
    });
  }

  if (productosFiltrados.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>${productos.length === 0 ? 'No hay productos aún.' : 'No hay productos con este filtro.'}</p>
      </div>
    `;
  }

  let html = '';
  productosFiltrados.forEach(p => {
    // === VALORES POR DEFECTO PARA EVITAR "undefined" ===
    const nombre = p.nombre || 'Sin nombre';
    const sku = p.sku || '---';
    const atributo = p.atributo || '';
    const costoUnitario = p.costoUnitarioTotal || 0;
    const margenGanancia = p.margenGanancia || 40;
    const cantidadImportada = p.cantidadImportada || 0;
    const totalVendido = p.totalVendido || 0;
    const precioVentaSugerido = p.precioVentaSugerido || 0;
    const ventasRegistradas = Array.isArray(p.ventasRegistradas) ? p.ventasRegistradas : [];
    const preguntasRegistradas = Array.isArray(p.preguntasRegistradas) ? p.preguntasRegistradas : [];
    const competidores = Array.isArray(p.competidores) ? p.competidores : [];
    const interacciones = p.interacciones || { instagram: {}, tiktok: {}, marketplace: {} };
    
    const prioridad = calcularPrioridad(p);
    const precioData = calcularPrecioVenta(costoUnitario, 'porcentaje', margenGanancia);
    const emoji = getEmojiRecomendacion(prioridad.recomendacion || '');
    const colorPrioridad = prioridad.indice > 70 ? '#2ecc71' : (prioridad.indice > 40 ? '#f1c40f' : '#e74c3c');
    
    // Punto de equilibrio
    const costoTotalInvertido = costoUnitario * cantidadImportada;
    const margenUnitario = precioVentaSugerido - costoUnitario;
    let puntoEquilibrio = 0, estadoInversion = '', textoEquilibrio = '';
    if (margenUnitario > 0) {
      puntoEquilibrio = Math.ceil(costoTotalInvertido / margenUnitario);
      if (totalVendido >= puntoEquilibrio) {
        estadoInversion = '✅ Inversión recuperada';
        textoEquilibrio = `(${totalVendido}/${puntoEquilibrio} vendidas)`;
      } else {
        const faltan = puntoEquilibrio - totalVendido;
        estadoInversion = `❌ Faltan ${faltan} ventas`;
        textoEquilibrio = `(${totalVendido}/${puntoEquilibrio} vendidas)`;
      }
    } else {
      puntoEquilibrio = Infinity;
      estadoInversion = '⚠️ Margen negativo';
      textoEquilibrio = 'No se puede recuperar';
    }

    // Frecuencia de ventas
    let frecuenciaVentas = 0, ultimaVenta = null;
    if (ventasRegistradas.length > 1) {
      const fechas = ventasRegistradas.map(v => new Date(v.fecha)).sort((a, b) => a - b);
      let sumaDiferencia = 0;
      for (let i = 1; i < fechas.length; i++) {
        sumaDiferencia += (fechas[i] - fechas[i-1]) / (1000 * 60 * 60 * 24);
      }
      frecuenciaVentas = sumaDiferencia / (fechas.length - 1);
      ultimaVenta = fechas[fechas.length - 1];
    } else if (ventasRegistradas.length === 1) {
      frecuenciaVentas = 0;
      ultimaVenta = new Date(ventasRegistradas[0].fecha);
    }

    // Competencia
    let precioPromCompetencia = 0, cantidadCompetidores = competidores.length, esCompetitivo = false, recomendacionPrecio = '';
    if (cantidadCompetidores > 0) {
      const sumaPrecios = competidores.reduce((sum, c) => sum + (c.precio || 0), 0);
      precioPromCompetencia = sumaPrecios / cantidadCompetidores;
      const diferenciaPrecio = precioVentaSugerido - precioPromCompetencia;
      esCompetitivo = precioVentaSugerido <= precioPromCompetencia * 1.05;
      recomendacionPrecio = esCompetitivo ? '✅ Precio competitivo' : `⚠️ ${Math.round((diferenciaPrecio / precioPromCompetencia) * 100)}% más caro`;
    } else {
      recomendacionPrecio = '📊 Sin competidores';
    }

    // Estacionalidad
    const estacionalidad = obtenerRecomendacionMes(p);
    let htmlEstacionalidad = '';
    if (estacionalidad && estacionalidad.mejor) {
      htmlEstacionalidad = `
        <div style="grid-column: 1 / -1; background: var(--glass-bg); padding: 4px 12px; border-radius: 8px; border: 1px solid var(--border-color); margin-top: 4px;">
          <span style="font-size: 0.7rem; color: var(--text-secondary);">📅 Mejor mes: <strong style="color: var(--gold);">${estacionalidad.mejor.nombre}</strong> (${estacionalidad.mejor.puntaje} pts) · Peor: ${estacionalidad.peor ? estacionalidad.peor.nombre : 'N/A'}</span>
        </div>
      `;
    }

    // === GENERAR HTML CON VALORES SEGUROS ===
    html += `
      <div class="product-item" data-id="${p.id || ''}">
        <div class="product-header">
          <h3>
            ${emoji} ${nombre}
            <span class="sku">SKU: ${sku}</span>
            ${atributo ? `<span style="font-size:0.8rem;color:var(--text-secondary);">(${atributo})</span>` : ''}
          </h3>
          <span class="recomendacion" style="color:${colorPrioridad};">
            ${prioridad.recomendacion || 'SIN DATOS'} (${prioridad.indice || 0} pts)
          </span>
        </div>
        <div class="metric"><span class="label">💰 Costo unitario</span><span class="value">${formatearUSD(costoUnitario)}</span></div>
        <div class="metric"><span class="label">🏷️ Precio venta</span><span class="value">${formatearUSD(precioData.precioVenta)} <span class="small">(${margenGanancia}% margen)</span></span></div>
        <div class="metric"><span class="label">📦 Rotación mensual</span><span class="value">${calcularRotacion(p).toFixed(1)} <span class="small">und/mes</span></span></div>
        <div class="metric"><span class="label">📱 Engagement</span><span class="value">${calcularEngagementPromedio(interacciones).toFixed(2)}%</span></div>
        <div class="metric"><span class="label">🗣️ Conversión</span><span class="value">${calcularTasaConversion(p).toFixed(1)}%</span></div>
        <div class="metric"><span class="label">📊 Prioridad</span><span class="value" style="color:${colorPrioridad};">${prioridad.indice || 0}/100</span></div>
        <div class="metric" style="grid-column: 1 / -1; background: var(--glass-bg); padding: 8px 12px; border-radius: 8px; margin-top: 4px; border: 1px solid var(--border-color);">
          <span class="label">⏱️ Frecuencia de ventas</span>
          <span class="value" style="font-size: 0.95rem;">
            ${ventasRegistradas.length === 0 ? 'Sin ventas aún' : 
              frecuenciaVentas === 0 ? 'Primera venta registrada' :
              `Cada ${frecuenciaVentas.toFixed(1)} días en promedio`}
            <span class="small" style="display: block; font-size: 0.8rem; color: var(--text-secondary);">
              ${ventasRegistradas.length} venta(s) registrada(s) 
              ${ultimaVenta ? `· Última: ${ultimaVenta.toLocaleDateString('es-ES')}` : ''}
            </span>
          </span>
        </div>
        <div class="metric" style="grid-column: 1 / -1; background: var(--glass-bg); padding: 8px 12px; border-radius: 8px; margin-top: 4px; border: 1px solid var(--border-color);">
          <span class="label">🎯 Punto de equilibrio</span>
          <span class="value" style="font-size: 0.95rem;">
            ${puntoEquilibrio === Infinity ? '⚠️ No calculable' : `${puntoEquilibrio} unidades`}
            <span class="small" style="display: block; font-size: 0.8rem; color: ${estadoInversion.includes('recuperada') ? '#2ecc71' : '#e74c3c'};">
              ${estadoInversion} ${textoEquilibrio}
            </span>
          </span>
        </div>
        <div class="metric" style="grid-column: 1 / -1; background: var(--glass-bg); padding: 8px 12px; border-radius: 8px; margin-top: 4px; border: 1px solid var(--border-color);">
          <span class="label">🏪 Competencia (${cantidadCompetidores} registrados)</span>
          <span class="value" style="font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span>
              Promedio: ${cantidadCompetidores > 0 ? formatearUSD(precioPromCompetencia) : 'Sin datos'}
              ${cantidadCompetidores > 0 ? `<span style="color: ${esCompetitivo ? '#2ecc71' : '#e74c3c'}; font-size: 0.8rem;"> ${recomendacionPrecio}</span>` : ''}
            </span>
            <button class="btn btn-small" onclick="window.mostrarModalCompetencia('${p.id || ''}')">
              <i class="fas fa-plus"></i> Agregar
            </button>
          </span>
          ${competidores.length > 0 ? `
            <div style="margin-top: 6px; font-size: 0.75rem; color: var(--text-secondary);">
              ${competidores.slice(-3).map(c => `${c.nombre || 'N/A'}: ${formatearUSD(c.precio || 0)} (${c.plataforma || 'N/A'})`).join(' • ')}
              ${competidores.length > 3 ? `... +${competidores.length - 3} más` : ''}
            </div>
          ` : ''}
        </div>
        ${htmlEstacionalidad}
        <div class="product-actions">
          <button class="btn-small" onclick="window.mostrarModalVenta('${p.id || ''}')"><i class="fas fa-shopping-cart"></i> Vender</button>
          <button class="btn-small" onclick="window.mostrarModalPregunta('${p.id || ''}')"><i class="fas fa-question-circle"></i> Preguntaron</button>
          <button class="btn-small" onclick="window.mostrarModalRedes('${p.id || ''}')"><i class="fas fa-share-alt"></i> Redes</button>
          <button class="btn-small" onclick="window.eliminarProducto('${p.id || ''}')" style="color:#e74c3c;"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  });

  return html;
}
