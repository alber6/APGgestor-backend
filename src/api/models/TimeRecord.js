const mongoose = require('mongoose');

/**
 * Modelo TimeRecord (Registro Horario)
 * Cumplimiento estricto del Real Decreto-ley 8/2019 (Registro de Jornada Laboral)
 * y Art. 34.9 del Estatuto de los Trabajadores.
 * 
 * - Inalterabilidad y trazabilidad (auditTrail)
 * - Registro de coordenadas GPS de geolocalización
 * - Conservación mínima de 4 años legalmente exigida
 */
const TimeRecordSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tipo: {
        type: String,
        enum: ['ENTRADA', 'PAUSA_INICIO', 'PAUSA_FIN', 'SALIDA'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    },
    // Fecha en formato local 'YYYY-MM-DD' para facilitar agregaciones e indexación rápida por jornada
    fecha: {
        type: String,
        required: true,
        index: true
    },
    geolocalizacion: {
        latitud: {
            type: Number,
            default: null
        },
        longitud: {
            type: Number,
            default: null
        },
        precision: {
            type: Number,
            default: null
        },
        capturada: {
            type: Boolean,
            default: false
        },
        direccionAprox: {
            type: String,
            default: ''
        }
    },
    dispositivo: {
        type: String,
        default: 'Navegador Web'
    },
    origen: {
        type: String,
        enum: ['dispositivo', 'manual_admin'],
        default: 'dispositivo'
    },
    observaciones: {
        type: String,
        trim: true,
        default: ''
    },
    // Registro de Auditoría (Audit Trail) obligatorio para cualquier modificación o creación manual
    auditTrail: [
        {
            modificadoPor: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            nombreModificador: {
                type: String,
                required: true
            },
            fechaModificacion: {
                type: Date,
                default: Date.now
            },
            cambio: {
                type: String,
                default: 'Modificación de registro'
            },
            valoresAnteriores: {
                type: mongoose.Schema.Types.Mixed
            },
            valoresNuevos: {
                type: mongoose.Schema.Types.Mixed
            },
            motivo: {
                type: String,
                required: [true, 'El motivo de la modificación es obligatorio por exigencia legal de auditoría.']
            }
        }
    ],
    // Garantía legal de conservación durante al menos 4 años (RD-ley 8/2019)
    conservarHasta: {
        type: Date,
        default: () => {
            const fecha = new Date();
            fecha.setFullYear(fecha.getFullYear() + 4);
            return fecha;
        }
    }
}, {
    timestamps: true
});

// Índices para optimizar las consultas mensuales de inspección de trabajo y filtrado por operario
TimeRecordSchema.index({ usuario: 1, fecha: 1 });
TimeRecordSchema.index({ fecha: 1, tipo: 1 });
TimeRecordSchema.index({ usuario: 1, timestamp: 1 });

module.exports = mongoose.model('TimeRecord', TimeRecordSchema);
