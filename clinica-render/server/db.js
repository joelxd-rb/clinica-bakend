// Importar la clase Pool del paquete 'pg' (node-postgres)
const { Pool } = require('pg');

// Crear una nueva instancia de Pool con la cadena de conexión de las variables de entorno
// Se usa DATABASE_URL para conectarse al servidor de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Event listener para manejar errores inesperados en los clientes inactivos del pool
pool.on('error', (err, client) => {
    console.error('Error inesperado en el cliente de la base de datos', err);
    process.exit(-1);
});

// Exportar el pool para que otros módulos (como las rutas) puedan ejecutar consultas
module.exports = pool;
