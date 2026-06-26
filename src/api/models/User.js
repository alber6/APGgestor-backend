const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
     password: {
        type: String,
        required: true
    },
    rol: {
        type: String,
        enum: ['admin', 'operario'],
        required: true
    },
    // Si es un operario, vinculamos su ID de la colección de operarios para saber quién es
    operarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operator',
        default: null
    }
});

module.exports = mongoose.model('User', UserSchema);