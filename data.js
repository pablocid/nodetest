const { hash, compare } = require('bcrypt');
const { Router } = require('express');
const { sign, verify } = require('jsonwebtoken');

class DataRoute {

    static comparePasswords(candidate, hash) {
        return compare(candidate, hash);
    }
    static hashPassword(password) {
        return hash(password, 10);
    }
    static signJWT(payload, secret) {
        let signOpts = {};
        signOpts.expiresIn = '1h';
        return sign(payload, secret, signOpts);
    }
    static isAuthJWT(secret) {

        return (req, res, next) => {
            if (!req.headers.authorization) {
                res.status(401).json({ message: 'No auth header' });
                return;
            }
            try {
                const jwt = req.headers.authorization.split('Bearer ')[1]
                if (!verify(jwt, secret)) {
                    res.status(401).json({ message: 'auth error, invalid JWT' });
                    return;
                }

            } catch (error) {
                res.status(401).json({ message: 'auth error, invalid JWT' });
                return;
            }
            next();
        }

    }
    static route(database, secret) {
        let r = Router();
        var obj = new DataRoute(database, secret);

        r.post('/signup', (req, res, next) => {
            obj.signup(req, res, next);
        });
        r.post('/login', (req, res, next) => {
            obj.login(req, res, next);
        });
        r.get("/users", DataRoute.isAuthJWT(secret), (req, res, next) => {
            obj.users(req, res, next);
        });

        return r;
    }

    constructor(database, secret) {
        this.database = database;
        this.usersCollection = database.collection('users');
        this.secret = secret;
    }

    async signup(req, res, next) {
        const { email, names, phone, password } = req.body;

        if (!email || !password) {
            res.status(401).json({ message: 'no email or password provided', body: req.body });
            return;
        }

        try {
            const userAlreadyExists = await this.usersCollection.findOne({ email });
            if (userAlreadyExists) {
                res.status(401).json({ message: 'email already registred' });
                return;
            }
        } catch (error) {
            res.status(500).json({ error: true, message: error });
            return;
        }

        try {
            const hashedPass = await DataRoute.hashPassword(password);
            const inserted = await this.usersCollection.insertOne({ email, names, phone, password: hashedPass });
            if (inserted.result.ok === 1) {
                res.status(200).json({ message: "user created" });
            } else {
                res.status(500).json({ message: "user NOT created", inserted });
            }

            return;
        } catch (error) {
            res.status(500).json({ message: error });
        }

    }
    async login(req, res, next) {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(401).json({ message: 'no email or password provided', body: req.body });
            return;
        }

        try {
            const user = await this.usersCollection.findOne({ email });
            if (!user) {
                res.status(401).json({ message: "email or password don't match" });
                return;
            }
            const isEqual = await DataRoute.comparePasswords(password, user.password);

            if (isEqual) {
                res.status(200).json({ message: "OK", jwt: DataRoute.signJWT({ email: user.email, name: user.name }, this.secret) });
            } else {
                res.status(401).json({ message: "email or password don't match" });
            }
            return;
        } catch (error) {
            res.status(500).json({ error: true, message: error });
            return;
        }
    }
    async users(req, res, next) {
        try {
            const record = await this.usersCollection.find({}, { projection: { password: 0 } }).toArray();
            res.json(record);
        } catch (error) {
            res.status(500).json({ error });
        }
    }

}

module.exports = { DataRoute };