const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificar, soloAdmin } = require('../middleware/auth');

/**
 * PUT /:uid/estado
 * Requiere que el usuario esté autenticado y sea 'Admin'.
 * Permite cambiar el estado de cuenta (activo o inactivo) de un usuario por su UID.
 */
router.put('/:uid/estado', verificar, soloAdmin, async (req, res) => {
    const { uid } = req.params;
    const { activo } = req.body;

    // Verificar que el estado enviado sea de tipo booleano
    if (typeof activo !== 'boolean') {
        return res.status(400).json({ mensaje: 'El campo "activo" debe ser un booleano (true/false)' });
    }

    try {
        // Actualizar el estado del usuario en la base de datos
        const result = await pool.query(
            'UPDATE usuarios SET activo = $1 WHERE uid = $2 RETURNING uid, email, activo',
            [activo, uid]
        );

        // Si no se encontró ningún usuario con el uid dado
        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // Retornar éxito junto con los datos actualizados del usuario
        res.json({
            mensaje: 'Estado del usuario actualizado exitosamente',
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error('Error al actualizar estado del usuario:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

module.exports = router;
