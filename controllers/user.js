//Importar dependencias y modulos
const bcrypt = require('bcrypt');
const mongoose_paginate = require('mongoose-pagination');
const fs = require('fs');
const path = require('path');

//Importar modelos
const User = require('../models/User');
import Follows from '../models/Follows';
import Publications from '../models/publication'


//Importar Servicios
const jwt = require("../services/jwt");
const follow_service = require("../services/follow_service");

//Acciones prueba
const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/users.js",
        usuario: req.user
    })
}

//Registro de usuario
const register = async (req, res) => {
    //Recoger datos de la peticion
    const params = req.body;
    params.email = req.body.email.toLowerCase();

    //Comprobar q me llegan bien (+validacion)
    if (!params.name || !params.nick || !params.email || !params.password) {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar"
        })
    }

    //Control de usuario duplicados
    try {
        const users_to_find = await User.find({
            $or: [
                { email: params.email.toLowerCase() },
                { nick: params.nick.toLowerCase() }
            ]
        }).exec();
        if (!users_to_find) return res.status(500).json({ status: "error", message: "Error en la consulta" })
        if (users_to_find && users_to_find.length >= 1) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            })
        }
        // Cifrar la contraseña
        const pwd = await bcrypt.hash(params.password, 10);
        params.password = pwd;

        //Crear objeto de usuario
        let user_to_save = new User(params);

        //Guardar usuario en la base de datos
        const response = await user_to_save.save()
        if (!response) return res.status(500).send({ status: "error", message: "Error al guardar el usuario" })

        return res.status(200).json({
            status: "success",
            user: response.data,
            message: "Usuario registrado correctamente"
        })

    } catch (error) {
        return res.status(500).json({ error, message: error.message })
    }


}

//Login de usuario
const login = async (req, res) => {
    //Recoger parametros body
    const params = req.body
    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error",
            message: "Faltan datos por enviar"
        })
    }

    //Buscar en la bd si existe
    try {
        const exist = await User.findOne({ email: params.email.toLowerCase() }).exec();
        if (!exist) return res.status(404).send({
            status: "error",
            message: "No existe el usuario"
        })

        //Comprobar su contraseña
        const pwd = await bcrypt.compare(params.password, exist.password);
        if (!pwd) return res.status(400).send({
            status: "error",
            message: "No te has autenticado correctamente"
        })

        //Conseguir el Token
        const token = jwt.createToken(exist);

        //Eliminar contraseña

        //Devolver datos usuario

        return res.status(200).send({
            status: "succes",
            message: "Accion de login",
            user: {
                id: exist._id,
                name: exist.name,
                nick: exist.nick
            },
            token
        })
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: err.message
        })
    }
}

//Perfil de usuario
const profile = async (req, res) => {
    //Recibir el parametro del id de usuario por la url
    const id = req.params.id;

    //Consulta para sacar los dataos del usuario
    try {
        const user = await User.findById(id).select({ password: 0, role: 0 }).exec();
        if (!user) throw new Error("El usuario no existe o hay un error");

        //Info de seguimiento
        const follow_info = await follow_service.follow_users_id(req.user.id, id)
        //Devolver resultado

        return res.status(200).send({
            status: "succes",
            user: user,
            follower: follow_info.followers ? follow_info.followers : follow_info.error,
            following: follow_info.following ? follow_info.following : follow_info.error
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: error.message
        });
    }
}

//Lista usuario
const list = async (req, res) => {
    //Controlar la pagina
    const page = page = Number(req.params.pagina) ?? 1;

    //Consulta con mongoose paginate
    const items_per_page = 5;
    try {
        const user_list = await User.find().select({ password: 0, email: 0, role: 0, __v: 0 }).sort('_id').paginate(page, items_per_page);
        const total_users = await User.countDocuments();

        if (!user_list) {
            return res.status(404).send({
                status: "error",
                message: "No hay usuarios disponibles"
            });
        }

        //Lista de ids de usuarios q me siguen y los q sigo 
        const followUserId = await follow_service.follow_users_id(req.user.id);

        //Devolver resultado
        return (res.status(200).send({
            status: "success",
            message: "ruta de lista de usuario",
            user_list,
            page,
            cantidad: user_list.length,
            items_per_page,
            pages: Math.ceil(total_users / items_per_page),
            user_following: followUserId.following ? followUserId.following : followUserId.error,
            user_follow_me: followUserId.followers ? followUserId.followers : followUserId.error
        }));
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: err.message
        })
    }

}

