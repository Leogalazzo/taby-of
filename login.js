// Importar Firebase como módulo
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

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

  // Inicializar Firebase y Auth
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Referencia al formulario
  const loginForm = document.getElementById('login-form');

  // Manejar el envío del formulario
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      // Autenticar al usuario
      await signInWithEmailAndPassword(auth, email, password);
      Swal.fire('Éxito', 'Inicio de sesión exitoso', 'success').then(() => {
        // Redirigir a admin.html
        window.location.href = 'admin.html';
      });
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      let errorMessage = 'Hubo un problema al iniciar sesión. Verifica tus credenciales.';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta. Intenta de nuevo.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado. Verifica tu correo electrónico.';
      }
      Swal.fire('Error', errorMessage, 'error');
    }
  });
});