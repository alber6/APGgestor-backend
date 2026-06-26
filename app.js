const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// middleware configuraciones de seguridad y lectura de datos
app.use(cors()); //permitir que react se comunique con este backend
app.use(express.json()); // permitir que el servidor entienda datos en json

//RUTAS DE LA API 
// Le decimos a Express que cuando alguien entre en /api/operators, use el archivo de rutas de operarios, y así con todos.
app.use('/api/operators', require('./src/api/routes/operators'));
app.use('/api/customers', require('./src/api/routes/customers'));
app.use('/api/jobs', require('./src/api/routes/jobs'));
app.use('/api/auth', require('./src/api/routes/auth'));
// ruta de prueba para ver que el servidor responde
app.get('api/health', (req, res) => {
    res.json({status: 'online', message: 'servidor electrogestor funcionando'});
});

// conexión a mongoose
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ Conexión exitosa con la base de datos de mongo.")
        app.listen(PORT, () => {
            console.log("Servidor levantado 🚀")
        })
    })
    .catch((error) => {
        console.log("❌ Error en la conexión con la base de datos.")
    })