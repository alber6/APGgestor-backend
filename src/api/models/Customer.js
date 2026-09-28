const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    id_cliente: {
        type: Number,
        default: null
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    telefono: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    direccion: {
        type: String,
        required: true,
        trim: true
    },
    tipo_vivienda: {
        type: String,
        default: 'Chalet'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Customer', CustomerSchema);