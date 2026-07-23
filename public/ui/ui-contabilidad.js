// ==========================================
//  C🌍in - UI Contabilidad
// ==========================================

import { store } from '../store.js';
import { 
  renderizarLibroDiario, renderizarLibroMayor, 
  renderizarBalanceResultados, renderizarBalanceGeneral 
} from '../renderers/contabilidadRenderer.js';

let container = null;
let unsubscribe = null;
let vistaActual = 'diario';

export function cargarContabilidad() {
  container = document.getElementById('contabilidadContainer');
  if (!container) {
    console.error('❌ Error: No se encontró contabilidadContainer');
    return;
  }

  // Configurar tabs internos
  document.querySelectorAll('.contab-tab').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.contab-tab').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      vistaActual = this.dataset.contab;
      actualizarVista(store.getState());
    });
  });

  if (unsubscribe) unsubscribe();
  unsubscribe = store.subscribe((state) => {
    if (state.currentTab === 'contabilidad' || !state.currentTab) {
      actualizarVista(state);
    }
  });

  // Generar asientos iniciales si no existen
  import('../core.js').then(core => {
    if (store.getState().asientos.length === 0) {
      core.generarAsientosIniciales();
    }
  });

  actualizarVista(store.getState());
  console.log('✅ Pantalla de contabilidad inicializada');
}

function actualizarVista(state) {
  if (!container) return;
  const asientos = state.asientos || [];
  let html = '';
  switch (vistaActual) {
    case 'diario': html = renderizarLibroDiario(asientos); break;
    case 'mayor': html = renderizarLibroMayor(asientos); break;
    case 'resultados': html = renderizarBalanceResultados(asientos); break;
    case 'general': html = renderizarBalanceGeneral(asientos); break;
    default: html = `<p>Vista no encontrada</p>`;
  }
  container.innerHTML = html;
  document.getElementById('asientosCount').textContent = asientos.length + ' asientos';
}
