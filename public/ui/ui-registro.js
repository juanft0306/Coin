// ==========================================
//  C🌍in - UI Registro
// ==========================================

import { store } from '../store.js';
import { 
  generarId, generarSKU, calcularCostoUnitario, calcularPrecioVenta,
  guardarLote, guardarProductos, agregarAsiento, actualizarEstacionalidad,
  inicializarEstacionalidad
} from '../core.js';

let loteForm, productosBody, addProductoBtn, addGastoBtn, gastosWrapper;
let gastoIndex = 0, productoRowIndex = 0;

// ==========================================
//  FUNCIONES AUXILIARES (gastos)
// ==========================================
function agregarGasto(concepto = '', monto = '') {
  gastoIndex++;
  const div = document.createElement('div');
  div.className = 'gasto-item';
  div.dataset.index = gastoIndex;
  div.innerHTML = `
    <input type="text" class="gasto-concepto" placeholder="Concepto" value="${concepto}" />
    <input type="number" step="0.01" class="gasto-monto" placeholder="Monto" value="${monto}" />
    <button type="button" class="btn-remove-gasto"><i class="fas fa-trash"></i></button>
  `;
  const removeBtn = div.querySelector('.btn-remove-gasto');
  removeBtn.addEventListener('click', () => {
    div.remove();
    actualizarVisibilidadEliminarGasto();
  });
  gastosWrapper.appendChild(div);
  actualizarVisibilidadEliminarGasto();
}

function actualizarVisibilidadEliminarGasto() {
  const items = gastosWrapper.querySelectorAll('.gasto-item');
  items.forEach((item) => {
    const btn = item.querySelector('.btn-remove-gasto');
    if (btn) {
      btn.style.display = items.length > 1 ? 'inline-flex' : 'none';
    }
  });
}

function obtenerGastos() {
  const items = gastosWrapper.querySelectorAll('.gasto-item');
  const gastos = [];
  items.forEach(item => {
    const concepto = item.querySelector('.gasto-concepto').value.trim();
    const monto = parseFloat(item.querySelector('.gasto-monto').value) || 0;
    if (concepto || monto > 0) {
      gastos.push({ concepto: concepto || 'Gasto extra', monto });
    }
  });
  return gastos;
}

// ==========================================
//  FUNCIONES AUXILIARES (productos)
// ==========================================
function agregarFilaProducto(nombre = '', sku = '', precio = '', cantidad = '', atributo = '') {
  productoRowIndex++;
  const tr = document.createElement('tr');
  tr.dataset.index = productoRowIndex;
  tr.innerHTML = `
    <td><input type="text" class="prod-nombre" placeholder="Ej: Cargador" value="${nombre}" required /></td>
    <td><input type="text" class="prod-sku" placeholder="A001" value="${sku}" /></td>
    <td><input type="number" step="0.01" class="prod-precio" placeholder="1.20" value="${precio}" required /></td>
    <td><input type="number" step="1" class="prod-cantidad" placeholder="100" value="${cantidad}" required /></td>
    <td><input type="text" class="prod-atributo" placeholder="Color/Tamaño" value="${atributo}" /></td>
    <td><button type="button" class="btn-remove-fila"><i class="fas fa-trash"></i></button></td>
  `;
  const removeBtn = tr.querySelector('.btn-remove-fila');
  removeBtn.addEventListener('click', () => {
    tr.remove();
    // Si después de eliminar no quedan filas, no hacemos nada
  });
  productosBody.appendChild(tr);
}

function obtenerProductosFormulario() {
  const state = store.getState();
  const rows = productosBody.querySelectorAll('tr');
  const productosArray = [];
  const skusGlobales = state.productos.map(p => p.sku).filter(s => s && s.length === 4);
  const skusEnLote = [];
  rows.forEach(tr => {
    const skuInput = tr.querySelector('.prod-sku');
    if (skuInput) {
      const sku = skuInput.value.trim().toUpperCase();
      if (sku) skusEnLote.push(sku);
    }
  });
  const skusExistentes = [...skusGlobales, ...skusEnLote];

  rows.forEach(tr => {
    const nombre = tr.querySelector('.prod-nombre').value.trim();
    const skuInput = tr.querySelector('.prod-sku');
    let sku = skuInput.value.trim().toUpperCase();
    const precio = parseFloat(tr.querySelector('.prod-precio').value);
    const cantidad = parseInt(tr.querySelector('.prod-cantidad').value);
    const atributo = tr.querySelector('.prod-atributo').value.trim();

    if (!sku || sku === '') {
      if (nombre) {
        sku = generarSKU(nombre, skusExistentes);
        skuInput.value = sku;
      } else {
        sku = '';
      }
    }

    if (nombre && sku && !isNaN(precio) && precio > 0 && !isNaN(cantidad) && cantidad > 0) {
      productosArray.push({ nombre, sku, precio, cantidad, atributo });
      skusExistentes.push(sku);
    }
  });
  return productosArray;
}

