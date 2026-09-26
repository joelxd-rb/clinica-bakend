const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificar, adminODoctor } = require('../middleware/auth');

/**
 * POST /
 * Requiere estar autenticado y ser Admin o Doctor.
 * Inserta un nuevo paciente en la base de datos.
 */
router.post('/', verificar, adminODoctor, async (req, res) => {
    const { nombre, apellidos, fecha_nacimiento, telefono, email, direccion } = req.body;
    try {
        // Insertar el paciente y retornar sus datos (incluyendo el ID generado automáticamente)
        const result = await pool.query(
            `INSERT INTO pacientes (nombre, apellidos, fecha_nacimiento, telefono, email, direccion) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [nombre, apellidos, fecha_nacimiento, telefono, email, direccion]
        );
        res.status(201).json({
            mensaje: 'Paciente registrado exitosamente',
            paciente: result.rows[0]
        });
    } catch (error) {
        console.error('Error al registrar paciente:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

/**
 * GET /
 * Requiere estar autenticado.
 * Retorna todos los pacientes o filtra si se envía el query string "?buscar=".
 * El filtro busca coincidencias (case-insensitive) en nombre, apellidos o teléfono usando ILIKE.
 */
router.get('/', verificar, async (req, res) => {
    const { buscar } = req.query;
    try {
        let result;
        if (buscar) {
            // Se usa % alrededor de la cadena para buscar subcadenas
            const patronBusqueda = `%${buscar}%`;
            result = await pool.query(
                `SELECT * FROM pacientes 
                 WHERE nombre ILIKE $1 
                    OR apellidos ILIKE $1 
                    OR telefono ILIKE $1 
                 ORDER BY apellidos ASC, nombre ASC`,
                [patronBusqueda]
            );
        } else {
            // Si no hay parámetro de búsqueda, retornar todos los pacientes
            result = await pool.query('SELECT * FROM pacientes ORDER BY apellidos ASC, nombre ASC');
        }
        res.json(result.rows);
    } catch (error) {
        console.error('Error al listar pacientes:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

/**
 * GET /:id
 * Requiere estar autenticado.
 * Retorna los detalles de un paciente específico por su UUID.
 */
router.get('/:id', verificar, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM pacientes WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Paciente no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener paciente:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

/**
 * PUT /:id
 * Requiere estar autenticado y ser Admin o Doctor.
 * Actualiza los datos personales de un paciente por su UUID.
 */
router.put('/:id', verificar, adminODoctor, async (req, res) => {
    const { id } = req.params;
    const { nombre, apellidos, fecha_nacimiento, telefono, email, direccion } = req.body;
    try {
        const result = await pool.query(
            `UPDATE pacientes 
             SET nombre = $1, apellidos = $2, fecha_nacimiento = $3, telefono = $4, email = $5, direccion = $6 
             WHERE id = $7 RETURNING *`,
            [nombre, apellidos, fecha_nacimiento, telefono, email, direccion, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Paciente no encontrado' });
        }
        
        res.json({
            mensaje: 'Datos de paciente actualizados exitosamente',
            paciente: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar paciente:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

module.exports = router;
