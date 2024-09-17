const express = require('express');
const router = express.Router();
const FollowController = require('../controllers/follow');
const authMiddleware = require("../middlewares/auth");

//Definir Rutas
router.get("/prueba-follow", FollowController.pruebaFollow);

router.post("/save", authMiddleware.auth, FollowController.save_follow);
router.delete("/delete-follow/:id", authMiddleware.auth, FollowController.delete_follow);
router.get("/following/:id?/:page?", authMiddleware.auth, FollowController.list_following);
router.get("/followers/:id?/:page?", authMiddleware.auth, FollowController.list_followers);
//Exportar router
module.exports = router;