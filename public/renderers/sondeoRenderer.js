// ==========================================
//  C🌍in - Renderizador de Sondeo
// ==========================================

import { formatearUSD, calcularEngagementPromedio, obtenerRecomendacionMes } from '../core.js';

// Función auxiliar para calcular puntaje de interés
function calcularPuntajeInteres(sondeo) {
  const engagement = calcularEngagementPromedio(sondeo.interacciones || {});
  const preguntas = sondeo.preguntas || 0;
  const competidores = sondeo.competidores || 0;
  
  let puntaje = 0;
  puntaje += Math.min(engagement * 3, 30);
  puntaje += Math.min(preguntas * 5, 40);
  puntaje += Math.max(0, 30 - competidores * 2);
  
  let rentabilidad = 0, mensaje = '', recomendacion = 'evaluar';
  if (sondeo.costosEstimados > 0 && sondeo.precioEstimado > 0) {
    const margen = sondeo.precioEstimado - sondeo.costosEstimados;
    rentabilidad = margen * (puntaje / 100);
    if (puntaje >= 70 && margen > 0) {
      recomendacion = 'recomendado';
      mensaje = 'Alta demanda y buen margen ✅';
    } else if (puntaje >= 40 && margen > 0) {
      recomendacion = 'evaluar';
      mensaje = 'Interés moderado, evaluar precios ⚠️';
    } else {
      recomendacion = 'descartado';
      mensaje = 'Bajo interés o margen insuficiente ❌';
    }
  } else {
    if (puntaje >= 70) {
      recomendacion = 'recomendado';
      mensaje = 'Alta demanda, estima costos ✅';
    } else if (puntaje >= 40) {
      recomendacion = 'evaluar';
      mensaje = 'Interés moderado ⚠️';
    } else {
      recomendacion = 'descartado';
      mensaje = 'Bajo interés ❌';
    }
  }
  return { puntaje: Math.min(100, Math.round(puntaje)), recomendacion, rentabilidad, mensaje };
}

