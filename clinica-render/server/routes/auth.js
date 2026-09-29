const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { verificar } = require('../middleware/auth');

/**
 * POST /login
 * Busca un usuario por su email, verifica la contraseña y si es correcta
 * genera y retorna un token JWT que expira en 8 horas.
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Consultar el usuario en la base de datos por email
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        // Verificar si el usuario existe
        if (result.rows.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];

        // Comprobar que el usuario esté activo
        if (!usuario.activo) {
            return res.status(403).json({ mensaje: 'Cuenta desactivada. Contacte al administrador.' });
        }

        // Comparar la contraseña ingresada con el hash almacenado en la DB usando bcrypt
        const esValida = await bcrypt.compare(password, usuario.password_hash);
        if (!esValida) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        // Si es doctor, el id_doctor será igual al uid (ya que comparten la misma llave primaria)
        const id_doctor = usuario.rol === 'Doctor' ? usuario.uid : null;

        // Generar el payload del JWT con información útil
        const payload = {
            uid: usuario.uid,
            email: usuario.email,
            rol: usuario.rol,
            id_doctor: id_doctor
        };

        // Firmar el JWT usando la clave secreta y definir la expiración en 8 horas
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        // Devolver el token junto con algunos datos básicos del usuario
        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                uid: usuario.uid,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en /login:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

/**
 * GET /perfil
 * Requiere el middleware verificar.
 * Retorna los datos básicos del usuario autenticado basándose en req.user (extraído del token).
 */
router.get('/perfil', verificar, async (req, res) => {
    try {
        // Se puede hacer una consulta adicional si se requieren datos actualizados
        // Aquí retornamos los datos ya presentes en el token para ser más eficientes
        res.json({
            uid: req.user.uid,
            email: req.user.email,
            rol: req.user.rol,
            id_doctor: req.user.id_doctor
        });
    } catch (error) {
        console.error('Error en /perfil:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

module.exports = router;
