// ==========================================
//  C🌍in - Core (lógica, cálculos, persistencia)
// ==========================================

import { store } from './store.js';

// ==========================================
//  CONSTANTES
// ==========================================
const STORAGE_KEYS = {
  productos: 'coin_productos',
  lotes: 'coin_lotes',
  asientos: 'coin_asientos',
  sondeos: 'coin_sondeos'
};

// ==========================================
//  PERSISTENCIA
// ==========================================
export function cargarDatos() {
  const data = {};
  for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
    const stored = localStorage.getItem(storageKey);
    data[key] = stored ? JSON.parse(stored) : [];
  }
  store.setState(data);
  console.log('✅ Datos cargados desde localStorage');
}

export function guardarProductos() {
  const state = store.getState();
  localStorage.setItem(STORAGE_KEYS.productos, JSON.stringify(state.productos));
}

export function guardarLote(loteData) {
  const state = store.getState();
  const lotes = [...state.lotes, loteData];
  localStorage.setItem(STORAGE_KEYS.lotes, JSON.stringify(lotes));
  store.setState({ lotes });
}

export function guardarAsientos() {
  const state = store.getState();
  localStorage.setItem(STORAGE_KEYS.asientos, JSON.stringify(state.asientos));
}

export function agregarAsiento(asiento) {
  const state = store.getState();
  const asientos = [...state.asientos, asiento];
  localStorage.setItem(STORAGE_KEYS.asientos, JSON.stringify(asientos));
  store.setState({ asientos });
}

export function guardarSondeos() {
  const state = store.getState();
  localStorage.setItem(STORAGE_KEYS.sondeos, JSON.stringify(state.sondeos));
}

export function agregarSondeo(sondeo) {
  const state = store.getState();
  const sondeos = [...state.sondeos, sondeo];
  localStorage.setItem(STORAGE_KEYS.sondeos, JSON.stringify(sondeos));
  store.setState({ sondeos });
}

export function agregarRegistroSondeo(id, vistas, preguntas) {
  const state = store.getState();
  const sondeo = state.sondeos.find(s => s.id === id);
  if (!sondeo) return false;
  const hoy = new Date().toISOString().split('T')[0];
  const existe = sondeo.historial.find(r => r.fecha === hoy);
  if (existe) {
    existe.vistas = vistas;
    existe.preguntas = preguntas;
  } else {
    sondeo.historial.push({ fecha: hoy, vistas: vistas || 0, preguntas: preguntas || 0 });
  }
  localStorage.setItem(STORAGE_KEYS.sondeos, JSON.stringify(state.sondeos));
  store.setState({ sondeos: state.sondeos });
  return true;
}

// ==========================================
//  UTILIDADES
// ==========================================
export function formatearUSD(valor) {
  return '$' + Number(valor).toFixed(2);
}

export function getEmojiRecomendacion(recomendacion) {
  if (recomendacion.includes('TRAER MÁS')) return '🟢';
  if (recomendacion.includes('MANTENER')) return '🟡';
  if (recomendacion.includes('DEJAR')) return '🔴';
  return '⚪';
}

export function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function generarSKU(nombre, skusExistentes) {
  if (!nombre || nombre.trim() === '') return '';
  const letra = nombre.trim().charAt(0).toUpperCase();
  const skusConLetra = skusExistentes.filter(sku => sku.startsWith(letra) && sku.length === 4);
  let maxNumero = 0;
  skusConLetra.forEach(sku => {
    const num = parseInt(sku.substring(1), 10);
    if (!isNaN(num) && num > maxNumero) maxNumero = num;
  });
  const nuevoNumero = maxNumero + 1;
  const numeroFormateado = String(nuevoNumero).padStart(3, '0');
  return letra + numeroFormateado;
}

// ==========================================
//  CÁLCULOS
// ==========================================
export function calcularCostoUnitario(precioUnitarioChina, cantidad, flete, gastosExtra, valorTotalLote, valorProducto) {
  const totalGastosExtra = gastosExtra.reduce((sum, g) => sum + g.monto, 0);
  const gastosComunes = flete + totalGastosExtra;
  const proporcion = valorTotalLote > 0 ? valorProducto / valorTotalLote : 0;
  const costoTotalProducto = valorProducto + (gastosComunes * proporcion);
  return costoTotalProducto / cantidad;
}