// ==========================================
//  CARGAR VISTA (exportada)
// ==========================================
export function cargarRegistro() {
  loteForm = document.getElementById('loteForm');
  productosBody = document.getElementById('productosBody');
  addProductoBtn = document.getElementById('addProductoBtn');
  addGastoBtn = document.getElementById('addGastoBtn');
  gastosWrapper = document.getElementById('gastosWrapper');

  if (!loteForm || !productosBody) {
    console.error('❌ Error: No se encontraron elementos en registro.html');
    return;
  }

  // ===== INICIALIZAR CON UNA SOLA FILA =====
  productosBody.innerHTML = '';
  productoRowIndex = 0;
  agregarFilaProducto(); // ← UNA FILA, no dos

  // Inicializar gastos (un solo gasto)
  gastosWrapper.innerHTML = '';
  gastoIndex = 0;
  agregarGasto();

  // Configurar eventos
  configurarEventosRegistro();
  console.log('✅ Pantalla de registro inicializada');
}

// ==========================================
//  EVENTOS DEL FORMULARIO
// ==========================================
function configurarEventosRegistro() {
  // ===== SUBMIT =====
  loteForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const flete = parseFloat(document.getElementById('flete').value) || 0;
    const gastosExtra = obtenerGastos();
    const productosData = obtenerProductosFormulario();

    if (productosData.length === 0) {
      alert('⚠️ Debes agregar al menos un producto válido.');
      return;
    }

    const modoPrecio = document.getElementById('modoPrecio').value;
    const valorPrecio = parseFloat(document.getElementById('valorPrecio').value) || 0;

    let valorTotalLote = 0;
    productosData.forEach(p => { valorTotalLote += p.precio * p.cantidad; });

    if (valorTotalLote === 0) {
      alert('⚠️ El valor total del lote no puede ser cero.');
      return;
    }

    const nuevosProductos = [];
    const loteId = generarId();
    const fechaLlegada = new Date().toISOString();

    productosData.forEach(p => {
      const valorProducto = p.precio * p.cantidad;
      const costoUnitario = calcularCostoUnitario(
        p.precio, p.cantidad, flete, gastosExtra, valorTotalLote, valorProducto
      );
      const precioData = calcularPrecioVenta(costoUnitario, modoPrecio, valorPrecio);

      // ===== CREAR PRODUCTO CON VALORES SEGUROS =====
      const producto = {
        id: generarId(),
        loteId: loteId,
        nombre: p.nombre || 'Sin nombre',
        sku: p.sku || 'SKU-001',
        atributo: p.atributo || '',
        precioUnitarioChina: p.precio || 0,
        cantidadImportada: p.cantidad || 0,
        fleteInternacional: flete || 0,
        gastosExtra: gastosExtra || [],
        costoUnitarioTotal: costoUnitario || 0,
        precioVentaSugerido: precioData.precioVenta || 0,
        margenGanancia: precioData.margenGanancia || 40,
        fechaLlegada: fechaLlegada,
        interacciones: { instagram: {}, tiktok: {}, marketplace: {} },
        ventasRegistradas: [],
        totalVendido: 0,
        preguntasRegistradas: [],
        competidores: [],
        estacionalidad: inicializarEstacionalidad()
      };
      nuevosProductos.push(producto);
    });

    // ===== GUARDAR =====
    guardarLote({ id: loteId, fecha: fechaLlegada, flete, gastosExtra, productos: nuevosProductos.map(p => p.id) });
    const state = store.getState();
    store.setState({ productos: [...state.productos, ...nuevosProductos] });
    guardarProductos();

    // ===== ASIENTO CONTABLE =====
    const valorLoteTotal = productosData.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const totalGastosExtra = gastosExtra.reduce((sum, g) => sum + g.monto, 0);
    const asientoCompra = {
      id: generarId(),
      fecha: fechaLlegada,
      descripcion: `Compra de lote ${loteId} - ${nuevosProductos.length} productos`,
      tipo: 'compra',
      movimientos: [
        { cuenta: 'Inventario', debe: valorLoteTotal + flete + totalGastosExtra, haber: 0 },
        { cuenta: 'Banco', debe: 0, haber: valorLoteTotal },
        { cuenta: 'Gastos de Envío', debe: flete, haber: 0 },
        { cuenta: 'Gastos Administrativos', debe: totalGastosExtra, haber: 0 }
      ],
      referencia: loteId,
      productos: nuevosProductos.map(p => p.id)
    };
    agregarAsiento(asientoCompra);

    // ===== RESETEAR FORMULARIO (UNA SOLA FILA) =====
    productosBody.innerHTML = '';
    productoRowIndex = 0;
    agregarFilaProducto(); // ← UNA FILA

    document.getElementById('flete').value = '0';
    gastosWrapper.innerHTML = '';
    gastoIndex = 0;
    agregarGasto();
    document.getElementById('modoPrecio').value = 'porcentaje';
    document.getElementById('valorPrecio').value = '40';

    alert(`✅ Lote guardado con ${nuevosProductos.length} productos.`);
  });

  // ===== BOTÓN AGREGAR GASTO =====
  addGastoBtn.addEventListener('click', () => agregarGasto());

  // ===== BOTÓN AGREGAR PRODUCTO =====
  addProductoBtn.addEventListener('click', () => agregarFilaProducto());
                 }
