// se encuentra en medio de la peticion, pero es como si fuera una ruta pero en el medio

const User = require("../api/models/User");
const { verifyJwt } = require("../utils/jwt");

const isAuth = (allowedRoles = []) => {
    return async (req, res, next) => {
    try {
        //destructuring
        //const token = req.headers.authorization?.replace("Bearer ", "");
        const [, token] = req.headers.authorization.split(" ");//.split() generará un array con dos elementos, si no se añade .split() saldrá en consola bearer 4jijijdoj4090489jrñ4jf4jf y al añadirlo lo que hace es que por consola no salga bearer y el espacio, sino solo el token: 4jijijdoj4090489jrñ4jf4jf, token limpio
        const { id } = verifyJwt(token);
        //con esto significa que el token es bueno pasamos a next() sino no te deja
        //ya nos habriamos logeado si tenemos un token correcto y te deja pasar
        //tambien queremos coger la información del usuario por eso cogemos el id del usuario
        const user = await User.findById(id);
        
        user.password = null //poner la contraseña a null para que nadie la pueda ver aunque esté encriptada
        req.user = user;

        // Si hay roles definidos, comprobamos si el usuario tiene permiso
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.roles)) {
        return res.status(403).json("Acceso denegado: permisos insuficientes");
        }

      // Si todo está bien, continuamos hacia el siguiente middleware o controlador
        next();
    } catch (error) {
        return res.status(401).json("Unauthorized")
    }
}
} 

module.exports = { isAuth }