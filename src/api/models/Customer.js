// importar mongoose
const mongoose = require('mongoose');

//definir el esquema del cliente
const CustomerSchema = new mongoose.Schema({

    // id numérico del cliente que viene en el excel
    //obligatorio y único para que no haya clientes duplicados
    id_cliente: {
        type: Number,
        required: true,
        unique: true
    },

    // nombre del cliente completo o el nombre de la empresa
    nombre: {
        type: String,
        required: true,
        trim: true
    },

    // teléfono de contacto
    telefono: {
        type: Number,
        required: true,
        trim: true
    },

    // email del cliente para enviar facturas y presupuestos
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    // dirección física donde se va hacer la instalación 
    direccion: {
        type: String,
        required: true,
        trim: true
    },

    // tipo de inmueble, enum para limitar opciones 
    // servirá en react para filtar los tipos de obras 
    tipo_vivienda: {
        type: String,
        required: true, 
        enum: ['Chalet', 'Piso', 'Oficina / Local', 'Industrial / Nave']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Customer', CustomerSchema);