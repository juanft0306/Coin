// ==========================================
//  C🌍in - Router (navegación entre vistas)
// ==========================================

import { store } from './store.js';
import { cargarRegistro } from './ui/ui-registro.js';
import { cargarRecomendaciones } from './ui/ui-recomendaciones.js';
import { cargarInventario } from './ui/ui-inventario.js';
import { cargarContabilidad } from './ui/ui-contabilidad.js';
import { cargarSondeo } from './ui/ui-sondeo.js';
import { cargarEstacionalidad } from './ui/ui-estacionalidad.js';
import { cerrarModal } from './ui/ui-acciones.js';

// Mapeo de pestañas a funciones de carga
const viewMap = {
  registro: cargarRegistro,
  recomendaciones: cargarRecomendaciones,
  inventario: cargarInventario,
  contabilidad: cargarContabilidad,
  sondeo: cargarSondeo,
  estacionalidad: cargarEstacionalidad
};

// Cache de HTMLs
const htmlCache = {};

function cargarHTML(archivo) {
  if (htmlCache[archivo]) {
    return Promise.resolve(htmlCache[archivo]);
  }
  return fetch(archivo)
    .then(response => {
      if (!response.ok) throw new Error(`No se pudo cargar ${archivo}`);
      return response.text();
    })
    .then(html => {
      htmlCache[archivo] = html;
      return html;
    });
}

export function navigateTo(tab) {
  // Actualizar estado
  store.setState({ currentTab: tab });

  // Actualizar tabs visualmente
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Cargar vista
  const archivo = `${tab}.html`;
  const loadView = viewMap[tab] || viewMap.registro;

  cargarHTML(archivo)
    .then(html => {
      document.getElementById('mainContainer').innerHTML = html;
      // Inicializar la vista
      loadView();
      // Cerrar menú hamburguesa en móvil
      const nav = document.getElementById('tabsNav');
      const hamburger = document.getElementById('hamburgerBtn');
      if (nav) nav.classList.remove('open');
      if (hamburger) hamburger.classList.remove('active');
    })
    .catch(error => {
      document.getElementById('mainContainer').innerHTML = `
        <div style="text-align:center; padding:40px; color:#e74c3c;">
          <i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i>
          <p>Error al cargar ${archivo}: ${error.message}</p>
        </div>
      `;
      console.error(error);
    });
}

// Inicializar navegación
export function initRouter() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      navigateTo(this.dataset.tab);
    });
  });

  // Menú hamburguesa
  const hamburger = document.getElementById('hamburgerBtn');
  if (hamburger) {
    hamburger.addEventListener('click', function() {
      const nav = document.getElementById('tabsNav');
      if (nav) nav.classList.toggle('open');
      this.classList.toggle('active');
    });
  }

  // Cerrar menú al seleccionar pestaña (ya se maneja en navigateTo)

  // Botón refrescar
  document.getElementById('btnRefresh').addEventListener('click', () => {
    import('./core.js').then(core => {
      core.cargarDatos();
      // Las vistas se actualizarán solas por el store
      alert('✅ Datos actualizados desde localStorage.');
    });
  });

  // Botón borrar datos
  document.getElementById('btnBorrarDatos').addEventListener('click', function() {
    if (!confirm('⚠️ ¿ESTÁS SEGURO DE BORRAR TODOS LOS DATOS?\n\nEsta acción NO se puede deshacer.')) return;
    if (!confirm('🔴 ÚLTIMA OPORTUNIDAD: ¿Realmente deseas eliminar TODOS los datos?')) return;
    
    const keys = Object.keys(localStorage).filter(key => key.startsWith('coin_'));
    keys.forEach(key => localStorage.removeItem(key));
    store.setState({ productos: [], lotes: [], asientos: [], sondeos: [] });
    alert('✅ Todos los datos han sido eliminados.');
    location.reload();
  });

  // Cargar vista inicial
  navigateTo('registro');
}
