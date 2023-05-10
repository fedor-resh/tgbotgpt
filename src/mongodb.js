import {MongoClient, ServerApiVersion} from 'mongodb'

export class Mongodb {
    users = null
    client = null
    db = null

    constructor(uri) {
        this.uri = uri
    }

    async connect() {
        try {
            this.client = await MongoClient.connect(this.uri, {
                useUnifiedTopology: true,
                serverApi: ServerApiVersion.v1,
            })
            this.db = this.client.db('tg_bot')
            this.users = this.db.collection('users')
        } catch (e) {
            console.error(e)
        }
    }

    async close() {
        try {
            await this.client.close()
        } catch (e) {
            console.error(e)
        }
    }

    async getUser(userId) {
        try {
            return await this.users.findOne({userId})
        } catch (e) {
            console.error(e)
        }
    }

    async addUser(userId, user) {
        try {
            return await this.users.insertOne({userId, ...user})
        } catch (e) {
            console.error(e)
        }
    }

    async updateUser(userId, data) {
        try {
            delete data._id
            return await this.users.updateOne({userId}, {$set: data})
        } catch (e) {
            console.error('error while update user in db', e)
        }
    }
}
