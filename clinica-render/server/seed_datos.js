// Script para insertar datos de prueba en la base de datos de Render
// Ejecutar con: node seed_datos.js

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const run = async () => {
    const client = new Client({
        connectionString: 'postgresql://clinica_bd_v9iw_user:UaiXtZkWOpHd8Nn9CpmuuShroX5SETyz@dpg-daru1sbbc2fs738htad0-a.oregon-postgres.render.com/clinica_bd_v9iw',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Conectado a la base de datos...\n');

        // ─────────────────────────────────────────
        // 1. CREAR DOCTOR DE PRUEBA
        // ─────────────────────────────────────────
        console.log('👨‍⚕️ Creando doctor de prueba...');
        const passDoctor = await bcrypt.hash('Doctor123', 10);

        const resUsuarioDoc = await client.query(`
            INSERT INTO usuarios (email, password_hash, rol, activo)
            VALUES ('dr.martinez@clinica.com', $1, 'Doctor', true)
            ON CONFLICT (email) DO UPDATE SET password_hash = $1
            RETURNING uid
        `, [passDoctor]);

        const uidDoctor = resUsuarioDoc.rows[0].uid;

        await client.query(`
            INSERT INTO doctores (uid, nombre, apellidos, especialidad, cedula_profesional, telefono, email)
            VALUES ($1, 'Carlos', 'Martínez López', 'Medicina General', 'CED-123456', '555-0101', 'dr.martinez@clinica.com')
            ON CONFLICT (uid) DO NOTHING
        `, [uidDoctor]);
        console.log('   ✔ Doctor: dr.martinez@clinica.com / Doctor123\n');

        // ─────────────────────────────────────────
        // 2. CREAR SEGUNDO DOCTOR
        // ─────────────────────────────────────────
        const passDoctor2 = await bcrypt.hash('Doctor456', 10);
        const resUsuarioDoc2 = await client.query(`
            INSERT INTO usuarios (email, password_hash, rol, activo)
            VALUES ('dra.gomez@clinica.com', $1, 'Doctor', true)
            ON CONFLICT (email) DO UPDATE SET password_hash = $1
            RETURNING uid
        `, [passDoctor2]);

        const uidDoctor2 = resUsuarioDoc2.rows[0].uid;

        await client.query(`
            INSERT INTO doctores (uid, nombre, apellidos, especialidad, cedula_profesional, telefono, email)
            VALUES ($1, 'Ana', 'Gómez Ruiz', 'Pediatría', 'CED-789012', '555-0202', 'dra.gomez@clinica.com')
            ON CONFLICT (uid) DO NOTHING
        `, [uidDoctor2]);
        console.log('   ✔ Doctora: dra.gomez@clinica.com / Doctor456\n');

        // ─────────────────────────────────────────
        // 3. CREAR PACIENTES DE PRUEBA
        // ─────────────────────────────────────────
        console.log('🧑 Creando pacientes de prueba...');
        const pacientes = [
            { nombre: 'Juan', apellidos: 'Pérez García', nacimiento: '1985-03-15', tel: '555-1111', email: 'juan.perez@email.com', dir: 'Calle Principal #123' },
            { nombre: 'María', apellidos: 'López Hernández', nacimiento: '1992-07-22', tel: '555-2222', email: 'maria.lopez@email.com', dir: 'Av. Reforma #456' },
            { nombre: 'Roberto', apellidos: 'Sánchez Torres', nacimiento: '1978-11-10', tel: '555-3333', email: 'roberto.s@email.com', dir: 'Calle Juárez #789' },
            { nombre: 'Laura', apellidos: 'Ramírez Vega', nacimiento: '2001-05-08', tel: '555-4444', email: 'laura.rv@email.com', dir: 'Blvd. Independencia #10' },
        ];

        const idsPacientes = [];
        for (const p of pacientes) {
            const res = await client.query(`
                INSERT INTO pacientes (nombre, apellidos, fecha_nacimiento, telefono, email, direccion)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, [p.nombre, p.apellidos, p.nacimiento, p.tel, p.email, p.dir]);
            idsPacientes.push(res.rows[0].id);
            console.log(`   ✔ Paciente: ${p.nombre} ${p.apellidos}`);
        }

        // ─────────────────────────────────────────
        // 4. CREAR CITAS DE HOY Y MAÑANA
        // ─────────────────────────────────────────
        console.log('\n📅 Creando citas...');
        const hoy = new Date();
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);

        const formatFecha = (date, hora) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d} ${hora}`;
        };

        const citas = [
            { doctor: uidDoctor,  paciente: idsPacientes[0], fecha: formatFecha(hoy, '09:00:00'),  motivo: 'Consulta general / revisión anual', estado: 'pendiente' },
            { doctor: uidDoctor,  paciente: idsPacientes[1], fecha: formatFecha(hoy, '10:30:00'),  motivo: 'Dolor de cabeza frecuente', estado: 'pendiente' },
            { doctor: uidDoctor,  paciente: idsPacientes[2], fecha: formatFecha(hoy, '12:00:00'),  motivo: 'Control de presión arterial', estado: 'completada' },
            { doctor: uidDoctor2, paciente: idsPacientes[3], fecha: formatFecha(hoy, '11:00:00'),  motivo: 'Revisión pediátrica rutinaria', estado: 'pendiente' },
            { doctor: uidDoctor,  paciente: idsPacientes[0], fecha: formatFecha(manana, '09:30:00'), motivo: 'Seguimiento tratamiento', estado: 'pendiente' },
            { doctor: uidDoctor2, paciente: idsPacientes[1], fecha: formatFecha(manana, '10:00:00'), motivo: 'Resultado de exámenes', estado: 'pendiente' },
        ];

        for (const c of citas) {
            await client.query(`
                INSERT INTO citas (id_doctor, id_paciente, fecha_hora, motivo, estado)
                VALUES ($1, $2, $3, $4, $5)
            `, [c.doctor, c.paciente, c.fecha, c.motivo, c.estado]);
            console.log(`   ✔ Cita a las ${c.fecha.split(' ')[1].slice(0,5)}: ${c.motivo}`);
        }

        // ─────────────────────────────────────────
        // 5. CREAR HISTORIAL MÉDICO
        // ─────────────────────────────────────────
        console.log('\n📋 Creando historial médico...');
        const historiales = [
            {
                paciente: idsPacientes[0], doctor: uidDoctor,
                fecha: '2026-08-10', diagnostico: 'Hipertensión arterial leve',
                tratamiento: 'Losartán 50mg, 1 tableta cada 24 horas',
                notas: 'Paciente refiere estrés laboral. Se recomienda ejercicio moderado y dieta baja en sodio.'
            },
            {
                paciente: idsPacientes[0], doctor: uidDoctor,
                fecha: '2026-07-05', diagnostico: 'Infección respiratoria superior',
                tratamiento: 'Amoxicilina 500mg cada 8h por 7 días, reposo',
                notas: 'Cuadro gripal con complicación bacteriana. Mejoría esperada en 5-7 días.'
            },
            {
                paciente: idsPacientes[1], doctor: uidDoctor,
                fecha: '2026-09-01', diagnostico: 'Migraña tensional',
                tratamiento: 'Ibuprofeno 400mg al inicio del dolor, máximo 3 veces al día',
                notas: 'Cefalea recurrente relacionada con trabajo en pantalla. Se recomienda pausas visuales.'
            },
            {
                paciente: idsPacientes[2], doctor: uidDoctor,
                fecha: '2026-09-15', diagnostico: 'Hipertensión controlada',
                tratamiento: 'Continuar con Amlodipino 5mg diario',
                notas: 'Presión en valores normales. Próxima revisión en 3 meses.'
            },
            {
                paciente: idsPacientes[3], doctor: uidDoctor2,
                fecha: '2026-09-20', diagnostico: 'Desarrollo normal para la edad',
                tratamiento: 'Vitamina D 400 UI diaria',
                notas: 'Revisión pediátrica de rutina. Peso y talla dentro de percentiles normales.'
            },
        ];

        for (const h of historiales) {
            await client.query(`
                INSERT INTO historial (id_paciente, id_doctor, fecha_consulta, diagnostico, tratamiento, notas)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [h.paciente, h.doctor, h.fecha, h.diagnostico, h.tratamiento, h.notas]);
            console.log(`   ✔ Historial: ${h.diagnostico}`);
        }

        // ─────────────────────────────────────────
        // RESUMEN FINAL
        // ─────────────────────────────────────────
        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║        DATOS DE PRUEBA INSERTADOS ✅          ║');
        console.log('╠══════════════════════════════════════════════╣');
        console.log('║  CREDENCIALES DE ACCESO:                     ║');
        console.log('║                                              ║');
        console.log('║  ADMIN:                                      ║');
        console.log('║    Email: admin_mod@clinica.com              ║');
        console.log('║    Pass:  Clinica-entorno117                 ║');
        console.log('║                                              ║');
        console.log('║  DOCTOR 1 (Medicina General):                ║');
        console.log('║    Email: dr.martinez@clinica.com            ║');
        console.log('║    Pass:  Doctor123                          ║');
        console.log('║                                              ║');
        console.log('║  DOCTOR 2 (Pediatría):                       ║');
        console.log('║    Email: dra.gomez@clinica.com              ║');
        console.log('║    Pass:  Doctor456                          ║');
        console.log('║                                              ║');
        console.log('║  4 Pacientes, 6 Citas, 5 Historiales        ║');
        console.log('╚══════════════════════════════════════════════╝');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
};

run();
