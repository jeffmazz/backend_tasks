const express = require('express')
const cors = require('cors')
const db = require('./db')
const bcrypt = require('bcrypt')
const sgMail = require('@sendgrid/mail')
const jwt = require('jsonwebtoken')

const JWT_SECRET =process.env.JWT_SECRET

const nodemailer = require('nodemailer')

require('dotenv').config()

sgMail.setApiKey(process.env.SG_API_KEY)

const authRoutes = require("./routes/auth")

const app = express()
const port =process.env.PORT

// middleware
app.use(cors())
app.use(express.json())

//  Routes
app.use('/auth', authRoutes)

// Rota para listar todas as tarefas
app.get('/getTasks/:id', async(req, res) => {

    try {
        const userId = req.params.id
        if(!userId) throw new Error("ID do usuário não informado.")

        const [tasks] = await db.promise().query('Select * from tasks_list WHERE user_id = ?', [userId])

        return res.status(200).json({tasks})

    } catch(err) {
        console.error('Erro ao consltar tarefas', err.message)
        res.status(400).json({error: err.message})
    }

})

// Rota para adicionar tarefas
app.post('/addtask', async(req, res) => {

    const {description, user_id, status} = req.body
    
    if(!description || description.trim() == '') return res.status(400).json({error:"Descrição é Obrigatória!"})
    if(!user_id) return res.status(400).json({error:"Id do usuário não informado."})
    if(!status) return res.status(400).json({error:"Status de tarefa não informado."})

    try {
        await db.promise().query("INSERT INTO tasks_list (task_description, user_id, status) VALUES (?, ?, ?)", [description, user_id, status])
        return res.status(201).json({message:"Tarefa adiconada com sucesso!"})
    } catch(err) {
        console.error("Falha ao adicionar nova tarefa", err.message)
        return res.status(500).json({error:"Falha ao adicionar nova tarefa. Tente mais tarde", err})
    }

})

// Rota para deletar tarefas
app.delete('/deletetask/:id', async(req, res) => {

    const task_id = req.params.id

    if(!task_id) return res.status(400).json({error:"ID da tarefa não informada para exclusão."})

    try {

        const [results] = await db.promise().query("DELETE FROM tasks_list WHERE task_id = ?",[task_id])

        if(results.affectedRows === 0) return res.status(404).json({error:"tarefa não encontrada."})

        return res.status(200).json({message:"Tarefa deletada com sucesso!"})

    } catch(err) {
        console.error("Falha ao deletar tarefa", err.message)
        return res.status(500).json({error:"Falha ao deletar tarefa", err:err.message})
    }

})

// Rota de conclusão de tarefas
app.put('/concludetask/:id', async(req, res) => {

    const task_id = req.params.id

    if(!task_id) return res.status(400).json({error:"Id da tarefa não informado"})

    try {

        const [results] = await db.promise().query("UPDATE tasks_list SET status = ? WHERE task_id = ?", ['completed',task_id])

        if(results.affectedRows === 0) return res.status(404).json({error:"Tarefa não encontrada!"})

        return res.status(200).json({message:"Tarefa Concluída!"})

    } catch(err) {
        console.error("Falha ao alterar status da tarefa", err.message)
        return res.status(500).json({error:"Falha ao alterar status da tarefa", err:err.message})
    }

})

// Rota para cancelar conclusão de tarefa
app.put('/cancelconcludetask/:id', async(req, res) => {

    const task_id = req.params.id

    if(!task_id) return res.status(400).json({error:"Id da tarefa não informado."})

    try {

        const [results] = await db.promise().query("UPDATE tasks_list SET status = ? WHERE task_id = ?", ['pending', task_id])

        if(results.affectedRows === 0) return res.status(404).json({error:"Tarefa não encontrada."})

        return res.status(200).json({message:"Tarefa voltou a ser pendente!"})

    } catch(err) {
        console.error("Falha ao atualizar tarefa para pendente", err.message)
        return res.status(500).json({error:"Falha ao atualizar tarefa para pendente", err:err.message})
    }

})

// Rota para requisição de alteração de senha
app.post('/request-new-password', async(req, res) => {

    const {email, userId} = req.body

    if(!email) return res.status(400).json({error:"e-mail não informado para alteração de senha"})

    try {
        const [results] = await db.promise().query("SELECT * FROM users WHERE user_id = ?", [userId])
        if(results.length === 0) throw new Error("Usuário não encontrado")
        
        const token = await jwt.sign({email, userId}, JWT_SECRET, {expiresIn:"600s"})
        if(!token) return res.status(500).json({error:"Falha ao gerar token. Tente novamente mais tarde."})

        const mailOptions = {
            from: process.env.NODEMAILER_USER,
            to: email,
            subject: "Request New Password e-mail - Task's list",
            html: `<a href="http://127.0.0.1:5173/generate-new-password/${token}"> Change Password </a>`
        }

        transporter.sendMail(mailOptions)

        return res.status(200).json({message: 'E-mail enviado para alteração de senha.'})

    } catch(err) {
        console.error("Falha no sistema", err.message)
        return res.status(500).json({error:"Falha no sistema. Tente novamente mais tarde", err:err.message})
    }

})

