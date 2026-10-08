const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/api/models/User');
const Customer = require('./src/api/models/Customer');
const Job = require('./src/api/models/Job');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🌱 Conectado a mongo para sembrar datos JSON'))
    .catch((error) => console.log('❌ Error en la conexión:', error));

const seedDataBase = async () => {
    try {
        await Customer.deleteMany({});
        await Job.deleteMany({});
        await User.deleteMany({});
        console.log('🧹 Base de datos limpia, colecciones vacías.');

        // Crear Usuarios (Admins y Operarios)
        const usersData = [
            { nombre: 'Admin', password: 'admin', rol: 'admin' },
            { nombre: 'Carlos Gómez', password: '1234', rol: 'operario' },
            { nombre: 'Manuel López', password: '1234', rol: 'operario' }
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

        mongoose.connection.close();
        console.log('✅ Sembrado completado. Conexión cerrada.');
    } catch (error) {
        console.error('❌ Error sembrando la base de datos:', error);
        mongoose.connection.close();
    }
};

seedDataBase();