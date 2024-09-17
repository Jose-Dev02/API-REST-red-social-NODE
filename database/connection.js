const mongoose = require('mongoose')
const connection_string = 'mongodb://localhost:27017/mi_redsocial';

const connection = async () => {
    try {
        await mongoose.connect(connection_string);

        console.log("Conctado correctamente a db: mi_redsocial ");
    }
    catch (error) {
        console.log(error);
        throw new Error("No se ha podido conectar a la base de datos");

    }
}

module.exports = {
    connection
}