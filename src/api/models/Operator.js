// importar mongoose 
const mongoose = require('mongoose');

// definir el esquema que tendrá los operarios
const OperatorSchema = new mongoose.Schema({
    //campo que guarda el id numérico que viene en el archivo excel o csv
    // no se puede repetir y es unico en la base de datos 
    id_operario: {
        type: Number,
        required: true,
        unique: true
    },

    // nombre del trabajador
    // trim: true elimina los espacios en blanco sobrantes que pueden venir en el excell al inicio o al final de los datos
    nombre: {
        type: String,
        required: true, 
        trim: true
    },

    // especialidad del operario
    // enum para limitar los valores permitidos para la especialidad, si en el excel viene otra palabra, mongoose dará error para proteger la base de datos
    especialidad: {
        type: String,
        required: true,
        enum: ['Solar', 'Cargadores', 'Electricidad General', 'Domótica']
    },

    // estado actual del operario para ver si se le puede asignar más obras
    // por defecto dafault es true si no se indica nada en el excel
    disponibilidad: {
        type: Boolean,
        default: true
    }
}, {
    //extra de mongoose, crear automáticamente dos campos en la base de datos
    // createdAt cuando se da de alta el operario y updateAt cuando se modifica
    timestamps: true
});

module.exports = mongoose.model('Operator', OperatorSchema);