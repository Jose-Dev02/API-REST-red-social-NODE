//Importar modelo
const Follow = require("../models/Follows");
const User = require("../models/User");
const mongoose_paginate = require("mongoose-pagination");

//Importar servicio
const follow_service = require("../services/follow_service");

//Acciones prueba
const pruebaFollow = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/follow.js"
    })
}


//Accion guardar un follow (accion seguir)

const save_follow = async (req, res) => {
    //Conseguir datos por body

    //Sacar id del usuario identificado
    //Crear objeto con modelo follow
    let user_to_follow = new Follow({
        user: req.user.id,
        followed: req.body.followed
    });
    try {
        const response_duplicate = await Follow.find({ user: user_to_follow.user, followed: user_to_follow.followed });
        if (response_duplicate.length >= 1) return res.status(200).send({
            status: "success",
            message: "Ya sigues a esa persona"
        })

        if (!response_duplicate) throw new Error("Error al buscar en la db")

    } catch (err) {
        return res.status(500).send({
            status: "error",
            error: err.message
        })

    }
    //Guardar objeto en db
    try {
        const response_save = await user_to_follow.save();
        if (!response_save) throw new Error("No se ha podido seguir al usuario");

        return res.status(200).send({
            status: "success",
            user: req.user,
            follow: response_save
        })
    } catch (err) {
        return res.status(500).send({
            status: "error",
            error: err.message
        })
    }
}

//Accion borrar un follow (accion borrar de seguir)
const delete_follow = async (req, res) => {
    //Recoger el id del usuario identificado

    //Recoger el id del usuario q sigo y quiero dejar de seguir

    //Hacer un Find de las coincidencias y hacer remove
    try {
        const response = await Follow.findOne({ user: req.user.id, followed: req.params.id }).exec();
        const nick_unfollow = await User.findById({ _id: req.params.id }).select({ nick: 1 }).exec();


        if (response) {
            const deleted_follow = await Follow.deleteOne(response).exec()
            if (!delete_follow) throw new Error("Error al dejar de seguir");
            return res.status(200).send({
                status: "success",
                message: `Has dejado de seguir a ${nick_unfollow.nick}`,
            })
        }
        throw new Error(`No has podido dejar de seguir a ${nick_unfollow.nick}`)
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: err.message,
            req: req.params
        })
    }
}

//Accion listado de usuario q cualquier usuario esta siguiendo
const list_following = async (req, res) => {

    //Sacar el id del usuario identificado
    let usuario;
    req.params.id ? usuario = req.params.id : usuario = req.user.id;

    //Comprobar si llega la pagina por la req
    let page;
    req.params.page ? page = req.params.page : page = 1;

    //Usuarios por pagina
    const items_per_page = 5;


    //Find a follow, popular datos de los usuarios y paginar con mongoose paginate
    try {
        const totalItems = await Follow.countDocuments({ user: usuario });
        const list_response = await Follow.find({ user: usuario })
            .populate("user followed", "-password -role -__v -email")
            .paginate(page, items_per_page)
            .exec();

        //Lista de ids de usuarios q me siguen y los q sigo
        const followUserId = await follow_service.follow_users_id(req.user.id);

        if (!list_response) throw new Error("Error al cargar la lista");
        return res.status(200).send({
            status: "success",
            count: totalItems,
            pages: Math.ceil(totalItems / items_per_page),
            data: list_response,
            user_following: followUserId.following ? followUserId.following : followUserId.error,
            user_follow_me: followUserId.followers ? followUserId.followers : followUserId.error
        })


    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: err.message
        })

    }

}

//Accion listado de usuario q sigue a cualquier usuario (mis seguidores)
const list_followers = async (req, res) => {

    //Sacar el id del usuario identificado
    let usuario;
    req.params.id ? usuario = req.params.id : usuario = req.user.id;

    //Comprobar si llega la pagina por la req
    let page;
    req.params.page ? page = req.params.page : page = 1;

    //Usuarios por pagina
    const items_per_page = 5;


    //Find a follow, popular datos de los usuarios y paginar con mongoose paginate
    try {
        const totalItems = await Follow.countDocuments({ followed: usuario });
        const list_response = await Follow.find({ followed: usuario })
            .populate("user followed", "-password -role -__v")
            .paginate(page, items_per_page)
            .exec();

        //Lista de ids de usuarios q me siguen y los q sigo
        const followUserId = await follow_service.follow_users_id(req.user.id);

        if (!list_response) throw new Error("Error al cargar la lista");
        return res.status(200).send({
            status: "success",
            count: totalItems,
            pages: Math.ceil(totalItems / items_per_page),
            data: list_response,
            user_following: followUserId.following ? followUserId.following : followUserId.error,
            user_follow_me: followUserId.followers ? followUserId.followers : followUserId.error

        })

    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: err.message
        })

    }
}



//Exportar acciones

module.exports = {
    pruebaFollow,
    save_follow,
    delete_follow,
    list_following,
    list_followers
}