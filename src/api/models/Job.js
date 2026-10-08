// importamos mongoose
const mongoose = require('mongoose');

// definir el esquema de partidas de presupuesto
const PartidaPresupuestoSchema = new mongoose.Schema({
    concepto: { type: String, required: true },
    cantidad: { type: Number, default: 1 },
    precioUnitario: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
}, { _id: true });

// definir el esquema de alertas de material
const AlertaMaterialSchema = new mongoose.Schema({
    texto: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
    atendida: { type: Boolean, default: false }
}, { _id: true });

// definir el esquema de documentos (PDFs)
const DocumentoSchema = new mongoose.Schema({
    url: { type: String, required: true },
    tipo: { 
        type: String, 
        required: true, 
        enum: ['plano_electrico', 'presupuesto', 'otros'] 
    },
    nombre: { type: String, required: true }
}, { _id: true });

// definir el esquema de job
const JobSchema = new mongoose.Schema({

    id_trabajo: {
        type: Number,
        default: null
    },

    // tipo de instalacion que se va a realizar en la obra
    tipo_instalacion: {
        type: String,
        required: true
    },

    // DATOS DEL EMPLAZAMIENTO DE LA OBRA (UBICACIÓN FÍSICA GRANULAR)
    tipo_via_obra: {
        type: String,
        trim: true,
        default: 'CALLE'
    },
    nombre_via_obra: {
        type: String,
        trim: true,
        default: ''
    },
    numero_obra: {
        type: String,
        trim: true,
        default: ''
    },
    bloque_obra: {
        type: String,
        trim: true,
        default: ''
    },
    portal_obra: {
        type: String,
        trim: true,
        default: ''
    },
    escalera_obra: {
        type: String,
        trim: true,
        default: ''
    },
    piso_obra: {
        type: String,
        trim: true,
        default: ''
    },
    puerta_obra: {
        type: String,
        trim: true,
        default: ''
    },
    direccion_obra: {
        type: String,
        trim: true,
        default: ''
    },
    localidad_obra: {
        type: String,
        trim: true,
        default: ''
    },
    cp_obra: {
        type: String,
        trim: true,
        default: ''
    },
    provincia_obra: {
        type: String,
        trim: true,
        default: ''
    },

    //RELACIÓN CON EL CLIENTE (Cliente general / tradicional)
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },

    // CLIENTES B2B (Estructura Coarsa)
    clienteFacturacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },
    clienteUbicacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },

    // RELACIÓN CON OPERARIOS (User con rol operario)
    operarios: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    operario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },


    // añadimos el estado actual de la obra (Kanban)
    estado: {
        type: String,
        required: true,
        enum: ['Pendiente', 'En proceso', 'Esperando Material', 'Finalizado', 'Completado', 'Incidencia'],
        default: 'Pendiente'
    },

    // presupuesto o precio base para el control de los ingresos de la empresa
    precio: {
        type: Number,
        required: true
    },

    // GESTIÓN DE PRESUPUESTOS VIVOS (Presupuesto base + partidas extra/imprevistos)
    partidasPresupuesto: [PartidaPresupuestoSchema],

    // PETICIÓN DE MATERIALES (Alertas solicitadas por operarios desde la obra)
    alertasMaterial: [AlertaMaterialSchema],

    // GESTIÓN DOCUMENTAL (PDFs: plano_electrico, presupuesto, otros)
    documentos: [DocumentoSchema],

    //fecha planificada para realizar el trabajo
    fecha: {
        type: Date,
        default: Date.now
    },

    // notas de texto por parte del jefe o del operario si falta algo o surje algún imprevisto
    notas: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Job', JobSchema);