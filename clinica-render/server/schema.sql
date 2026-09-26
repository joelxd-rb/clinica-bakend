-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
-- Almacena las credenciales y el rol de cada usuario en el sistema.
CREATE TABLE usuarios (
    uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) CHECK (rol IN ('Admin', 'Doctor')) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de doctores
-- Almacena la información específica de los doctores. Su llave primaria también es llave foránea hacia usuarios.
CREATE TABLE doctores (
    uid UUID PRIMARY KEY REFERENCES usuarios(uid) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    cedula_profesional VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255)
);

-- Tabla de pacientes
-- Almacena los datos personales de los pacientes.
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de citas
-- Registra las citas programadas entre un doctor y un paciente.
CREATE TABLE citas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_doctor UUID REFERENCES doctores(uid) ON DELETE CASCADE,
    id_paciente UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    fecha_hora TIMESTAMP NOT NULL,
    motivo TEXT,
    estado VARCHAR(50) CHECK (estado IN ('pendiente', 'completada', 'cancelada')) DEFAULT 'pendiente',
    solo_doctor BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de historial
-- Registra las consultas médicas pasadas, sus diagnósticos, tratamientos y notas.
CREATE TABLE historial (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_paciente UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    id_doctor UUID REFERENCES doctores(uid) ON DELETE SET NULL,
    fecha_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT NOT NULL,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
