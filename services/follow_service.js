const Follows = require("../models/Follows")

const follow_users_id = async (identityUserId) => {

    try {
        //Sacar info de seguimiento
        const [following, followers] = await Promise.allSettled(
            [Follows.find({ user: identityUserId })
                .select({
                    followed: 1,
                    _id: 0
                }),
            Follows.find({ followed: identityUserId })
                .select({
                    user: 1,
                    _id: 0
                })])
        // const following = await Follows.find({ user: identityUserId })
        //     .select({
        //         followed: 1,
        //         _id: 0
        //     })
        //     .exec()

        // const followers = await Follows.find({ followed: identityUserId })
        //     .select({
        //         user: 1,
        //         _id: 0
        //     })
        //     .exec()

        if (!following.value) throw new Error("Error al buscar informacion en la bd");
        if (!followers.value) throw new Error("Error al buscar informacion en la bd");

        //Procesar array de identificadores
        let following_clean = [];

        following.value.forEach(follow => {
            following_clean.push(follow.followed);
        });

        let followers_clean = [];

        followers.value.forEach(follow => {
            followers_clean.push(follow.user)
        });

        return {
            following: following_clean,
            followers: followers_clean
        }
    } catch (err) {
        return {
            error: err.message
        }
    }
}

const follow_this_user = async (identityUserId, profileUserId) => {
    try {
        //Sacar info de seguimiento

        const [following, followers] = await Promise.allSettled([
            Follows.findOne({ user: identityUserId, followed: profileUserId }),
            Follows.findOne({ user: profileUserId, followed: identityUserId })
        ])
        // const following = await Follows.findOne({ user: identityUserId, followed: profileUserId });

        // const followers = await Follows.findOne({ user: profileUserId, followed: identityUserId });

        if (!following.value) throw new Error("Error al buscar informacion en la bd");
        if (!followers.value) throw new Error("Error al buscar informacion en la bd");


        return {
            following: following.value,
            followers: followers.value
        }

    } catch (err) {
        return {
            error: err.message
        }
    }

}

module.exports = {
    follow_users_id,
    follow_this_user
}