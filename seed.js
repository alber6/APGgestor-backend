const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/api/models/User');
const Customer = require('./src/api/models/Customer');
const Job = require('./src/api/models/Job');
const TimeRecord = require('./src/api/models/TimeRecord');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🌱 Conectado a mongo para sembrar datos JSON'))
    .catch((error) => console.log('❌ Error en la conexión:', error));

const seedDataBase = async () => {
    try {
        await Customer.deleteMany({});
        await Job.deleteMany({});
        await User.deleteMany({});
        await TimeRecord.deleteMany({});
        console.log('🧹 Base de datos limpia, colecciones vacías.');

        // Crear Usuarios (Admins y Operarios)
        const usersData = [
            { nombre: 'Admin', password: 'admin', rol: 'admin', dni: '00000000T' },
            { nombre: 'Carlos Gómez', password: '1234', rol: 'operario', dni: '47289192K' },
            { nombre: 'Manuel López', password: '1234', rol: 'operario', dni: '52938174M' }
        ];
        const users = await User.insertMany(usersData);
        console.log(`🔒 Éxito: ${users.length} Usuarios iniciales creados.`);

        const operarioCarlos = users.find(u => u.nombre === 'Carlos Gómez');
        const operarioManuel = users.find(u => u.nombre === 'Manuel López');

        // Crear Clientes
        const customersData = [
            {
                id_cliente: 101,
                nif: '12345678Z',
                nombre: 'Juan Pérez',
                telefono: '600111222',
                email: 'juan.perez@example.com',
                direccion_fiscal: 'Calle Mayor 12',
                localidad: 'Madrid',
                provincia: 'Madrid',
                cp: '28001',
                direccion: 'Calle Mayor 12, Madrid',
                tipo_vivienda: 'Chalet'
            },
            {
                id_cliente: 102,
                nif: 'B98765432',
                nombre: 'Coarsa S.L.',
                telefono: '912345678',
                email: 'contacto@coarsa.com',
                direccion_fiscal: 'Av. Industria 45',
                localidad: 'Alcorcón',
                provincia: 'Madrid',
                cp: '28923',
                direccion: 'Av. Industria 45, Polígono Nord',
                tipo_vivienda: 'Industrial / Nave'
            }
        ];
        const customers = await Customer.insertMany(customersData);
        console.log(`👥 Éxito: ${customers.length} Clientes iniciales creados.`);

        // Crear Trabajos / Obras
        const jobsData = [
            {
                id_trabajo: 1001,
                tipo_instalacion: 'Placas Solares',
                direccion_obra: 'Calle Gran Vía 15, Tejado Principal',
                localidad_obra: 'Madrid',
                cp_obra: '28013',
                provincia_obra: 'Madrid',
                cliente: customers[0]._id,
                operario: operarioCarlos ? operarioCarlos._id : null,
                estado: 'En proceso',
                precio: 4500,
                fecha: new Date(),
                notas: 'Instalación de 8 paneles solares en tejado.'
            },
            {
                id_trabajo: 1002,
                tipo_instalacion: 'Cargador Coche',
                direccion_obra: 'Av. Industria 45, Nave 3',
                localidad_obra: 'Alcorcón',
                cp_obra: '28923',
                provincia_obra: 'Madrid',
                cliente: customers[1]._id,
                operario: operarioManuel ? operarioManuel._id : null,
                estado: 'Pendiente',
                precio: 1200,
                fecha: new Date(),
                notas: 'Instalar punto de recarga rápido de 22kW.'
            }
        ];
        await Job.insertMany(jobsData);
        console.log(`🚀 Éxito: ${jobsData.length} Órdenes de trabajo creadas.`);

        // Sembrar Fichajes de Ejemplo para Demostración e Inspección de Trabajo
        if (operarioCarlos && users[0]) {
            const hoy = new Date().toISOString().split('T')[0];
            const timeRecordsData = [
                {
                    usuario: operarioCarlos._id,
                    tipo: 'ENTRADA',
                    timestamp: new Date(`${hoy}T08:00:00.000Z`),
                    fecha: hoy,
                    geolocalizacion: {
                        latitud: 40.4168,
                        longitud: -3.7038,
                        precision: 10,
                        capturada: true,
                        direccionAprox: 'Puerta del Sol, Madrid'
                    },
                    dispositivo: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5)',
                    origen: 'dispositivo',
                    observaciones: 'Entrada en punto al inicio de jornada.'
                },
                {
                    usuario: operarioCarlos._id,
                    tipo: 'PAUSA_INICIO',
                    timestamp: new Date(`${hoy}T13:30:00.000Z`),
                    fecha: hoy,
                    geolocalizacion: {
                        latitud: 40.4170,
                        longitud: -3.7035,
                        precision: 12,
                        capturada: true,
                        direccionAprox: 'Madrid Centro'
                    },
                    dispositivo: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5)',
                    origen: 'dispositivo',
                    observaciones: 'Pausa para almuerzo'
                },
                {
                    usuario: operarioCarlos._id,
                    tipo: 'PAUSA_FIN',
                    timestamp: new Date(`${hoy}T14:15:00.000Z`),
                    fecha: hoy,
                    geolocalizacion: {
                        latitud: 40.4170,
                        longitud: -3.7035,
                        precision: 12,
                        capturada: true,
                        direccionAprox: 'Madrid Centro'
                    },
                    dispositivo: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5)',
                    origen: 'dispositivo',
                    observaciones: 'Fin de almuerzo y reanudación'
                },
                {
                    usuario: operarioCarlos._id,
                    tipo: 'SALIDA',
                    timestamp: new Date(`${hoy}T17:15:00.000Z`),
                    fecha: hoy,
                    geolocalizacion: {
                        latitud: 40.4168,
                        longitud: -3.7038,
                        precision: 10,
                        capturada: true,
                        direccionAprox: 'Puerta del Sol, Madrid'
                    },
                    dispositivo: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5)',
                    origen: 'dispositivo',
                    observaciones: 'Fin de jornada laboral'
                }
            ];
            await TimeRecord.insertMany(timeRecordsData);
            console.log(`⏰ Éxito: ${timeRecordsData.length} Registros horarios iniciales sembrados.`);
        }

        mongoose.connection.close();
        console.log('✅ Sembrado completado. Conexión cerrada.');
    } catch (error) {
        console.error('❌ Error sembrando la base de datos:', error);
        mongoose.connection.close();
    }
};

seedDataBase();