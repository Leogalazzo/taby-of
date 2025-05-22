// Importar Firebase como módulo
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

document.addEventListener('DOMContentLoaded', function() {
  // Configuración de Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyD-P5-GOlwT-Ax51u3giJm1G-oXmfOf9-g",
    authDomain: "tabymakeup-of.firebaseapp.com",
    projectId: "tabymakeup-of",
    storageBucket: "tabymakeup-of.firebasestorage.app",
    messagingSenderId: "548834143470",
    appId: "1:548834143470:web:54812e64324b3629f617ff"
  };

  // Inicializar Firebase, Firestore y Auth
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Verificar si el usuario está autenticado
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Si no está autenticado, redirigir a login.html
      window.location.href = 'login.html';
    }
  });

  // Referencias al formulario, tabla, modal y botón de cerrar sesión
  const formProducto = document.getElementById('form-producto');
  const cuerpoTabla = document.getElementById('cuerpo-tabla');
  const formTitle = document.getElementById('form-title');
  const cancelarEdicion = document.getElementById('cancelar-edicion');
  const tonosContainer = document.getElementById('tonos-container');
  const agregarTonoBtn = document.getElementById('agregar-tono');
  const imagenInput = document.getElementById('imagen');
  const imagenPreview = document.getElementById('imagen-preview');
  const modalProducto = document.getElementById('modal-producto');
  const agregarProductoBtn = document.getElementById('agregar-producto-btn');
  const modalClose = document.querySelector('.modal-close');
  const tableSearch = document.getElementById('table-search');
  const logoutBtn = document.getElementById('logout-btn');

  let editando = false;
  let productoId = null;
  let productos = [];

  // Cerrar sesión
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      Swal.fire('Éxito', 'Sesión cerrada correctamente', 'success').then(() => {
        window.location.href = 'login.html';
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Swal.fire('Error', 'Hubo un problema al cerrar sesión', 'error');
    }
  });

  // Abrir modal al hacer clic en "Agregar Producto"
  agregarProductoBtn.addEventListener('click', () => {
    formProducto.reset();
    tonosContainer.innerHTML = '';
    imagenPreview.src = '';
    imagenPreview.style.display = 'none';
    formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Agregar Producto';
    cancelarEdicion.style.display = 'none';
    editando = false;
    productoId = null;
    modalProducto.style.display = 'block';
  });

  // Cerrar modal
  modalClose.addEventListener('click', () => {
    modalProducto.style.display = 'none';
  });

  // Cerrar modal al hacer clic fuera
  window.addEventListener('click', (e) => {
    if (e.target === modalProducto) {
      modalProducto.style.display = 'none';
    }
  });

  // Previsualización de la imagen principal
  imagenInput.addEventListener('input', () => {
    const url = imagenInput.value;
    if (url) {
      imagenPreview.src = url;
      imagenPreview.style.display = 'block';
      imagenPreview.onerror = () => {
        imagenPreview.src = '';
        imagenPreview.style.display = 'none';
        Swal.fire('Error', 'La URL de la imagen no es válida', 'error');
      };
    } else {
      imagenPreview.src = '';
      imagenPreview.style.display = 'none';
    }
  });

  // Función para cargar productos en la tabla
  async function cargarProductos(filtro = '') {
    try {
      const snapshot = await getDocs(collection(db, "productos"));
      productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderizarTabla(filtro);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  }

  // Función para renderizar la tabla con filtro
  function renderizarTabla(filtro = '') {
    cuerpoTabla.innerHTML = '';
    const productosFiltrados = productos.filter(producto =>
      producto.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      producto.categoria.toLowerCase().includes(filtro.toLowerCase())
    );

    if (productosFiltrados.length === 0) {
      cuerpoTabla.innerHTML = '<tr><td colspan="7" style="text-align: center;">No se encontraron productos</td></tr>';
      return;
    }

    productosFiltrados.forEach(producto => {
      const tonos = producto.tonos && producto.tonos.length > 0
        ? producto.tonos.map(t => t.nombre).join(', ')
        : 'Ninguno';

      const fila = `
        <tr>
          <td>${producto.nombre}</td>
          <td>${producto.categoria}</td>
          <td>$${producto.precio}</td>
          <td>${producto.disponible ? 'Sí' : 'No'}</td>
          <td><img src="${producto.imagen}" alt="${producto.nombre}" style="width: 50px;"></td>
          <td>${tonos}</td>
          <td>
            <button class="editar" data-id="${producto.id}">Editar</button>
            <button class="eliminar" data-id="${producto.id}">Eliminar</button>
          </td>
        </tr>
      `;
      cuerpoTabla.innerHTML += fila;
    });

    // Agregar eventos a los botones de editar y eliminar
    document.querySelectorAll('.editar').forEach(boton => {
      boton.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const producto = productos.find(p => p.id === id);

        // Llenar el formulario con los datos del producto
        document.getElementById('producto-id').value = id;
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('categoria').value = producto.categoria;
        document.getElementById('precio').value = producto.precio;
        document.getElementById('imagen').value = producto.imagen;
        document.getElementById('descripcion').value = producto.descripcion || '';
        document.getElementById('disponible').checked = producto.disponible;

        // Previsualizar imagen
        imagenPreview.src = producto.imagen;
        imagenPreview.style.display = 'block';

        // Cargar tonos
        tonosContainer.innerHTML = '';
        if (producto.tonos && producto.tonos.length > 0) {
          producto.tonos.forEach(tono => {
            agregarTonoInput(tono.nombre, tono.imagen);
          });
        }

        formTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Producto';
        cancelarEdicion.style.display = 'inline-block';
        editando = true;
        productoId = id;
        modalProducto.style.display = 'block';
      });
    });

    document.querySelectorAll('.eliminar').forEach(boton => {
      boton.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        Swal.fire({
          title: '¿Estás seguro?',
          text: "No podrás revertir esta acción",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
        }).then(async (result) => {
          if (result.isConfirmed) {
            await deleteDoc(doc(db, "productos", id));
            Swal.fire('Eliminado', 'El producto ha sido eliminado.', 'success');
            cargarProductos(tableSearch.value);
          }
        });
      });
    });
  }

  // Buscador en la tabla
  tableSearch.addEventListener('input', () => {
    const filtro = tableSearch.value.toLowerCase().trim();
    renderizarTabla(filtro);
  });

  // Función para agregar un input de tono dinámicamente
  function agregarTonoInput(nombre = '', imagen = '') {
    const tonoDiv = document.createElement('div');
    tonoDiv.className = 'tono-input';
    tonoDiv.innerHTML = `
      <input type="text" class="tono-nombre" placeholder="Nombre del tono" value="${nombre}">
      <input type="text" class="tono-imagen" placeholder="URL de la imagen del tono" value="${imagen}">
      <img class="tono-preview" src="${imagen}" alt="Previsualización del tono" style="display: ${imagen ? 'block' : 'none'};">
      <button type="button" class="eliminar-tono">Eliminar</button>
    `;
    tonosContainer.appendChild(tonoDiv);

    const tonoImagenInput = tonoDiv.querySelector('.tono-imagen');
    const tonoPreview = tonoDiv.querySelector('.tono-preview');

    tonoImagenInput.addEventListener('input', () => {
      const url = tonoImagenInput.value;
      if (url) {
        tonoPreview.src = url;
        tonoPreview.style.display = 'block';
        tonoPreview.onerror = () => {
          tonoPreview.src = '';
          tonoPreview.style.display = 'none';
          Swal.fire('Error', 'La URL de la imagen del tono no es válida', 'error');
        };
      } else {
        tonoPreview.src = '';
        tonoPreview.style.display = 'none';
      }
    });

    tonoDiv.querySelector('.eliminar-tono').addEventListener('click', () => {
      tonoDiv.remove();
    });
  }

  // Evento para agregar un nuevo tono
  agregarTonoBtn.addEventListener('click', () => {
    agregarTonoInput();
  });

  // Manejar el envío del formulario
  formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const categoria = document.getElementById('categoria').value;
    const precio = parseFloat(document.getElementById('precio').value);
    const imagen = document.getElementById('imagen').value;
    const descripcion = document.getElementById('descripcion').value;
    const disponible = document.getElementById('disponible').checked;

    // Obtener tonos
    const tonosInputs = document.querySelectorAll('.tono-input');
    const tonos = Array.from(tonosInputs).map(input => ({
      nombre: input.querySelector('.tono-nombre').value,
      imagen: input.querySelector('.tono-imagen').value
    })).filter(tono => tono.nombre.trim() !== '');

    const producto = {
      nombre,
      categoria,
      precio,
      imagen,
      descripcion,
      disponible,
      tonos
    };

    try {
      if (editando) {
        const docRef = doc(db, "productos", productoId);
        await updateDoc(docRef, producto);
        Swal.fire('Éxito', 'Producto actualizado correctamente', 'success');
      } else {
        await addDoc(collection(db, "productos"), producto);
        Swal.fire('Éxito', 'Producto agregado correctamente', 'success');
      }
      formProducto.reset();
      tonosContainer.innerHTML = '';
      imagenPreview.src = '';
      imagenPreview.style.display = 'none';
      formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Agregar Producto';
      cancelarEdicion.style.display = 'none';
      editando = false;
      productoId = null;
      modalProducto.style.display = 'none';
      cargarProductos();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      Swal.fire('Error', 'Hubo un problema al guardar el producto', 'error');
    }
  });

  // Cancelar edición
  cancelarEdicion.addEventListener('click', () => {
    formProducto.reset();
    tonosContainer.innerHTML = '';
    imagenPreview.src = '';
    imagenPreview.style.display = 'none';
    formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Agregar Producto';
    cancelarEdicion.style.display = 'none';
    editando = false;
    productoId = null;
    modalProducto.style.display = 'none';
  });

  // Cargar productos al iniciar
  cargarProductos();
});