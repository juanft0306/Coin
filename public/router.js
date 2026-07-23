// ==========================================
//  C🌍in - Router (CORREGIDO)
// ==========================================

import { store } from './store.js';
import { cargarRegistro } from './ui/ui-registro.js';
import { cargarRecomendaciones } from './ui/ui-recomendaciones.js';
import { cargarInventario } from './ui/ui-inventario.js';
import { cargarContabilidad } from './ui/ui-contabilidad.js';
import { cargarSondeo } from './ui/ui-sondeo.js';
import { cargarEstacionalidad } from './ui/ui-estacionalidad.js';

const viewMap = {
  registro: cargarRegistro,
  recomendaciones: cargarRecomendaciones,
  inventario: cargarInventario,
  contabilidad: cargarContabilidad,
  sondeo: cargarSondeo,
  estacionalidad: cargarEstacionalidad
};

const htmlCache = {};

function cargarHTML(archivo) {
  if (htmlCache[archivo]) {
    return Promise.resolve(htmlCache[archivo]);
  }
  const ruta = `views/${archivo}`;
  return fetch(ruta)
    .then(response => {
      if (!response.ok) throw new Error(`No se pudo cargar ${ruta} (status: ${response.status})`);
      return response.text();
    })
    .then(html => {
      htmlCache[archivo] = html;
      return html;
    });
}

export function navigateTo(tab) {
  store.setState({ currentTab: tab });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  const archivo = `${tab}.html`;
  const loadView = viewMap[tab] || viewMap.registro;

  cargarHTML(archivo)
    .then(html => {
      document.getElementById('mainContainer').innerHTML = html;
      // Inicializar la vista (con manejo de errores)
      try {
        loadView();
      } catch (error) {
        console.error(`Error al inicializar ${tab}:`, error);
        document.getElementById('mainContainer').innerHTML += `
          <div style="text-align:center; padding:20px; color:#ef4444; background:rgba(239,68,68,0.1); border-radius:12px; margin-top:12px;">
            <i class="fas fa-exclamation-circle"></i> Error al inicializar la vista: ${error.message}
          </div>
        `;
      }
      // Cerrar menú hamburguesa
      const nav = document.getElementById('tabsNav');
      const hamburger = document.getElementById('hamburgerBtn');
      if (nav) nav.classList.remove('open');
      if (hamburger) hamburger.classList.remove('active');
    })
    .catch(error => {
      document.getElementById('mainContainer').innerHTML = `
        <div style="text-align:center; padding:40px; color:#ef4444;">
          <i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i>
          <p style="margin-top:12px;">Error al cargar ${archivo}</p>
          <p style="font-size:0.85rem; color:var(--text-secondary);">${error.message}</p>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">Verifica que el archivo exista en la carpeta <strong>views/</strong></p>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="location.reload()">
            <i class="fas fa-sync-alt"></i> Recargar
          </button>
        </div>
      `;
      console.error(error);
    });
}

export function initRouter() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      navigateTo(this.dataset.tab);
    });
  });

  const hamburger = document.getElementById('hamburgerBtn');
  if (hamburger) {
    hamburger.addEventListener('click', function() {
      const nav = document.getElementById('tabsNav');
      if (nav) nav.classList.toggle('open');
      this.classList.toggle('active');
    });
  }

  document.getElementById('btnRefresh').addEventListener('click', () => {
    import('./core.js').then(core => {
      core.cargarDatos();
      alert('✅ Datos actualizados desde localStorage.');
    });
  });

  document.getElementById('btnBorrarDatos').addEventListener('click', function() {
    if (!confirm('⚠️ ¿ESTÁS SEGURO DE BORRAR TODOS LOS DATOS?\n\nEsta acción NO se puede deshacer.')) return;
    if (!confirm('🔴 ÚLTIMA OPORTUNIDAD: ¿Realmente deseas eliminar TODOS los datos?')) return;
    
    const keys = Object.keys(localStorage).filter(key => key.startsWith('coin_'));
    keys.forEach(key => localStorage.removeItem(key));
    store.setState({ productos: [], lotes: [], asientos: [], sondeos: [] });
    alert('✅ Todos los datos han sido eliminados.');
    location.reload();
  });

  navigateTo('registro');
}
