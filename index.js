//Importar dependencias
const { connection } = require('./database/connection');
const express = require('express');
const cors = require('cors')
//Mensaje bienvenida
console.log("API NODE para RED SOCIAL Arrancada")

//Conexion a bd
connection();

//Crear servidor de node
const app = express();
const port = process.env.PORT ?? 3900;

//Configurar cors
app.use(cors());

//Convertir los datos del body a obj js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Cargar conf rutas
const UserRoutes = require('./Routes/user');
const PublicationRoutes = require('./Routes/publication');
const FollowRoutes = require('./Routes/follow');

app.use('/api/user', UserRoutes);
app.use('/api/publication', PublicationRoutes);
app.use('/api/follow', FollowRoutes);

//ruta de prueba
app.get("/ruta-prueba", (req, res) => {

    return res.status(200).json({
        "id": 1,
        "nombre": "Jose",
        "web": "jluismatos68@gmail.com"
    })
})

//Poner servidor a escuchar peticiones http

app.listen(port, () => {
    console.log("Servidor de node corriendo en el puerto: ", port)
})



