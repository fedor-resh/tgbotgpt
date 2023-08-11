import {MongoClient, ServerApiVersion} from 'mongodb'

export class Mongodb {
    users = []
    db = null

    constructor(uri) {
        this.uri = uri
    }

    async connect() {
        if(!this.uri) return
        try {
            this.client = await MongoClient.connect(this.uri, {
                useUnifiedTopology: true,
                serverApi: ServerApiVersion.v1,
            })
            this.db = this.client.db('tg_bot')
            this.users = this.db.collection('users')
        } catch (e) {
            console.error('can"t connect to db')
        }
    }

    async updateUser(userId, data) {
        if(!this.uri) return
        try {
            if(!data) return
            delete data._id
            return await this.users.updateOne({userId}, {$set: data})
        } catch (e) {
            console.error('error while update user in db')
        }
    }
}
