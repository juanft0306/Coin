// ==========================================
//  C🌍in - Store (estado central)
// ==========================================

class Store {
  constructor() {
    this._state = {
      productos: [],
      lotes: [],
      asientos: [],
      sondeos: [],
      currentTab: 'registro',
      filtroActual: 'todos',
      filtroEstacionalidad: 'todos'
    };
    this._listeners = [];
  }

  // Obtener estado (copia inmutable)
  getState() {
    return JSON.parse(JSON.stringify(this._state));
  }

  // Actualizar estado parcial y notificar
  setState(newState) {
    this._state = { ...this._state, ...newState };
    this._notify();
  }

  // Suscribir una función a cambios
  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  // Notificar a todos los suscriptores
  _notify() {
    const state = this.getState();
    this._listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error en listener:', error);
      }
    });
  }
}

// Exportar instancia única
export const store = new Store();

// Hacer accesible globalmente para scripts antiguos
window.store = store;
