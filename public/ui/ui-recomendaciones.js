// ==========================================
//  C🌍in - UI Recomendaciones
// ==========================================

import { store } from '../store.js';
import { renderizarRecomendaciones } from '../renderers/recomendacionesRenderer.js';

let container = null;
let productCount = null;
let unsubscribe = null;

export function cargarRecomendaciones() {
  container = document.getElementById('productList');
  productCount = document.getElementById('productCount');

  if (!container) {
    console.error('❌ Error: No se encontró productList');
    return;
  }

  // Configurar filtros
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      store.setState({ filtroActual: this.dataset.filter });
    });
  });

  // Suscribirse a cambios del store
  if (unsubscribe) unsubscribe();
  unsubscribe = store.subscribe((state) => {
    if (state.currentTab === 'recomendaciones' || !state.currentTab) {
      actualizarVista(state);
    }
  });

  // Renderizar inicial
  actualizarVista(store.getState());
  console.log('✅ Pantalla de recomendaciones inicializada');
}

function actualizarVista(state) {
  if (!container) return;
  const html = renderizarRecomendaciones(state.productos, state.filtroActual);
  container.innerHTML = html;
  if (productCount) {
    const count = state.productos.filter(p => {
      if (state.filtroActual === 'todos') return true;
      // ... filtro lógico
      return true;
    }).length;
    productCount.textContent = count + ' productos';
  }
}
