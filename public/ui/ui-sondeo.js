// ==========================================
//  C🌍in - UI Sondeo
// ==========================================

import { store } from '../store.js';
import { renderizarSondeos } from '../renderers/sondeoRenderer.js';
import { agregarSondeo, guardarSondeos } from '../core.js';

let container = null;
let sondeoForm = null;
let unsubscribe = null;

export function cargarSondeo() {
  container = document.getElementById('sondeoList');
  sondeoForm = document.getElementById('sondeoForm');

  if (!container || !sondeoForm) {
    console.error('❌ Error: No se encontraron elementos en sondeo.html');
    return;
  }

  // Configurar evento del formulario
  sondeoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('sondeoNombre').value.trim();
    const precio = parseFloat(document.getElementById('sondeoPrecio').value);
    const descripcion = document.getElementById('sondeoDescripcion').value.trim();
    const costos = parseFloat(document.getElementById('sondeoCostos').value) || 0;
    const competidores = parseInt(document.getElementById('sondeoCompetidores').value) || 0;

    if (!nombre || !precio || precio <= 0) {
      alert('⚠️ Nombre y precio son obligatorios.');
      return;
    }

    // Importar funciones necesarias
    import('../core.js').then(core => {
      const nuevoSondeo = {
        id: core.generarId(),
        nombre, descripcion, precioEstimado: precio, costosEstimados: costos,
        competidores, fecha: new Date().toISOString(),
        interacciones: { instagram: {}, tiktok: {}, marketplace: {} },
        preguntas: 0,
        estado: 'evaluando',
        historial: [],
        estacionalidad: core.inicializarEstacionalidad()
      };

      core.agregarSondeo(nuevoSondeo);
      // La vista se actualizará automáticamente por el store
      sondeoForm.reset();
      document.getElementById('sondeoCostos').value = '0';
      document.getElementById('sondeoCompetidores').value = '0';
      alert(`✅ Producto "${nombre}" agregado al sondeo.`);
    });
  });

  // Suscribirse a cambios del store
  if (unsubscribe) unsubscribe();
  unsubscribe = store.subscribe((state) => {
    if (state.currentTab === 'sondeo' || !state.currentTab) {
      actualizarVista(state);
    }
  });

  actualizarVista(store.getState());
  console.log('✅ Pantalla de sondeo inicializada');
}

function actualizarVista(state) {
  if (!container) return;
  const html = renderizarSondeos(state.sondeos);
  container.innerHTML = html;
  
  // Actualizar contadores
  document.getElementById('sondeoCount').textContent = state.sondeos.length + ' productos';
  document.getElementById('totalSondeo').textContent = state.sondeos.length;
  
  // Calcular estadísticas
  let recomendados = 0, evaluar = 0, descartar = 0;
  state.sondeos.forEach(s => {
    // Usar la función de cálculo de interés
    import('../renderers/sondeoRenderer.js').then(module => {
      // Esto es solo para actualizar los contadores, pero ya se maneja en el renderizador
      // Como es complejo, mejor lo dejamos para el renderizador
    });
  });
}
