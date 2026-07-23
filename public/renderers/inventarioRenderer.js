// ==========================================
//  C🌍in - Renderizador de Inventario
// ==========================================

import { formatearUSD } from '../core.js';

export function renderizarInventario(productos) {
  if (!productos || productos.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-boxes"></i>
        <p>No hay productos en el inventario.</p>
      </div>
    `;
  }

  // Agrupar por SKU
  const inventarioPorSKU = {};
  productos.forEach(p => {
    const sku = p.sku;
    if (!inventarioPorSKU[sku]) {
      inventarioPorSKU[sku] = {
        sku: sku,
        nombre: p.nombre,
        atributo: p.atributo || '',
        lotes: [],
        cantidadTotal: 0,
        costoTotal: 0
      };
    }
    const grupo = inventarioPorSKU[sku];
    grupo.lotes.push({
      id: p.id,
      loteId: p.loteId,
      cantidad: p.cantidadImportada,
      vendido: p.totalVendido || 0,
      stock: p.cantidadImportada - (p.totalVendido || 0),
      costoUnitario: p.costoUnitarioTotal,
      precioVenta: p.precioVentaSugerido,
      fechaLlegada: p.fechaLlegada
    });
    grupo.cantidadTotal += p.cantidadImportada;
    grupo.costoTotal += p.cantidadImportada * p.costoUnitarioTotal;
    if (p.atributo && !grupo.nombre.includes(p.atributo)) {
      grupo.nombre = p.nombre + ' (' + p.atributo + ')';
    }
  });

  // Calcular stock y valor total
  let stockTotal = 0, valorTotal = 0;
  Object.values(inventarioPorSKU).forEach(grupo => {
    grupo.lotes.forEach(lote => {
      stockTotal += lote.stock;
      valorTotal += lote.stock * lote.costoUnitario;
    });
  });

  // HTML de resumen y tabla
  let html = `
    <div style="display:flex; gap:16px; flex-wrap:wrap; margin-bottom:16px; background:var(--glass-bg); padding:12px 16px; border-radius:12px; border:1px solid var(--border-color);">
      <div>
        <span style="color:var(--text-secondary); font-size:0.7rem;">Valor total</span>
        <div style="font-size:1.3rem; font-weight:700; color:var(--gold);">${formatearUSD(valorTotal)}</div>
      </div>
      <div>
        <span style="color:var(--text-secondary); font-size:0.7rem;">Productos distintos</span>
        <div style="font-size:1.3rem; font-weight:700;">${Object.keys(inventarioPorSKU).length}</div>
      </div>
      <div>
        <span style="color:var(--text-secondary); font-size:0.7rem;">Stock total</span>
        <div style="font-size:1.3rem; font-weight:700;">${stockTotal} und</div>
      </div>
    </div>
  `;

  // Tarjetas por SKU
  Object.values(inventarioPorSKU).forEach(grupo => {
    const stockSKU = grupo.lotes.reduce((sum, l) => sum + l.stock, 0);
    const costoPromedio = grupo.costoTotal / grupo.cantidadTotal;

    html += `
      <div class="inventario-item">
        <div class="inventario-header">
          <h3>
            <span class="sku-badge">${grupo.sku}</span>
            ${grupo.nombre}
          </h3>
          <div class="inventario-resumen">
            <span class="badge">Stock: ${stockSKU} und</span>
            <span class="badge">Costo prom: ${formatearUSD(costoPromedio)}</span>
            <span class="badge">Valor: ${formatearUSD(stockSKU * costoPromedio)}</span>
          </div>
        </div>
        <div class="inventario-lotes">
          <div class="table-wrapper">
            <table class="lotes-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Fecha</th>
                  <th>Comprados</th>
                  <th>Vendidos</th>
                  <th>Stock</th>
                  <th>Costo unit.</th>
                  <th>Valor stock</th>
                </tr>
              </thead>
              <tbody>
    `;
    grupo.lotes.forEach(lote => {
      const valorStock = lote.stock * lote.costoUnitario;
      const fecha = new Date(lote.fechaLlegada).toLocaleDateString('es-ES');
      html += `
        <tr>
          <td><span class="lote-id">${lote.loteId.substring(0, 8)}</span></td>
          <td>${fecha}</td>
          <td>${lote.cantidad}</td>
          <td>${lote.vendido}</td>
          <td><strong>${lote.stock}</strong></td>
          <td>${formatearUSD(lote.costoUnitario)}</td>
          <td>${formatearUSD(valorStock)}</td>
        </tr>
      `;
    });
    html += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  });

  return html;
}
