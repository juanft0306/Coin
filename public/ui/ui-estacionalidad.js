// ==========================================
//  C🌍in - UI Estacionalidad
// ==========================================

import { store } from '../store.js';
import { renderizarEstacionalidad } from '../renderers/estacionalidadRenderer.js';

let container = null;
let unsubscribe = null;

export function cargarEstacionalidad() {
  container = document.getElementById('estacionalidadList');
  if (!container) {
    console.error('❌ Error: No se encontró estacionalidadList');
    return;
  }

  // Configurar filtros
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      store.setState({ filtroEstacionalidad: this.dataset.filter });
    });
  });

  if (unsubscribe) unsubscribe();
  unsubscribe = store.subscribe((state) => {
    if (state.currentTab === 'estacionalidad' || !state.currentTab) {
      actualizarVista(state);
    }
  });

  actualizarVista(store.getState());
  console.log('✅ Pantalla de estacionalidad inicializada');
}

function actualizarVista(state) {
  if (!container) return;
  const html = renderizarEstacionalidad(
    state.productos, 
    state.sondeos, 
    state.filtroEstacionalidad
  );
  container.innerHTML = html;
  
  // Actualizar contadores
  const items = [];
  if (state.filtroEstacionalidad === 'todos' || state.filtroEstacionalidad === 'productos') {
    items.push(...state.productos);
  }
  if (state.filtroEstacionalidad === 'todos' || state.filtroEstacionalidad === 'sondeos') {
    items.push(...state.sondeos);
  }
  document.getElementById('estacionalidadCount').textContent = items.length + ' elementos';
}
