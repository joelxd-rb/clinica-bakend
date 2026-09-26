const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar la validez del token JWT enviado en los headers.
 * Extrae el token del header 'Authorization', lo verifica y guarda el payload en req.user.
 */
const verificar = (req, res, next) => {
    // Obtener el header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ mensaje: 'No autorizado. Token no proporcionado.' });
    }

    // Extraer el token de la cadena 'Bearer <token>'
    const token = authHeader.split(' ')[1];

    try {
        // Verificar y decodificar el token usando la clave secreta
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // Asignar el payload (uid, email, rol, id_doctor) al objeto req para usarlo en las siguientes rutas
        req.user = payload;
        next(); // Continuar con la ejecución de la siguiente función middleware o controlador
    } catch (error) {
        console.error('Error al verificar token:', error);
        return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
    }
};

/**
 * Middleware que permite el paso solo a usuarios con rol 'Admin'.
 * Se debe usar DESPUÉS de 'verificar'.
 */
const soloAdmin = (req, res, next) => {
    if (req.user && req.user.rol === 'Admin') {
        next(); // El usuario es admin, puede continuar
    } else {
        return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol Admin.' });
    }
};

/**
 * Middleware que permite el paso solo a usuarios con rol 'Doctor'.
 * Se debe usar DESPUÉS de 'verificar'.
 */
const soloDoctor = (req, res, next) => {
    if (req.user && req.user.rol === 'Doctor') {
        next(); // El usuario es doctor, puede continuar
    } else {
        return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol Doctor.' });
    }
};

/**
 * Middleware que permite el paso a usuarios que tengan rol 'Admin' O 'Doctor'.
 * Se debe usar DESPUÉS de 'verificar'.
 */
const adminODoctor = (req, res, next) => {
    if (req.user && (req.user.rol === 'Admin' || req.user.rol === 'Doctor')) {
        next(); // El usuario tiene un rol válido, puede continuar
    } else {
        return res.status(403).json({ mensaje: 'Acceso denegado. Rol insuficiente.' });
    }
};

// Exportar todos los middlewares para usarlos en las rutas
module.exports = {
    verificar,
    soloAdmin,
    soloDoctor,
    adminODoctor
};
