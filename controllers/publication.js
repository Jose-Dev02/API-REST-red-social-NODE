//Importar models
const Publication = require("../models/publication");

//Importar dependencias
const pagination = require('mongoose-pagination');
const fs = require('fs');

//Importar servicios
import follow_service from "../services/follow_service"


//Acciones prueba
const pruebaPublication = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/publication.js"
    })
}

//Guardar publicacion
const crear_save_publication = async (req, res) => {

    //Verificar si tiene texto en el body
    if (!req.body.text) return res.status(400).send({
        status: "error",
        message: "La peticion no tiene un texto asignado"
    });

    //Crear el objetoo a guardar
    const publication_to_save = new Publication({
        user: req.user.id,
        text: req.body.text
    })
    //Guardar el objeto
    try {
        const response_publication_to_save = await publication_to_save.save();

        if (!response_publication_to_save) throw new Error("Error al conectar a la db");

        return res.status(200).send({
            status: "success",
            publication: response_publication_to_save
        })
    }
    catch (err) {
        res.status(404).send({
            status: "success",
            message: err.message
        })
    }


}

//Sacar una sola publicacion
const one_publication = async (req, res) => {

    //Hacer un findOne o findById es lo mismode la publicacion solicitada
    try {
        const response_publication = await Publication.findOne(req.params.id);
        if (!response_publication) throw new Error("No se ha encontrado en la db ");

        return res.status(200).send({
            status: "success",
            publication: response_publication
        })
    }
    catch (err) {
        return res.status(404).send({
            status: "error",
            message: err.message
        })
    }
}

//Eliminar publicaciones
const delete_publication = async (req, res) => {
    //Buscar la publicacion
    try {

        const find_publication = Publication.findOne({ user: req.user.id, _id: req.params.id });
        if (!find_publication) throw new Error("No se ha encontrado en la db");

        //Eliminar publicacion
        const response_deleted = await Publication.deleteOne(find_publication).exec()
        if (!response_deleted) throw new Error("Error al eliminar publicacion")

        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            publication: find_publication
        })
    } catch (err) {
        return res.status(404).send({
            status: "error",
            message: err.message
        })
    }
}

//Listar publicaciones de un usuario
const publication_user = async (req, res) => {
    //Controlar la pagina
    const page = req.params.page ? page = req.params.page : page = 1;

    //Item por paginas
    const item_per_page = 5;

    //Obetener el id desde la url o el mismo q el del usuario
    const user_id = req.params.id ? user_id = req.params.id : user_id = req.user.id;

    const total = Publication.countDocuments({ user: user_id })
    try {
        //Buscar publicaciones
        const publications = await Publication.find(user_id)
            .sort("-create_at")
            .populate("user ", "-password -role -__v -email")
            .paginate(page, item_per_page)
            .exec();
        if (!publications) throw new Error("Error al buscar publicaciones en la db");

        res.status(200).send({
            status: "success",
            count: total,
            page: page,
            pages: Math.ceil(total / item_per_page),
            data: publications
        })

    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: err.message
        })

    }


}

//Subir ficheros
const uploads = async (req, res) => {
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
        fs.unlinkSync(filePath);

        //Devolver respuesta negativa
        return res.status(400).send({
            status: "error",
            message: "Extension del fichero invalida"
        })

    }

    //Si si es q correcta, guardar imagen en db
    try {
        const publication_update = await Publication.findOneAndUpdate({ user: req.user.id, _id: req.params.id }, { file: req.file.filename }, { new: true });
        if (!publication_update) throw new Error("No se ha encotrando archivo con el id especificado");

        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            publication: publication_update,
            file: req.file,

        })
    } catch (err) {
        return res.status(404).send({
            status: "error",
            message: err.message
        })
    }


}

//Devolver archivo multimedia

const pub_file = async (req, res) => {
    //Sacar el parametro de la url
    const file = req.params.file;

    //Montar el path real de la imagen
    const filePath = `./uploads/publications/${file}`;

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


//Listar todas las publicaciones (FEED)
const feed = async (req, res) => {
    //sacar la pagina actual
    const page = Number(req.params.page) ?? 1;

    //establecer num de elementos por pagina
    const items_per_page = 5;

    //sacar un array de ids de usuario q sigo como user identificado

    const { following } = await follow_service.follow_users_id(req.user.id)
        .catch(error => {
            return res.status(500).json({
                status: "error",
                message: error.message
            })
        });

    //Find a publicacion usando el operador (in) ver documentacion, popular y paginar
    const total = Publication.countDocuments({ user: following })
    const user_following_publication = await Publication.find({ user: following })
        .populate("user ", "-password -role -__v -email")
        .sort("-create_at")
        .paginate(page, items_per_page)
        .catch(error => {
            return res.status(500).json({
                status: "error",
                message: error.message
            })
        });

    return res.status(200).json({
        status: "succes",
        following,
        total,
        page,
        pages: Math.ceil(total / items_per_page),
        publication_to_show: user_following_publication
    })

}




//Exportar acciones

module.exports = {
    pruebaPublication,
    crear_save_publication,
    one_publication,
    delete_publication,
    publication_user,
    uploads,
    pub_file,
    feed
}