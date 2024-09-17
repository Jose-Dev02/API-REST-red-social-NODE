//Importar dependencias
const jwt = require("jwt-simple")
const moment = require('moment');

//Clave secreta
const clave_secreta = 'CLAVE_SECRETA_JOSE_DEV_REDSOCIAL_020712';

//Crear una funcion para generar token
const createToken = (user) => {
    const payload = {
        id: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30, "days").unix()
    }

    //Devolver un jwt token codificado
    return jwt.encode(payload, clave_secreta);
}


module.exports = {
    clave_secreta,
    createToken
}