//Rota para verificação do token
app.post("/verifyToken", async(req, res) => {

    const {token} = req.body

    await jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if(err) return res.status(401).json({error:"Token expirado ou inválido"})
        return res.status(200).json({decoded})
    })

})

// função para verificar token
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        return {valid: true, decoded}
    } catch(err) {
        return {valid: false, error:'Token expirado ou inválido.'}
    }
}

// Rota para alteração de senha
app.put("/change-password/:id", async(req, res) => {

    const user_id = Number(req.params.id)
    if(!user_id || isNaN(user_id)) return res.status(400).json({error:"Id não informado"})

    const {oldPassword, newPassword, confirmNewPassword, token} = req.body
    if(!oldPassword || !newPassword || !confirmNewPassword) return res.status(400).json({error:"Por favor, preencha todos os campos"})
    if(!token) return res.status(400).json({error:"Token não fornecido"})

    try {

        const data = verifyToken(token)

        if(!data.valid) {
            return res.status(500).json({error:data.error})
        }

        const [results] = await db.promise().query(`SELECT * FROM users WHERE user_id = ?`, [user_id])
        if(results.length === 0) throw new Error("Usuário não encontrado.")

        if(results[0].email !== data.decoded.email || results[0].user_id !== data.decoded.userId) {
            throw new Error('Token não pertence à essa conta')
        }
        
        const oldPasswordIsMatch = await bcrypt.compare(oldPassword, results[0].password)
        if(!oldPasswordIsMatch) throw new Error('Senha Antiga inválida')

        if(newPassword !== confirmNewPassword) throw new Error("Novas senhas são diferentes")

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)

        await db.promise().query("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, user_id])
        console.log("Senha Alterada")
        return res.status(200).json({message:"Senha atualizada com sucesso!"})
        
    } catch(err) {
        console.error("Falha ao alterar senha", err.message)
        return res.status(500).json({error:"Falha ao alterar senha", err:err.message})
    }

})

// Rota para deletar conta
app.delete('/deleteaccount/:id', async(req, res) => {

    const userId = req.params.id

    if(!userId) return res.status(400).json({error:"Id não informado."})

    try {
        const [results] = await db.promise().query("DELETE FROM users WHERE user_id = ?", [userId])

        if(results.affectedRows === 0) return res.status(404).json({error:"Usuário não encontrado."})

        return res.status(200).json({message:"Usuário deletado com sucesso!"})

    } catch(err) {
        console.error("Falha ao deletar conta", err.message)
        return res.status(500).json({error:"Falha ao deletar conta. Tente novamente mais tarde!", err:err.message})
    }

})

// Rota para recuperação de senha
app.post('/recover-password', async(req, res) => {

    try {
        const {email} = req.body
        if(!email) throw new Error('Informações necessárias não foram enviadas')

        const token = jwt.sign({email}, process.env.JWT_SECRET, {expiresIn: "600s"})

        const mailOptions = {
            from:process.env.NODEMAILER_USER,
            to:email,
            subject: "Password Recovery",
            html: `<a href="http://127.0.0.1:5173/recovery-password/${token}"> Password Recovery </a>`
        }

        await transporter.sendMail(mailOptions)

        return res.status(200).json({message:"E-mail enviado para recuperação de senha"})

    } catch(err) {
        console.error(err, err.message)
        return res.status(500).json({err, errMessage:err.message})
    }

})

app.post('/password-recovery', async(req, res) => {
    const {email, password, confirmPassword} = req.body

    if(!email || !password || !confirmPassword) {
        return res.status(400).json({error:"Dados necessários não foram enviados."})
    }

    if(password !== confirmPassword) {
        return res.status(400).json({error:"As senhas precisam ser iguais"})
    }

    try {

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const [user] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email])
        if(user.length === 0) {
            return res.status(404).json({error:"E-mail não existe no banco de dados"})
        }

        await db.promise().query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email])

        return res.status(200).json({message:`Senha atualizada com sucesso. ${email}`})

    } catch(err) {
        console.error(err, err.message)
        return res.status(500).json({error:err.message})
    }

})


// Nodemailer Transporter
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

app.listen(port, () => {
    console.log(`Server running at port ${port}`)
})

module.exports = transporter