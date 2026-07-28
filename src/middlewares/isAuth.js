// Middleware de autenticación y control de acceso basado en roles

const User = require("../api/models/User");
const { verifyJwt } = require("../utils/jwt");

const isAuth = (allowedRoles = []) => {
    return async (req, res, next) => {
    try {
        if (!req.headers.authorization || !req.headers.authorization.includes(" ")) {
            return res.status(401).json({ message: "No se proporcionó token de autenticación" });
        }

        const [, token] = req.headers.authorization.split(" ");
        const { id } = verifyJwt(token);
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        user.password = null;
        req.user = user;

        // Si hay roles definidos, comprobamos si el usuario tiene permiso (user.rol)
        const role = user.rol || user.roles;
        if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
            return res.status(403).json("Acceso denegado: permisos insuficientes");
        }

        // Si todo está bien, continuamos hacia el siguiente middleware o controlador
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized", error: error.message });
    }
  };
};

module.exports = { isAuth };