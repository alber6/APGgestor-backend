const fs = require('fs'); // modulo nativo de node para leer y escribir archivos
const path = require('path'); //modulo para gestionar rutas de carpetas de forma segura
const mongoose = require('mongoose'); // conectarse y guardar en la base de datos de mongo
const csv = require('csv-parser'); // libreria externa que convierte texto de un csv a json
require('dotenv').config(); //para cargar variables secretas del archivo .env

// hay que importar los modelos de mongoose para interactuar con sus colecciones
const User = require('./src/api/models/User');
const Operator = require('./src/api/models/Operator');
const Customer = require('./src/api/models/Customer');
const Job = require('./src/api/models/Job');

// conexión a la base de datos de mongo con la direccion que tenemos en .env
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🌱 Conectado a mongo para sembrar seed'))
    .catch((error) => console.log('❌ Error en la conexión:', error));

// función para leer cualquier archivo csv de la carpeta data
// transforma el archivo de texto en una lista array
const readCSV = (fileName) => {
    return new Promise((resolve, reject) => {
        const results = [];
        // se abre el flujo de lectura del archivo dentro de la carpeta data
        fs.createReadStream(path.join(__dirname, 'data', fileName))
            .pipe(csv()) //pasamos el texto por el filtro de csv-parser para trocearlo por comas
            .on('data', (data) => results.push(data)) // cada fila que lee lo mete al array
            .on('end', () => resolve(results)) //cuanto termina de leer, devuelve los datos
            .on('error', (error) => reject(error)); //si hay algún fallo
    });
};

// función asíncrona que coordina toda la inyección de los datos
const seedDataBase = async () => {
    try {
        // primero limpiar la base de datos para evitar duplicados por si se ejecuta por error dos veces 
        await Operator.deleteMany({});
        await Customer.deleteMany({});
        await Job.deleteMany({});
        await User.deleteMany({});
        console.log('Base de datos limpia, colecciones vacías')

        // leer archivos csv -> llamar a la función para cargar los datos
        const operatorData = await readCSV('operators.csv');
        const customerData = await readCSV('customers.csv');
        const jobData = await readCSV('jobs.csv');
        const usersData = await readCSV('users.csv'); // 🌟 MODIFICACIÓN: Cargamos el CSV de usuarios

        // añadir operarios y clientes independientemente
        //como datos csv tienen formato string, usamos .map() para transformar ids o disponibilidad a números o booleanos
        const operators = await Operator.insertMany(operatorData.map(op => ({
            id_operario: Number(op.id_operario),
            nombre: op.nombre,
            especialidad: op.especialidad,
            disponibilidad: op.disponibilidad === 'true' //si el texto es 'true', guarda true
        })));

        const customers = await Customer.insertMany(customerData.map(c => ({
            id_cliente: Number(c.id_cliente),
            nombre: c.nombre,
            telefono: c.telefono,
            email: c.email,
            direccion: c.direccion,
            tipo_vivienda: c.tipo_vivienda
        })));

        console.log(`✅ ${operators.length} Operarios y ${customers.length} clientes añadidos con éxito`);

        // Mapeamos los usuarios del CSV y cruzamos el id_operario_vinculado con el _id real de mongo
        const finalUsers = usersData.map(u => {
            const dbOperator = u.id_operario_vinculado 
                ? operators.find(o => o.id_operario === Number(u.id_operario_vinculado)) 
                : null;

            return {
                email: u.email,
                password: u.password,
                nombre: u.nombre,
                rol: u.rol,
                operarioId: dbOperator ? dbOperator._id : null // Si no tiene operario (como tu padre), se guarda null
            };
        });

        await User.insertMany(finalUsers);
        console.log(`🔒 Éxito: ${finalUsers.length} Usuarios de acceso sembrados desde el CSV`);

        // CREAR LAS RELACIONES DE LAS ÓRDENES DE TRABAJO
        // los trabajadores necesitan el id de mongo del cliente y del operario
        const finalJobs = []

        // recorremos los trabajos que venían del csv
        for (const job of jobData){
            // buscar clientes que guardados en mongo que coinciden con el id_cliente del csv
            const dbCustomer = customers.find(c => c.id_cliente === Number(job.id_cliente));
            // se hace lo mismo con operarios, buscar id_operario que coincide con id_operario del csv de job
            const dbOperator = operators.find(op => op.id_operario === Number(job.id_operario));

            // si encontramos a ambos en la base de datos, montamos el objeto final relacionándolos
            if ( dbCustomer && dbOperator) {
                finalJobs.push({
                    id_trabajo: Number(job.id_trabajo),
                    tipo_instalacion: job.tipo_instalacion,
                    cliente: dbCustomer._id,
                    operario: dbOperator._id,
                    estado: job.estado,
                    precio: Number(job.precio),
                    fecha: new Date(job.fecha),
                    notas: job.notas
                });
            }
        }

        // inyectamos todas las órdenes de trabajo ya relacionados con mongo
        await Job.insertMany(finalJobs);
        console.log(`🚀 Éxito: ${finalJobs.length} Órdenes de trabajo relacionadas y añadidas`)

        // cerramos la conexión con la base de datos para que el script termine
        mongoose.connection.close();
        console.log('Conexión a mongo cerrada correctamente')
    } catch (error) {
        // si falla en cualquier momento, capturamos el error
        console.error('❌ Error añadiendo la semilla a la base de datos:', error);
        mongoose.connection.close()
    }
};

// arrancar el script
seedDataBase();