// Importar y configurar variables de entorno (dotenv) desde el archivo .env
require('dotenv').config();

// Importaciones principales de librerías
const express = require('express');
const cors = require('cors');

// Importar conexión a base de datos (esto verificará y preparará la configuración de DB)
const pool = require('./db');

// Importar los módulos de enrutamiento
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const doctoresRoutes = require('./routes/doctores');
const pacientesRoutes = require('./routes/pacientes');
const citasRoutes = require('./routes/citas');
const historialRoutes = require('./routes/historial');

// Inicializar la aplicación de Express
const app = express();

/**
 * Configurar Middlewares Globales
 */

// Habilitar CORS (Cross-Origin Resource Sharing)
// Permite que un frontend en distinto dominio/puerto acceda a nuestra API
app.use(cors({
    origin: process.env.FRONTEND_URL || '*'
}));

// Habilitar el parseo de JSON en el cuerpo de las peticiones HTTP (req.body)
app.use(express.json());

/**
 * Montar rutas de la API
 * Cada conjunto de rutas será manejado bajo un prefijo '/api/...'
 */
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/doctores', doctoresRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/historial', historialRoutes);

/**
 * GET /api/health
 * Endpoint ligero para que balanceadores de carga o servicios de monitorización
 * puedan verificar rápidamente si la aplicación está encendida y corriendo.
 */
app.get('/api/health', (req, res) => {
    res.json({ estado: 'Servidor operativo', tiempo: new Date() });
});

// Definir el puerto de escucha utilizando variables de entorno o un puerto por defecto (3000)
const PORT = process.env.PORT || 3000;

// Arrancar el servidor
app.listen(PORT, () => {
    console.log(`Servidor de la clínica ejecutándose en el puerto ${PORT}`);
});