export function renderizarSondeos(sondeos) {
  if (!sondeos || sondeos.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>No hay productos en sondeo. Agrega uno para comenzar a validar el mercado.</p>
      </div>
    `;
  }

  // Calcular estadísticas
  let recomendados = 0, evaluar = 0, descartar = 0;
  sondeos.forEach(s => {
    const puntaje = calcularPuntajeInteres(s);
    if (puntaje.recomendacion === 'recomendado') recomendados++;
    else if (puntaje.recomendacion === 'evaluar') evaluar++;
    else descartar++;
  });

  let html = `
    <div style="display:flex; gap:16px; flex-wrap:wrap; margin-bottom:16px; padding:12px 16px; background:var(--glass-bg); border-radius:12px; border:1px solid var(--border-color);">
      <div><span style="color:var(--text-secondary);font-size:0.7rem;">En evaluación</span><br><span style="font-weight:700;">${sondeos.length}</span></div>
      <div><span style="color:var(--text-secondary);font-size:0.7rem;">✅ Recomendados</span><br><span style="font-weight:700; color:#2ecc71;">${recomendados}</span></div>
      <div><span style="color:var(--text-secondary);font-size:0.7rem;">⚠️ Evaluar</span><br><span style="font-weight:700; color:#f1c40f;">${evaluar}</span></div>
      <div><span style="color:var(--text-secondary);font-size:0.7rem;">❌ Descartar</span><br><span style="font-weight:700; color:#e74c3c;">${descartar}</span></div>
    </div>
  `;

  sondeos.forEach(s => {
    const puntaje = calcularPuntajeInteres(s);
    const color = puntaje.recomendacion === 'recomendado' ? '#2ecc71' : 
                  (puntaje.recomendacion === 'evaluar' ? '#f1c40f' : '#e74c3c');
    const emoji = puntaje.recomendacion === 'recomendado' ? '✅' : 
                  (puntaje.recomendacion === 'evaluar' ? '⚠️' : '❌');
    const engagement = calcularEngagementPromedio(s.interacciones || {});
    
    const historial = s.historial || [];
    let historialHTML = '';
    if (historial.length > 0) {
      const ultimos = historial.slice(-5).reverse();
      historialHTML = `
        <div style="grid-column:1/-1; margin-top:4px; padding:8px 12px; background:var(--glass-bg); border-radius:8px; border:1px solid var(--border-color);">
          <span class="label" style="font-size:0.7rem;">📅 Historial (últimos días)</span>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:4px; font-size:0.75rem;">
            ${ultimos.map(r => {
              const fecha = new Date(r.fecha + 'T00:00:00');
              const hoy = new Date();
              const esHoy = fecha.toDateString() === hoy.toDateString();
              const label = esHoy ? 'Hoy' : fecha.toLocaleDateString('es-ES', { day:'2-digit', month:'short' });
              return `<span style="background:var(--bg-input); padding:2px 10px; border-radius:30px; border:1px solid var(--border-color);">
                <strong>${label}</strong>: ${r.vistas} 👁️ · ${r.preguntas} 🗣️
              </span>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    const estacionalidad = obtenerRecomendacionMes(s);
    let htmlEstacionalidad = '';
    if (estacionalidad.mejor) {
      htmlEstacionalidad = `
        <div style="grid-column:1/-1; background:var(--glass-bg); padding:4px 12px; border-radius:8px; border:1px solid var(--border-color); margin-top:4px;">
          <span style="font-size:0.7rem; color:var(--text-secondary);">📅 Mejor mes: <strong style="color:var(--gold);">${estacionalidad.mejor.nombre}</strong> (${estacionalidad.mejor.puntaje} pts)</span>
        </div>
      `;
    }

    html += `
      <div class="product-item sondeo-item" data-id="${s.id}" style="border-left-color: ${color};">
        <div class="product-header">
          <h3>${emoji} ${s.nombre}<span class="sku" style="font-size:0.7rem;">ID: ${s.id.substring(0,6)}</span></h3>
          <span class="recomendacion" style="color:${color};">${puntaje.recomendacion.toUpperCase()} (${puntaje.puntaje} pts)</span>
        </div>
        <div class="metric"><span class="label">💰 Precio estimado</span><span class="value">${formatearUSD(s.precioEstimado)}</span></div>
        <div class="metric"><span class="label">📦 Costos estimados</span><span class="value">${formatearUSD(s.costosEstimados)}</span></div>
        <div class="metric"><span class="label">📱 Engagement</span><span class="value">${engagement.toFixed(2)}%</span></div>
        <div class="metric"><span class="label">🗣️ Preguntas</span><span class="value">${s.preguntas}</span></div>
        <div class="metric" style="grid-column:1/-1;">
          <span class="label">🎯 Rentabilidad estimada</span>
          <span class="value" style="font-size:0.95rem;">
            ${puntaje.rentabilidad !== undefined ? formatearUSD(puntaje.rentabilidad) : 'No calculable'}
            <span class="small" style="display:block; font-size:0.8rem; color:${color};">${puntaje.mensaje || ''}</span>
          </span>
        </div>
        ${historialHTML}
        ${htmlEstacionalidad}
        ${s.descripcion ? `<div style="grid-column:1/-1; font-size:0.8rem; color:var(--text-secondary); border-top:1px solid var(--border-color); padding-top:8px;">📝 ${s.descripcion}</div>` : ''}
        <div class="product-actions">
          <button class="btn-small" onclick="window.mostrarModalSondeoRedes('${s.id}')"><i class="fas fa-share-alt"></i> Redes</button>
          <button class="btn-small" onclick="window.registrarPreguntaSondeo('${s.id}')"><i class="fas fa-question-circle"></i> + Pregunta</button>
          <button class="btn-small" onclick="window.mostrarModalRegistroDiario('${s.id}')" style="color:var(--electric-blue);"><i class="fas fa-calendar-plus"></i> Registrar día</button>
          <button class="btn-small" onclick="window.moverSondeoAProducto('${s.id}')" style="color:var(--gold);"><i class="fas fa-box"></i> Importar</button>
          <button class="btn-small" onclick="window.eliminarSondeo('${s.id}')" style="color:#e74c3c;"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  });

  return html;
}
