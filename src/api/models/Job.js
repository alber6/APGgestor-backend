// importamos mongoose
const mongoose = require('mongoose')

// definir el esquema de job
const JobSchema = new mongoose.Schema({

    //id numérico que vendrá en excel para identificar la orden de trabajo
    id_trabajo: {
        type: Number,
        required: true, 
        unique: true
    },

    // tipo de instalacion que se va a realizar en la obra
    tipo_instalacion: {
        type: String,
        required: true, 
        enum: ['Placas Solares', 'Cargador Coche', 'Avería', 'Electricidad General', 'Domótica']
    },

    //RELACIÓN CON EL CLIENTE
    // en vez de poner todos los datos del cliente, guardamos el id que genera mongo 
    // ref dice a mongoose que ese id pertenece a la coleccion Customer
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },

    // RELACIÓN CON EL OPERARIO
    // guardamos el id interno de mongo del trabajador asignado
    operario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operator',
        required: true
    },

    // añadimos el estado actual de la obra, depende de su estado, react lo pintará de diferente color
    estado: {
        type: String,
        required: true,
        enum: ['Pendiente', 'En proceso', 'Completado', 'Incidencia'],
        default: 'Pendiente'
    },

    // presupuesto o precio para el control de los ingresos de la empresa
    precio: {
        type: Number,
        required: true
    },

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