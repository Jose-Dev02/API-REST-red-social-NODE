const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user');
const authMiddleware = require('../middlewares/auth');
const multer = require("multer");


//Configuracion de subida
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "./uploads/avatars");
    },
    filename: (req, file, callback) => {
        callback(null, `avatar ${Date.now()}-${file.originalname}`)
    }
})

const uploads = multer({ storage });

//Definir Rutas
router.get("/prueba-usuario", authMiddleware.auth, UserController.pruebaUser);
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/profile/:id", authMiddleware.auth, UserController.profile);
router.get("/list/:pagina?", authMiddleware.auth, UserController.list);
router.put("/update-profile", authMiddleware.auth, UserController.editprofile);
router.post("/upload", [authMiddleware.auth, uploads.single("file0")], UserController.upload);
router.get("/avatar/:file", UserController.avatar);
router.get("/counters/:id?", authMiddleware.auth, UserController.counters);

//Exportar router
module.exports = router;