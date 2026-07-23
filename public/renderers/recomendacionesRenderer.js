// ==========================================
//  C🌍in - Renderizador de Recomendaciones
//  (Función pura: recibe datos, devuelve HTML)
// ==========================================

import { formatearUSD, getEmojiRecomendacion, calcularEngagementPromedio, calcularPrecioVenta, obtenerRecomendacionMes } from '../core.js';

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
      return prioridad.recomendacion.includes('TRAER MÁS');
    });
  } else if (filtro === 'mantener') {
    productosFiltrados = productos.filter(p => {
      const prioridad = calcularPrioridad(p);
      return prioridad.recomendacion.includes('MANTENER');
    });
  } else if (filtro === 'dejar') {
    productosFiltrados = productos.filter(p => {
      const prioridad = calcularPrioridad(p);
      return prioridad.recomendacion.includes('DEJAR');
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

  // ... (aquí va todo el código de generación de HTML de recomendaciones)
  // Es el mismo código que tenías en renderizarRecomendaciones,
  // pero ahora es una función pura que solo recibe datos y devuelve HTML.
  
  // (Este código es extenso, pero es el que ya tienes funcionando.
  // Lo mantienes exactamente igual, solo que ahora está en un archivo separado).
}
