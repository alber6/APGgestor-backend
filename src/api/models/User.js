const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    rol: {
        type: String,
        enum: ['admin', 'operario'],
        default: 'operario'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);