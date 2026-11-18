// Script para crear el primer usuario Administrador en la base de datos de Render
// Ejecutar UNA SOLA VEZ con: node crear_admin.js

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const run = async () => {
    const client = new Client({
        connectionString: 'postgresql://clinica_bd_v9iw_user:UaiXtZkWOpHd8Nn9CpmuuShroX5SETyz@dpg-daru1sbbc2fs738htad0-a.oregon-postgres.render.com/clinica_bd_v9iw',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Conectado a la base de datos...');

        // Hashear la contraseña con bcrypt (10 rondas de seguridad)
        const passwordHash = await bcrypt.hash('Clinica-entorno117', 10);

        // Insertar el usuario administrador
        // El email es la clave de acceso al sistema
        const result = await client.query(
            `INSERT INTO usuarios (email, password_hash, rol, activo)
             VALUES ($1, $2, 'Admin', true)
             ON CONFLICT (email) DO UPDATE SET password_hash = $2
             RETURNING uid, email, rol`,
            ['admin_mod@clinica.com', passwordHash]
        );

        console.log('✅ Usuario Admin creado exitosamente:');
        console.log('   Email:      admin_mod@clinica.com');
        console.log('   Contraseña: Clinica-entorno117');
        console.log('   Rol:        Admin');
        console.log('   UID:        ' + result.rows[0].uid);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
};

run();
