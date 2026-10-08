const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    id_cliente: {
        type: Number,
        default: null
    },
    nif: {
        type: String,
        required: true,
        trim: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    nombre_referencia: {
        type: String,
        trim: true,
        default: ''
    },
    apellido1: {
        type: String,
        trim: true,
        default: ''
    },
    apellido2: {
        type: String,
        trim: true,
        default: ''
    },
    telefono: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    // DESGLOSE GRANULAR DE DIRECCIÓN FISCAL DEL TITULAR
    tipo_via: {
        type: String,
        trim: true,
        default: 'CALLE'
    },
    nombre_via: {
        type: String,
        trim: true,
        default: ''
    },
    numero: {
        type: String,
        trim: true,
        default: ''
    },
    bloque: {
        type: String,
        trim: true,
        default: ''
    },
    portal: {
        type: String,
        trim: true,
        default: ''
    },
    escalera: {
        type: String,
        trim: true,
        default: ''
    },
    piso: {
        type: String,
        trim: true,
        default: ''
    },
    puerta: {
        type: String,
        trim: true,
        default: ''
    },
    direccion_fiscal: {
        type: String,
        trim: true,
        default: ''
    },
    localidad: {
        type: String,
        trim: true,
        default: ''
    },
    provincia: {
        type: String,
        trim: true,
        default: ''
    },
    cp: {
        type: String,
        trim: true,
        default: ''
    },
    direccion: {
        type: String,
        trim: true,
        default: ''
    },
    tipo_vivienda: {
        type: String,
        default: 'Chalet'
    },
    // DISTINCIÓN PERSONA FÍSICA vs ENTIDAD JURÍDICA (EMPRESA)
    es_empresa: {
        type: Boolean,
        default: false
    },
    representante_nombre: {
        type: String,
        trim: true,
        default: ''
    },
    representante_apellido1: {
        type: String,
        trim: true,
        default: ''
    },
    representante_apellido2: {
        type: String,
        trim: true,
        default: ''
    },
    representante_nif: {
        type: String,
        trim: true,
        default: ''
    },
    rep_correo: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    rep_tipo_via: {
        type: String,
        trim: true,
        default: 'Calle'
    },
    rep_nombre_via: {
        type: String,
        trim: true,
        default: ''
    },
    rep_numero: {
        type: String,
        trim: true,
        default: ''
    },
    rep_bloque: {
        type: String,
        trim: true,
        default: ''
    },
    rep_portal: {
        type: String,
        trim: true,
        default: ''
    },
    rep_escalera: {
        type: String,
        trim: true,
        default: ''
    },
    rep_piso: {
        type: String,
        trim: true,
        default: ''
    },
    rep_puerta: {
        type: String,
        trim: true,
        default: ''
    },
    rep_localidad: {
        type: String,
        trim: true,
        default: ''
    },
    rep_provincia: {
        type: String,
        trim: true,
        default: ''
    },
    rep_cp: {
        type: String,
        trim: true,
        default: ''
    },
    rep_tel_fijo: {
        type: String,
        trim: true,
        default: ''
    },
    rep_tel_movil: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Customer', CustomerSchema);