export function calcularPrecioVenta(costoUnitario, modo, valor) {
  let precioVenta = 0, margenGanancia = 0;
  switch (modo) {
    case 'porcentaje':
      precioVenta = costoUnitario / (1 - (valor / 100));
      margenGanancia = valor;
      break;
    case 'gananciaFija':
      precioVenta = costoUnitario + valor;
      margenGanancia = ((precioVenta - costoUnitario) / precioVenta) * 100;
      break;
    case 'precioMercado':
      precioVenta = valor;
      margenGanancia = ((precioVenta - costoUnitario) / precioVenta) * 100;
      break;
    default:
      throw new Error('Modo no válido');
  }
  return {
    precioVenta: parseFloat(precioVenta.toFixed(2)),
    margenGanancia: parseFloat(margenGanancia.toFixed(2)),
    gananciaUnitaria: parseFloat((precioVenta - costoUnitario).toFixed(2))
  };
}

export function calcularEngagementPromedio(interacciones) {
  const { instagram, tiktok, marketplace } = interacciones;
  const calcularER = (data) => {
    if (!data.alcance || data.alcance === 0) return 0;
    const total = data.likes + data.comentarios + data.compartidos;
    return (total / data.alcance) * 100;
  };
  const er = [instagram, tiktok, marketplace].map(calcularER);
  return parseFloat((er.reduce((a, b) => a + b, 0) / er.length).toFixed(2));
}

export function calcularIndicePrioridad(costoUnitario, rotacionMensual, engagementPromedio, tasaConversion, frecuenciaVentas) {
  const costoNorm = Math.max(0, 1 - (costoUnitario / 50));
  const rotacionNorm = Math.min(1, rotacionMensual / 10);
  const engagementNorm = Math.min(1, engagementPromedio / 10);
  const conversionNorm = Math.min(1, tasaConversion / 50);
  let frecuenciaNorm = 0;
  if (frecuenciaVentas > 0 && frecuenciaVentas < 30) {
    frecuenciaNorm = Math.max(0, 1 - (frecuenciaVentas / 15));
  } else if (frecuenciaVentas === 0) {
    frecuenciaNorm = 0;
  } else {
    frecuenciaNorm = 0.2;
  }
  const puntaje = (costoNorm * -0.25) + (rotacionNorm * 0.35) + (engagementNorm * 0.15) + (conversionNorm * 0.1) + (frecuenciaNorm * 0.15);
  const indice = Math.max(0, Math.min(100, (puntaje + 0.5) * 100));
  return {
    indice: parseFloat(indice.toFixed(1)),
    recomendacion: indice > 70 ? '🟢 TRAER MÁS' : (indice > 40 ? '🟡 MANTENER / OPTIMIZAR' : '🔴 DEJAR DE TRAER')
  };
}

// ==========================================
//  ESTACIONALIDAD
// ==========================================
export function inicializarEstacionalidad() {
  const meses = {};
  for (let i = 1; i <= 12; i++) {
    meses[i] = { ventas: 0, preguntas: 0, interacciones: 0 };
  }
  return meses;
}

export function actualizarEstacionalidad(objeto, tipo, cantidad, fecha) {
  const mes = new Date(fecha).getMonth() + 1;
  if (!objeto.estacionalidad) objeto.estacionalidad = inicializarEstacionalidad();
  if (!objeto.estacionalidad[mes]) objeto.estacionalidad[mes] = { ventas: 0, preguntas: 0, interacciones: 0 };
  if (tipo === 'venta') objeto.estacionalidad[mes].ventas += cantidad;
  else if (tipo === 'pregunta') objeto.estacionalidad[mes].preguntas += cantidad;
  else if (tipo === 'interaccion') objeto.estacionalidad[mes].interacciones += cantidad;
  return objeto;
}

export function obtenerRecomendacionMes(objeto) {
  if (!objeto.estacionalidad) return { mejor: null, peor: null, mensaje: 'Sin datos' };
  const meses = Object.entries(objeto.estacionalidad);
  if (meses.length === 0) return { mejor: null, peor: null, mensaje: 'Sin datos' };
  const puntajes = meses.map(([mes, datos]) => {
    const total = (datos.ventas || 0) * 3 + (datos.preguntas || 0) * 2 + (datos.interacciones || 0) * 1;
    return { mes: parseInt(mes), total };
  });
  puntajes.sort((a, b) => b.total - a.total);
  const mejor = puntajes[0];
  const peor = puntajes[puntajes.length - 1];
  if (mejor.total === 0) return { mejor: null, peor: null, mensaje: 'Sin actividad' };
  const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return {
    mejor: { mes: mejor.mes, nombre: mesesNombres[mejor.mes - 1], puntaje: mejor.total },
    peor: { mes: peor.mes, nombre: mesesNombres[peor.mes - 1], puntaje: peor.total },
    mensaje: `📈 Mejor: ${mesesNombres[mejor.mes - 1]} (${mejor.total} pts)`
  };
}

