const express = require('express');
const router = express.Router();
const axios = require('axios');
const comprobarUsuario = require('./comprobarusuario');
const admin = require('firebase-admin');

router.get('/', (req, res) => { 
  res.send('El servicio de iniciar sesión está funcionando correctamente.'); 
});

router.post('/', async (req, res) => {
  const { idToken } = req.body;

  try {
    // Verificar el token usando el servicio de verificación
    const response = await axios.post('https://backend-marketgo.onrender.com/verifyToken', { idToken });
    const tokenData = response.data;

    if (!tokenData.isValid) {
      return res.status(401).send({ isValid: false, error: 'Token inválido' });
    }

    const { uid } = tokenData;

    // Verificar si el usuario ya existe usando la función comprobarUsuario
    const usuarioExiste = await comprobarUsuario(uid);

    if (usuarioExiste) {
      // Recuperar los datos del usuario desde Firebase
      const db = admin.firestore();
      const userRef = db.collection('usuario').doc(uid);
      const doc = await userRef.get();
      
      if (doc.exists) {
        const userData = doc.data();
        return res.status(200).send({ 
          isValid: true, 
          mensaje: 'El usuario ya existe', 
          usuario: userData 
        });
      } else {
        return res.status(500).send({ 
          error: 'Error al recuperar datos del usuario' 
        });
      }
    } else {
      return res.status(200).send({ 
        isValid: false, 
        mensaje: 'El usuario no existe' 
      });
    }
  } catch (error) {
    console.error('Error en el proceso de inicio de sesión:', error);
    return res.status(500).send({ error: 'Error en el proceso de inicio de sesión' });
  }
});

module.exports = router;
