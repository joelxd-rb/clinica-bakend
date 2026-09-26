const fs = require('fs');
const { Client } = require('pg');

const run = async () => {
    console.log("Conectando a PostgreSQL en Render...");
    const client = new Client({
        connectionString: 'postgresql://clinica_bd_v9iw_user:UaiXtZkWOpHd8Nn9CpmuuShroX5SETyz@dpg-daru1sbbc2fs738htad0-a.oregon-postgres.render.com/clinica_bd_v9iw',
        ssl: { rejectUnauthorized: false } // Requerido por Render
    });

    try {
        await client.connect();
        console.log("Conexión exitosa.");
        
        const sql = fs.readFileSync('schema.sql', 'utf8');
        console.log("Inyectando tablas...");
        
        await client.query(sql);
        console.log("¡Tablas y estructura creadas con éxito!");
        
    } catch (error) {
        console.error("Error ejecutando el SQL:", error);
    } finally {
        await client.end();
    }
};

run();