//Editar perfil
const editprofile = async (req, res) => {

    //Recoger info del usuario a actualizar
    const user_identity = req.user;
    let user_to_update = req.body;


    //Elimiar campos sobrantes
    delete user_to_update.iat;
    delete user_to_update.exp;
    delete user_to_update.role;

    user_to_update.email ? "" : user_to_update.email = user_identity.email;
    user_to_update.nick ? "" : user_to_update.nick = user_identity.nick;

    //Comprobar si el usuario ya existe
    try {
        const users_to_find = await User.find({
            $or: [
                { email: user_to_update.email.toLowerCase() },
                { nick: user_to_update.nick.toLowerCase() }
            ]
        }).exec();
        if (!users_to_find) return res.status(500).json({ status: "error", message: "Error en la consulta" })

        let user_isset = false;
        users_to_find.forEach(user => {
            if (user && user._id != user_identity.id) user_isset = true;
        });
        if (user_isset) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            })
        }
        // Cifrar la contraseña
        if (user_to_update.password) {
            const pwd = await bcrypt.hash(user_to_update.password, 10);
            user_to_update.password = pwd;
        } else {
            delete user_to_update.password
        }
    } catch (error) {
        return res.status(500).json({ error, message: error.message })
    }

    //Buscar y actualizar
    try {
        const user_response = await User.findByIdAndUpdate({ _id: user_identity.id }, user_to_update, { new: true });
        if (!user_response) {
            throw new Error("No existe el usuario en la BD");
        }
        return res.status(200).send({
            status: "success",
            message: 'Se ha actualizado satisfactoriamente el usuario',
            user: user_response
        })
    } catch (err) {
        return res.status(404).send({
            status: "error",
            message: "No se ha encontrado el usuario o no exite",
            error: err.message
        });
    }

}

//Subir img
const upload = async (req, res) => {
    //Recoger el fichero de image y comprobar q existe
    if (!req.file) return res.status(404).send({
        status: "error",
        message: "Peticion no incluye la imagen"
    })

    //Conseguir el nombre del archivo
    const image = req.file.originalname;

    //Sacar la extension del archivo
    const imgSplit = image.split("\.");
    let extension
    imgSplit[2] ? extension = imgSplit[2] : extension = imgSplit[1];

    //Comprobar extension
    if (extension != "png" && extension != 'jpg' && extension != 'jpeg' && extension != 'gif') {

        //Si no es correcta, borrar archivo
        //Borrar archivo subido
        const filePath = req.file.path;
        const fileDelete = fs.unlinkSync(filePath);

        //Devolver respuesta negativa
        return res.status(400).send({
            status: "error",
            message: "Extension del fichero invalida"
        })

    }

    //Si si es q correcta, guardar imagen en db
    try {
        const user_update = await User.findByIdAndUpdate({ _id: req.user.id }, { image: req.file.filename }, { new: true }).select({ password: 0 }).exec()
        if (!user_update) throw new Error("No se ha encotrando archivo con el id especificado");

        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            user: user_update,
            file: req.file,

        })
    } catch (err) {
        return res.status(404).send({
            status: "error",
            message: err.message
        })
    }


}

const avatar = async (req, res) => {
    //Sacar el parametro de la url
    const file = req.params.file;

    //Montar el path real de la imagen
    const filePath = `./uploads/avatars/${file}`;

    //Comprobar q existe
    fs.stat(filePath, (err, exist) => {
        if (!exist) return res.status(404).send({
            status: "error",
            message: ["No existe la imagen", err]
        });

        //Devolver un file
        return res.sendFile(path.resolve(filePath));
    });

}

const counters = async (req, res) => {

    const user_id = req.params.id ?? req.user.id;

    const [following, followed, publications] = await Promise.allSettled([
        Follows.countDocuments({ user: user_id }),
        Follows.countDocuments({ followed: user_id }),
        Publications.countDocuments({ user: user_id }),

    ]).catch(error => {
        return res.status(500).json({
            status: "error",
            message: error.message
        })
    });

    return res.status(200).json({
        status: "success",
        following: following.value,
        followed: followed.value,
        publications: publications.value
    })
}


//Exportar acciones

module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    editprofile,
    upload,
    avatar,
    counters
}