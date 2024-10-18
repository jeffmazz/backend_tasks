const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../db')
const nodemailer = require('nodemailer')
require('dotenv').config()

const JWT_SECRET =process.env.JWT_SECRET

// Nodemailer - Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
})

// Token Validate
function verifyToken(req, res, next) {

    const token = req.headers['authorization'].split(' ')[1]

    if(!token) return res.status(403).json({Error:"Token não fornecido."})

    jwt.verify(token, JWT_SECRET, (err, decoded) => {

        if(err) return res.status(401).json({Error:"Token inválido ou expirado."})
        
        req.user = decoded

        next()

    })

}

// Check if user is logged
router.post('/', verifyToken, (req,res) => {
    return res.status(200).json({decoded:req.user})
})

// Register's request e-mail function
const sendRegisterEmail = async(token, name, email, passwordHashed) => {

    const mailOptions = {
        from: process.env.NODEMAILER_USER,
        to: email,
        subject: "Register's Request - Task's List",
        html: `<a href="http://localhost:5173/active-account/${token}"> Active Account </a>`
    }

    try {

        await transporter.sendMail(mailOptions)

        console.log('E-mail enviado com sucesso!')

        await db.promise().query('INSERT INTO users (name, email, password, isActive) VALUES (?, ?, ?, ?)', [name, email, passwordHashed, false])

        return true

    } catch (err) {
        console.error("Erro ao enviar e-mail ou registrar usuário.", err)
        return false
    }

}

// Register
router.post('/register-request', async(req, res) => {

    const {name, email, password, confirmPassword} = req.body

    if(!name) return res.status(400).json({error:"Nome não informado."})
    if(!email) return res.status(400).json({error:"Email necessário."})
    if(!password || password.length < 6) return res.status(400).json({error:"A senha deve conter pelo menos 6 caracteres."})
    if(password !== confirmPassword) return res.status(400).json({error:"As senhas devem ser iguais."})

    try {
        const results = await db.promise().query('SELECT * FROM users WHERE email = ?', [email])

        if(results[0].length > 0) return res.status(400).json({error:"Email já existente."})
        
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const payload = {
            name: name,
            email: email,
        }
        const token = jwt.sign(payload, JWT_SECRET, {expiresIn: '1h'})

        const emailSent = await sendRegisterEmail(token, name, email, hashedPassword)

        if(emailSent == true) {
            return res.status(201).json({message:"Conta criada com sucesso! Acesse seu e-mail para ativar a conta."})
        } else {
            return res.status(500).json({error:"Erro ao enviar e-mail de confirmação."})
        }

    } catch (err) {
        console.error("Erro no servidor", err)
        return res.status(500).json({error:"Erro no servidor."})
    }

})

const decodeToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        return {valid: true, payload:decoded}
    } catch(err) {
        return {valid: false, error: err.message}
    }
}

// Active Account
router.post('/active-account', async(req, res) => {

    try {

        const {token} = req.body
        if(!token) return res.status(400).json({error:"Token não fornecido."})

        const result = decodeToken(token)

        if(!result.valid) throw new Error('Token expirado ou inválido')

        const {email} = result.payload

        const [user] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email])
        if(user.length === 0) throw new Error('usuário não encontrado')
        
        await db.promise().query(`UPDATE users SET isActive = ? WHERE email = ?`, [true, email])

        return res.status(200).json({message:"Conta ativada com sucesso."})

    } catch(err) {
        console.error(err.message)
        return res.status(500).json({error:err.message})
    }

})

// Login
router.post('/login', async(req, res) => {

    const {email, password} = req.body

    if(!email || !password) return res.status(400).json({error:"Email ou Senha não enviados."})

    try {

        const [user] = await db.promise().query(`SELECT * FROM users WHERE email = ?`, [email])
        if(user.length === 0) throw new Error("E-mail não encontrado.")

        const isMatch = await bcrypt.compare(password, user[0].password)
        if(!isMatch) throw new Error("Senha inválida.")

        const token = jwt.sign({id:user[0].user_id, name:user[0].name, email:user[0].email}, JWT_SECRET, {expiresIn:'1h'})

        return res.status(200).json({message:"Login efetuado com sucesso!", token})

    } catch(err) {
        console.error("Falha ao realizar login", err.message)
        return res.status(400).json({error: err.message})
    }

})



module.exports = router