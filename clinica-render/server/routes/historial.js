const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificar, soloDoctor } = require('../middleware/auth');

/**
 * POST /
 * Requiere estar autenticado y tener rol 'Doctor'.
 * Agrega un nuevo registro al historial médico de un paciente tras una consulta.
 * El ID del doctor se extrae obligatoriamente del token del usuario (req.user.uid) 
 * por razones de seguridad (evita que un doctor genere un historial a nombre de otro).
 */
router.post('/', verificar, soloDoctor, async (req, res) => {
    const { id_paciente, diagnostico, tratamiento, notas } = req.body;
    // Usar obligatoriamente el id_doctor provisto por el token validado (asociado a la cuenta del doctor logueado)
    const id_doctor = req.user.id_doctor; 
    
    try {
        const result = await pool.query(
            `INSERT INTO historial (id_paciente, id_doctor, diagnostico, tratamiento, notas) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [id_paciente, id_doctor, diagnostico, tratamiento, notas]
        );

        res.status(201).json({
            mensaje: 'Registro de historial creado exitosamente',
            historial: result.rows[0]
        });
    } catch (error) {
        console.error('Error al crear historial médico:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

/**
 * GET /paciente/:id_paciente
 * Requiere estar autenticado.
 * Consulta todos los registros del historial de un paciente específico,
 * haciendo JOIN con doctores para incluir el nombre completo del doctor tratante.
 * Retorna los registros en orden cronológico descendente (los más recientes primero).
 */
router.get('/paciente/:id_paciente', verificar, async (req, res) => {
    const { id_paciente } = req.params;

    try {
        const result = await pool.query(
            `SELECT h.id, h.fecha_consulta, h.diagnostico, h.tratamiento, h.notas,
                    d.nombre AS doctor_nombre, d.apellidos AS doctor_apellidos
             FROM historial h
             LEFT JOIN doctores d ON h.id_doctor = d.uid
             WHERE h.id_paciente = $1
             ORDER BY h.fecha_consulta DESC`,
            [id_paciente]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener historial del paciente:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

module.exports = router;
