// ==========================================
//  C🌍in - Renderizador de Estacionalidad
// ==========================================

import { obtenerRecomendacionMes, formatearUSD } from '../core.js';

export function renderizarEstacionalidad(productos, sondeos, filtro = 'todos') {
  // Recolectar todos los objetos
  let items = [];
  if (filtro === 'todos' || filtro === 'productos') {
    items = items.concat(productos.map(p => ({ ...p, tipo: 'producto' })));
  }
  if (filtro === 'todos' || filtro === 'sondeos') {
    items = items.concat(sondeos.map(s => ({ ...s, tipo: 'sondeo' })));
  }

  // Filtrar los que tienen datos de estacionalidad
  const conDatos = items.filter(item => {
    const est = item.estacionalidad || {};
    return Object.values(est).some(m => m.ventas > 0 || m.preguntas > 0 || m.interacciones > 0);
  });

  if (conDatos.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-calendar"></i>
        <p>No hay datos de estacionalidad. Registra ventas, preguntas o interacciones para empezar.</p>
      </div>
    `;
  }

  // Calcular mes más popular global
  const globalMeses = {};
  conDatos.forEach(item => {
    if (item.estacionalidad) {
      Object.entries(item.estacionalidad).forEach(([mes, datos]) => {
        if (!globalMeses[mes]) globalMeses[mes] = 0;
        globalMeses[mes] += (datos.ventas || 0) * 3 + (datos.preguntas || 0) * 2 + (datos.interacciones || 0);
      });
    }
  });
  const sortedMeses = Object.entries(globalMeses).sort((a, b) => b[1] - a[1]);
  const mesesNombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const mesPopular = sortedMeses.length > 0 ? `${mesesNombres[parseInt(sortedMeses[0][0]) - 1]} (${sortedMeses[0][1]} pts)` : '-';

  // HTML de resumen
  let html = `
    <div style="display:flex; gap:16px; flex-wrap:wrap; margin-bottom:16px; padding:12px 16px; background:var(--glass-bg); border-radius:12px; border:1px solid var(--border-color);">
      <div><span style="color:var(--text-secondary);font-size:0.7rem;">Productos con datos</span><br><span style="font-weight:700;">${conDatos.filter(i => i.tipo === 'producto').length}</span></div>
      <div><span style="color:var(--text-secondary);font-size:0.7rem;">Sondeos con datos</span><br><span style="font-weight:700;">${conDatos.filter(i => i.tipo === 'sondeo').length}</span></div>
      <div><span style="color:var(--text-secondary);font-size:0.7rem;">Mes más popular</span><br><span style="font-weight:700; color:var(--gold);">${mesPopular}</span></div>
    </div>
  `;

  // Tarjetas individuales
  conDatos.forEach(item => {
    const est = obtenerRecomendacionMes(item);
    const tipoEmoji = item.tipo === 'producto' ? '📦' : '🔍';
    const nombre = item.nombre || 'Sin nombre';
    
    // Mini gráfico de barras
    let barras = '';
    if (item.estacionalidad) {
      const max = Math.max(...Object.values(item.estacionalidad).map(m => (m.ventas || 0) * 3 + (m.preguntas || 0) * 2 + (m.interacciones || 0) || 1));
      barras = Object.entries(item.estacionalidad).map(([mes, datos]) => {
        const total = (datos.ventas || 0) * 3 + (datos.preguntas || 0) * 2 + (datos.interacciones || 0);
        const altura = Math.max(4, (total / max) * 40);
        const esMejor = est.mejor && parseInt(mes) === est.mejor.mes;
        return `<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px;">
          <div style="background:${esMejor ? 'var(--gold)' : 'var(--border-color)'}; width:100%; height:${altura}px; border-radius:4px 4px 0 0; transition:0.3s;"></div>
          <span style="font-size:0.5rem; color:var(--text-secondary);">${mes}</span>
        </div>`;
      }).join('');
    }

    html += `
      <div class="inventario-item" style="border-left:4px solid ${est.mejor ? 'var(--gold)' : 'var(--border-color)'};">
        <div class="inventario-header">
          <h3>${tipoEmoji} ${nombre} <span style="font-size:0.7rem;color:var(--text-secondary);">(${item.tipo})</span></h3>
          <span class="badge">${est.mejor ? `Mejor: ${est.mejor.nombre}` : 'Sin datos'}</span>
        </div>
        <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:0.85rem; margin-bottom:8px;">
          <span>🟢 Mejor mes: <strong>${est.mejor ? est.mejor.nombre : 'N/A'}</strong> (${est.mejor ? est.mejor.puntaje : 0} pts)</span>
          <span>🔴 Peor mes: <strong>${est.peor ? est.peor.nombre : 'N/A'}</strong> (${est.peor ? est.peor.puntaje : 0} pts)</span>
        </div>
        <div style="display:flex; gap:4px; align-items:flex-end; height:50px; padding-top:6px; border-top:1px solid var(--border-color);">
          ${barras}
        </div>
      </div>
    `;
  });

  return html;
                                                                                                    }
