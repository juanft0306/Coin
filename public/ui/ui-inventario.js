// ==========================================
//  C🌍in - UI Inventario
// ==========================================

import { store } from '../store.js';
import { renderizarInventario } from '../renderers/inventarioRenderer.js';

let container = null;
let unsubscribe = null;

export function cargarInventario() {
  container = document.getElementById('inventarioContainer');
  if (!container) {
    console.error('❌ Error: No se encontró inventarioContainer');
    return;
  }

  if (unsubscribe) unsubscribe();
  unsubscribe = store.subscribe((state) => {
    if (state.currentTab === 'inventario' || !state.currentTab) {
      actualizarVista(state);
    }
  });

  actualizarVista(store.getState());
  console.log('✅ Pantalla de inventario inicializada');
}

function actualizarVista(state) {
  if (!container) return;
  container.innerHTML = renderizarInventario(state.productos);
}