// ==========================================
//  GENERAR ASIENTOS INICIALES
// ==========================================
export function generarAsientosIniciales() {
  const state = store.getState();
  if (state.asientos.length > 0) return;

  const lotesMap = {};
  state.productos.forEach(p => {
    if (!lotesMap[p.loteId]) {
      lotesMap[p.loteId] = {
        fecha: p.fechaLlegada,
        productos: [],
        flete: p.fleteInternacional || 0,
        gastosExtra: p.gastosExtra || []
      };
    }
    lotesMap[p.loteId].productos.push(p);
  });

  for (const [loteId, lote] of Object.entries(lotesMap)) {
    const valorLote = lote.productos.reduce((sum, p) => sum + (p.precioUnitarioChina * p.cantidadImportada), 0);
    const totalGastosExtra = lote.gastosExtra.reduce((sum, g) => sum + g.monto, 0);

    const asientoCompra = {
      id: generarId(),
      fecha: lote.fecha,
      descripcion: `Compra de lote ${loteId} - ${lote.productos.length} productos`,
      tipo: 'compra',
      movimientos: [
        { cuenta: 'Inventario', debe: valorLote + lote.flete + totalGastosExtra, haber: 0 },
        { cuenta: 'Banco', debe: 0, haber: valorLote },
        { cuenta: 'Gastos de Envío', debe: lote.flete, haber: 0 },
        { cuenta: 'Gastos Administrativos', debe: totalGastosExtra, haber: 0 }
      ],
      referencia: loteId,
      productos: lote.productos.map(p => p.id)
    };
    agregarAsiento(asientoCompra);

    lote.productos.forEach(p => {
      if (p.totalVendido > 0) {
        const ingreso = p.totalVendido * p.precioVentaSugerido;
        const costo = p.totalVendido * p.costoUnitarioTotal;
        agregarAsiento({
          id: generarId(),
          fecha: new Date().toISOString(),
          descripcion: `Venta de ${p.totalVendido} unidades de ${p.nombre} (SKU: ${p.sku})`,
          tipo: 'venta',
          movimientos: [
            { cuenta: 'Banco', debe: ingreso, haber: 0 },
            { cuenta: 'Ventas', debe: 0, haber: ingreso }
          ],
          referencia: p.id
        });
        agregarAsiento({
          id: generarId(),
          fecha: new Date().toISOString(),
          descripcion: `Costo de venta de ${p.totalVendido} unidades de ${p.nombre}`,
          tipo: 'costo',
          movimientos: [
            { cuenta: 'Costo de Ventas', debe: costo, haber: 0 },
            { cuenta: 'Inventario', debe: 0, haber: costo }
          ],
          referencia: p.id
        });
      }
    });
  }
}

// ==========================================
//  MIGRAR ESTACIONALIDAD
// ==========================================
export function migrarEstacionalidad() {
  const state = store.getState();
  
  state.productos.forEach(p => {
    if (!p.estacionalidad) p.estacionalidad = inicializarEstacionalidad();
    if (Array.isArray(p.ventasRegistradas)) {
      p.ventasRegistradas.forEach(v => actualizarEstacionalidad(p, 'venta', v.cantidad, v.fecha));
    }
    if (Array.isArray(p.preguntasRegistradas)) {
      p.preguntasRegistradas.forEach(preg => actualizarEstacionalidad(p, 'pregunta', preg.cantidad, preg.fecha));
    }
  });
  guardarProductos();

  state.sondeos.forEach(s => {
    if (!s.estacionalidad) s.estacionalidad = inicializarEstacionalidad();
    if (Array.isArray(s.historial)) {
      s.historial.forEach(dia => {
        if (dia.preguntas > 0) actualizarEstacionalidad(s, 'pregunta', dia.preguntas, dia.fecha);
        if (dia.vistas > 0) actualizarEstacionalidad(s, 'interaccion', dia.vistas, dia.fecha);
      });
    }
  });
  guardarSondeos();
}
