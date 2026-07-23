// ==========================================
//  C🌍in - Renderizador de Contabilidad
// ==========================================

import { formatearUSD } from '../core.js';

export function renderizarLibroDiario(asientos) {
  if (!asientos || asientos.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-book"></i>
        <p>No hay asientos contables registrados.</p>
      </div>
    `;
  }

  let html = `
    <h3 style="margin-bottom:16px;">📖 Libro Diario</h3>
    <div class="table-wrapper">
      <table class="contabilidad-table">
        <thead><tr><th>Fecha</th><th>Descripción</th><th>Cuenta</th><th>Debe</th><th>Haber</th></tr></thead>
        <tbody>
  `;
  asientos.forEach(asiento => {
    const fecha = new Date(asiento.fecha).toLocaleDateString('es-ES');
    asiento.movimientos.forEach((mov, idx) => {
      html += `
        <tr>
          ${idx === 0 ? `<td rowspan="${asiento.movimientos.length}">${fecha}</td>` : ''}
          ${idx === 0 ? `<td rowspan="${asiento.movimientos.length}">${asiento.descripcion}</td>` : ''}
          <td>${mov.cuenta}</td>
          <td>${mov.debe > 0 ? formatearUSD(mov.debe) : ''}</td>
          <td>${mov.haber > 0 ? formatearUSD(mov.haber) : ''}</td>
        </tr>
      `;
    });
  });
  html += `</tbody></table></div>`;
  return html;
}

export function renderizarLibroMayor(asientos) {
  if (!asientos || asientos.length === 0) {
    return `<div class="empty-state"><i class="fas fa-chart-bar"></i><p>No hay movimientos.</p></div>`;
  }

  const cuentas = {};
  asientos.forEach(asiento => {
    asiento.movimientos.forEach(mov => {
      if (!cuentas[mov.cuenta]) cuentas[mov.cuenta] = { debe: 0, haber: 0, saldo: 0 };
      cuentas[mov.cuenta].debe += mov.debe;
      cuentas[mov.cuenta].haber += mov.haber;
      cuentas[mov.cuenta].saldo = cuentas[mov.cuenta].debe - cuentas[mov.cuenta].haber;
    });
  });

  let html = `<h3 style="margin-bottom:16px;">📊 Libro Mayor</h3><div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px;">`;
  for (const [cuenta, data] of Object.entries(cuentas)) {
    const esDeudora = data.saldo >= 0;
    html += `
      <div class="cuenta-t">
        <h4 style="text-align:center; border-bottom:2px solid var(--gold); padding-bottom:6px;">${cuenta}</h4>
        <div style="display:flex; justify-content:space-between; padding:4px 8px;">
          <span><strong>Debe:</strong> ${formatearUSD(data.debe)}</span>
          <span><strong>Haber:</strong> ${formatearUSD(data.haber)}</span>
        </div>
        <div style="text-align:center; margin-top:8px; padding:6px; background:${esDeudora ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}; border-radius:6px;">
          <strong>Saldo:</strong> ${esDeudora ? 'Deudor' : 'Acreedor'} ${formatearUSD(Math.abs(data.saldo))}
        </div>
      </div>
    `;
  }
  html += `</div>`;
  return html;
}

export function renderizarBalanceResultados(asientos) {
  if (!asientos || asientos.length === 0) {
    return `<div class="empty-state"><i class="fas fa-chart-pie"></i><p>No hay datos.</p></div>`;
  }

  let ingresos = 0, gastos = 0;
  asientos.forEach(asiento => {
    asiento.movimientos.forEach(mov => {
      if (mov.cuenta === 'Ventas') ingresos += mov.haber - mov.debe;
      else if (mov.cuenta === 'Costo de Ventas') gastos += mov.debe - mov.haber;
      else if (mov.cuenta.includes('Gasto')) gastos += mov.debe - mov.haber;
    });
  });
  const resultado = ingresos - gastos;

  return `
    <h3 style="margin-bottom:16px;">📈 Balance de Resultados</h3>
    <div style="max-width:500px; margin:0 auto;">
      <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid var(--border-color);">
        <span><strong>Ingresos (Ventas)</strong></span>
        <span style="color:#2ecc71;">${formatearUSD(ingresos)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid var(--border-color);">
        <span><strong>Gastos</strong></span>
        <span style="color:#e74c3c;">${formatearUSD(gastos)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:16px; background:var(--gold); color:#0a0e27; border-radius:8px; margin-top:12px; font-weight:bold; font-size:1.2rem;">
        <span>Resultado Neto</span>
        <span>${resultado >= 0 ? '🟢' : '🔴'} ${formatearUSD(resultado)}</span>
      </div>
    </div>
  `;
}

export function renderizarBalanceGeneral(asientos) {
  if (!asientos || asientos.length === 0) {
    return `<div class="empty-state"><i class="fas fa-balance-scale"></i><p>No hay datos.</p></div>`;
  }

  let activo = 0, pasivo = 0, capital = 0;
  asientos.forEach(asiento => {
    asiento.movimientos.forEach(mov => {
      if (mov.cuenta === 'Inventario' || mov.cuenta === 'Banco') activo += mov.debe - mov.haber;
      else if (mov.cuenta === 'Proveedores') pasivo += mov.haber - mov.debe;
      else if (mov.cuenta === 'Capital') capital += mov.haber - mov.debe;
    });
  });
  if (capital === 0) {
    let ingresos = 0, gastos = 0;
    asientos.forEach(asiento => {
      asiento.movimientos.forEach(mov => {
        if (mov.cuenta === 'Ventas') ingresos += mov.haber - mov.debe;
        else if (mov.cuenta === 'Costo de Ventas') gastos += mov.debe - mov.haber;
        else if (mov.cuenta.includes('Gasto')) gastos += mov.debe - mov.haber;
      });
    });
    capital = ingresos - gastos;
  }

  const totalPasivoCapital = pasivo + capital;
  return `
    <h3 style="margin-bottom:16px;">🏦 Balance General</h3>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; max-width:600px; margin:0 auto;">
      <div style="background:var(--glass-bg); padding:16px; border-radius:12px; border:1px solid var(--border-color);">
        <h4 style="color:var(--gold);">Activos</h4>
        <div style="font-size:2rem; font-weight:bold;">${formatearUSD(activo)}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);">Recursos de la empresa</div>
      </div>
      <div style="background:var(--glass-bg); padding:16px; border-radius:12px; border:1px solid var(--border-color);">
        <h4 style="color:var(--gold);">Pasivo + Capital</h4>
        <div style="font-size:2rem; font-weight:bold;">${formatearUSD(totalPasivoCapital)}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);">
          Pasivo: ${formatearUSD(pasivo)} | Capital: ${formatearUSD(capital)}
        </div>
      </div>
    </div>
    <div style="text-align:center; margin-top:16px; padding:12px; background:${Math.abs(activo - totalPasivoCapital) < 0.01 ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}; border-radius:8px;">
      <strong>${Math.abs(activo - totalPasivoCapital) < 0.01 ? '✅' : '⚠️'} Ecuación contable:</strong>
      Activo (${formatearUSD(activo)}) ${Math.abs(activo - totalPasivoCapital) < 0.01 ? '=' : '≠'} 
      Pasivo + Capital (${formatearUSD(totalPasivoCapital)})
    </div>
  `;
}
