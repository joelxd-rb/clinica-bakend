const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificar, adminODoctor } = require('../middleware/auth');

/**
 * POST /
 * Requiere estar autenticado y ser Admin o Doctor.
 * Programa una nueva cita. Verifica antes que no haya una colisión de horario
 * (otra cita del mismo doctor a menos de 30 minutos que no esté cancelada).
 */
router.post('/', verificar, adminODoctor, async (req, res) => {
    const { id_doctor, id_paciente, fecha_hora, motivo } = req.body;
    
    try {
        // Verificar colisión de citas para el doctor en el rango de +/- 30 minutos de la hora solicitada
        // Se excluyen las citas con estado 'cancelada'
        const colisionResult = await pool.query(
            `SELECT id FROM citas 
             WHERE id_doctor = $1 
               AND LOWER(estado) != 'cancelada'
               AND fecha_hora BETWEEN ($2::timestamp - INTERVAL '30 minutes') 
                                  AND ($2::timestamp + INTERVAL '30 minutes')`,
            [id_doctor, fecha_hora]
        );

        // Si se encuentra alguna cita en ese lapso de tiempo, retornar error 409 Conflict
        if (colisionResult.rows.length > 0) {
            return res.status(409).json({ mensaje: 'Existe un conflicto de horario para este doctor en ese periodo.' });
        }

        // Si no hay colisiones, procedemos a insertar la nueva cita
        const insertResult = await pool.query(
            `INSERT INTO citas (id_doctor, id_paciente, fecha_hora, motivo) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [id_doctor, id_paciente, fecha_hora, motivo]
        );

        res.status(201).json({
            mensaje: 'Cita programada con éxito',
            cita: insertResult.rows[0]
        });

    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

/**
 * GET /
 * Requiere estar autenticado.
 * Retorna las citas. Si se envía el query ?fecha=YYYY-MM-DD filtra por ese día.
 * Si el usuario es Doctor, solo obtiene sus propias citas; si es Admin, obtiene todas.
 */
router.get('/', verificar, async (req, res) => {
    const { fecha } = req.query;
    try {
        let baseQuery = `
            SELECT c.id, c.id_doctor, c.id_paciente, c.fecha_hora, c.motivo, c.estado, c.solo_doctor, 
                   d.nombre AS doctor_nombre, d.apellidos AS doctor_apellidos,
                   p.nombre AS paciente_nombre, p.apellidos AS paciente_apellidos
            FROM citas c
            JOIN doctores d ON c.id_doctor = d.uid
            JOIN pacientes p ON c.id_paciente = p.id
            WHERE 1 = 1
        `;
        const queryParams = [];
        let paramCount = 1;

        // Si se provee una fecha, filtramos usando la función DATE de PostgreSQL
        if (fecha) {
            baseQuery += ` AND DATE(c.fecha_hora) = $${paramCount}`;
            queryParams.push(fecha);
            paramCount++;
        }

        // Si el usuario es un Doctor, se restringe a visualizar solo sus citas
        if (req.user.rol === 'Doctor') {
            baseQuery += ` AND c.id_doctor = $${paramCount}`;
            queryParams.push(req.user.id_doctor);
            paramCount++;
        }

        baseQuery += ` ORDER BY c.fecha_hora ASC`;

        const result = await pool.query(baseQuery, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al listar citas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

/**
 * PATCH /:id/estado
 * Requiere estar autenticado.
 * Permite cambiar el estado de la cita ('pendiente', 'completada', 'cancelada')
 * y la bandera 'solo_doctor'. Un admin puede cambiar cualquiera, 
 * pero un doctor solo puede cambiar las citas que le pertenecen.
 */
router.patch('/:id/estado', verificar, async (req, res) => {
    const { id } = req.params;
    const { estado, solo_doctor } = req.body;

    try {
        // En base al rol del usuario aplicamos lógica distinta
        if (req.user.rol === 'Doctor') {
            // Un doctor solo puede actualizar la cita si él es el responsable de la misma
            const result = await pool.query(
                `UPDATE citas 
                 SET estado = COALESCE($1, estado), 
                     solo_doctor = COALESCE($2, solo_doctor) 
                 WHERE id = $3 AND id_doctor = $4 RETURNING *`,
                [estado, solo_doctor, id, req.user.id_doctor]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({ mensaje: 'No tiene permiso para modificar esta cita o la cita no existe.' });
            }
            return res.json({ mensaje: 'Cita actualizada exitosamente', cita: result.rows[0] });
        } else if (req.user.rol === 'Admin') {
            // Un administrador puede actualizar cualquier cita sin importar el doctor
            const result = await pool.query(
                `UPDATE citas 
                 SET estado = COALESCE($1, estado), 
                     solo_doctor = COALESCE($2, solo_doctor) 
                 WHERE id = $3 RETURNING *`,
                [estado, solo_doctor, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ mensaje: 'Cita no encontrada.' });
            }
            return res.json({ mensaje: 'Cita actualizada exitosamente', cita: result.rows[0] });
        }
    } catch (error) {
        console.error('Error al actualizar estado de la cita:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

/**
 * DELETE /:id
 * Permite eliminar una cita.
 */
router.delete('/:id', verificar, adminODoctor, async (req, res) => {
    try {
        await pool.query('DELETE FROM citas WHERE id = $1', [req.params.id]);
        res.json({ mensaje: 'Cita eliminada' });
    } catch (e) {
        res.status(500).json({ mensaje: 'Error interno' });
    }
});

module.exports = router;
