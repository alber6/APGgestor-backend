const mongoose = require('mongoose');

/**
 * Modelo LeaveRequest (Solicitud y Gestión de Vacaciones y Permisos)
 * Integrado con el sistema de control horario de APGgestor
 */
const LeaveRequestSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tipo: {
        type: String,
        enum: ['VACACIONES', 'ASUNTOS_PROPIOS', 'BAJA', 'OTROS'],
        default: 'VACACIONES',
        required: true
    },
    fechaInicio: {
        type: String, // Formato YYYY-MM-DD
        required: true,
        index: true
    },
    fechaFin: {
        type: String, // Formato YYYY-MM-DD
        required: true,
        index: true
    },
    estado: {
        type: String,
        enum: ['PENDIENTE', 'APROBADA', 'RECHAZADA'],
        default: 'PENDIENTE',
        required: true,
        index: true
    },
    comentariosOperario: {
        type: String,
        trim: true,
        default: ''
    },
    comentariosAdmin: {
        type: String,
        trim: true,
        default: ''
    },
    revisadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    fechaRevision: {
        type: Date
    }
}, {
    timestamps: true
});

LeaveRequestSchema.index({ usuario: 1, estado: 1 });
LeaveRequestSchema.index({ fechaInicio: 1, fechaFin: 1 });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
