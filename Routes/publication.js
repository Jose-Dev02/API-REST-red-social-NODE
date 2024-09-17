const express = require('express');
const router = express.Router();
const PublicacionController = require('../controllers/publication');
const authMiddleware = require("../middlewares/auth");
const multer = require("multer");


//Configuracion de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/publications");
    },
    filename: (req, file, cb) => {
        cb(null, `pub-file- ${Date.now()}-${file.originalname}`)
    }
})

const uploads = multer({ storage });

//Definir Rutas
router.get("/prueba-publication", PublicacionController.pruebaPublication);
router.post("/crear-publication", authMiddleware.auth, PublicacionController.crear_save_publication);
router.get("/publication/:id", authMiddleware.auth, PublicacionController.one_publication);
router.delete("/publication/:id", authMiddleware.auth, PublicacionController.delete_publication);
router.get("/publication-user/:id?/:page?", authMiddleware.auth, PublicacionController.publication_user);
router.post("upload/:id", [authMiddleware.auth, uploads.single("file0")], PublicacionController.uploads);
router.get("/publication/:file", PublicacionController.pub_file);
router.get("/feed/:page?", authMiddleware.auth, PublicacionController.feed);

//Exportar router
module.exports = router;