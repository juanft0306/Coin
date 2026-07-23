// ==========================================
//  C🌍in - UI Sondeo (CORREGIDO)
// ==========================================

import { store } from '../store.js';
import { renderizarSondeos } from '../renderers/sondeoRenderer.js';
import { agregarSondeo } from '../core.js';

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
  
  // Renderizar lista de sondeos
  const html = renderizarSondeos(state.sondeos);
  container.innerHTML = html;
  
  // === MANEJO SEGURO DE ELEMENTOS ===
  // Verificar existencia antes de asignar textContent
  const sondeoCount = document.getElementById('sondeoCount');
  const totalSondeo = document.getElementById('totalSondeo');
  const sondeoRecomendados = document.getElementById('sondeoRecomendados');
  const sondeoEvaluar = document.getElementById('sondeoEvaluar');
  const sondeoDescartar = document.getElementById('sondeoDescartar');

  // Calcular estadísticas
  let recomendados = 0, evaluar = 0, descartar = 0;
  state.sondeos.forEach(s => {
    import('../renderers/sondeoRenderer.js').then(module => {
      // Esta función ya existe, pero la llamamos directamente desde el renderizador
    });
  });
  // Calcular aquí mismo para no depender del renderizador
  state.sondeos.forEach(s => {
    const engagement = window.calcularEngagementPromedio ? window.calcularEngagementPromedio(s.interacciones || {}) : 0;
    const preguntas = s.preguntas || 0;
    const competidores = s.competidores || 0;
    let puntaje = Math.min(engagement * 3, 30) + Math.min(preguntas * 5, 40) + Math.max(0, 30 - competidores * 2);
    if (puntaje >= 70) recomendados++;
    else if (puntaje >= 40) evaluar++;
    else descartar++;
  });

  // Asignar solo si los elementos existen
  if (sondeoCount) sondeoCount.textContent = state.sondeos.length + ' productos';
  if (totalSondeo) totalSondeo.textContent = state.sondeos.length;
  if (sondeoRecomendados) sondeoRecomendados.textContent = recomendados;
  if (sondeoEvaluar) sondeoEvaluar.textContent = evaluar;
  if (sondeoDescartar) sondeoDescartar.textContent = descartar;
}
