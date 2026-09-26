const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { verificar, soloAdmin } = require('../middleware/auth');

/**
 * POST /
 * Requiere que el usuario esté autenticado y sea 'Admin'.
 * Crea un nuevo usuario y posteriormente un registro de doctor vinculado dentro de una transacción PostgreSQL.
 */
router.post('/', verificar, soloAdmin, async (req, res) => {
    const { email, password, nombre, apellidos, especialidad, cedula_profesional, telefono } = req.body;
    
    // Iniciar el cliente de conexión para controlar la transacción manualmente
    const client = await pool.connect();
    try {
        // Empezar transacción
        await client.query('BEGIN');

        // Generar hash de la contraseña con bcrypt y 10 rondas de salt
        const password_hash = await bcrypt.hash(password, 10);

        // 1. Insertar en la tabla de usuarios
        const userResult = await client.query(
            `INSERT INTO usuarios (email, password_hash, rol) 
             VALUES ($1, $2, 'Doctor') RETURNING uid`,
            [email, password_hash]
        );
        const uid = userResult.rows[0].uid;

        // 2. Insertar en la tabla de doctores utilizando el uid del usuario recién creado
        await client.query(
            `INSERT INTO doctores (uid, nombre, apellidos, especialidad, cedula_profesional, telefono, email) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [uid, nombre, apellidos, especialidad, cedula_profesional, telefono, email]
        );

        // Si todo fue exitoso, confirmar los cambios
        await client.query('COMMIT');
        
        res.status(201).json({ mensaje: 'Doctor creado exitosamente', uid });
    } catch (error) {
        // En caso de cualquier error, hacer rollback para deshacer los cambios
        await client.query('ROLLBACK');
        console.error('Error al crear doctor:', error);
        // Manejar errores de unicidad (ej. email o cedula repetidos)
        if (error.code === '23505') {
            return res.status(409).json({ mensaje: 'El email o la cédula profesional ya existen.' });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    } finally {
        // Liberar siempre el cliente para que vuelva al pool
        client.release();
    }
});

/**
 * GET /
 * Requiere estar autenticado.
 * Retorna la lista de todos los doctores realizando un JOIN con la tabla usuarios
 * para incluir el estado de la cuenta (activo/inactivo).
 */
router.get('/', verificar, async (req, res) => {
    try {
        // Consulta SQL combinando información de 'doctores' y 'usuarios'
        const result = await pool.query(`
            SELECT d.uid, d.nombre, d.apellidos, d.especialidad, d.cedula_profesional, d.telefono, d.email, u.activo 
            FROM doctores d
            JOIN usuarios u ON d.uid = u.uid
            ORDER BY d.nombre ASC, d.apellidos ASC
        `);
        
        // Devolver la lista de doctores encontrados
        res.json(result.rows);
    } catch (error) {
        console.error('Error al listar doctores:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

module.exports = router;
