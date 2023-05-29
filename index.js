const express = require('express')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const { Sequelize, DataTypes } = require('sequelize')

const app = express()
const port = 3000
const secret = process.env.SECRET_KEY

// Configuração do Sequelize
const sequelize = new Sequelize('bdagenda', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
})

// Definição do modelo "Usuario"
const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  nome: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  senha: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
}, {
  timestamps: false, 
})


const Tarefa = sequelize.define('Tarefa', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  titulo: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  descricao: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  data_realizacao: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuario',
      key: 'id_usuario',
    },
  },
}, {
  timestamps: false,
})

// Definindo a associação entre Tarefa e Usuario
Tarefa.belongsTo(Usuario, {
  foreignKey: 'user_id',
})


app.use(express.json())


function autenticarToken(req, res, next) {
  const token = req.headers.authorization

  if (!token) {
    res.status(401).send({ error: 'Token não fornecido' })
    return
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      res.status(401).send({ error: 'Token inválido' })
      return
    }

    next()
  })
}


app.post('/usuarios', (req, res) => {
  const { nome, email, senha } = req.body

  Usuario.create({ nome, email, senha })
    .then((usuario) => {
      res.status(201).send({ message: 'Usuário criado com sucesso' })
    })
    .catch((error) => {
      console.log(error)
      res.status(500).send({ error: 'Falha ao criar o usuário' })
    })
})


app.get('/usuarios', autenticarToken, async (req, res) => {

  const users = await Usuario.findAll()
  res.status(200).send({data: users})

})

app.put('/usuarios/:id', autenticarToken, (req, res) => {
  const { id } = req.params
  const { nome, email, senha } = req.body

  Usuario.update({ nome, email, senha }, { where: { id_usuario: id } })
    .then((result) => {
      if (result[0] === 0) {
        res.status(404).send({ error: 'Usuário não encontrado' })
        return
      }
      res.send({ message: 'Usuário atualizado com sucesso' })
    })
    .catch((error) => {
      console.log(error)
      res.status(500).send({ error: 'Falha ao atualizar o usuário' })
    })
})

app.delete('/usuarios/:id', autenticarToken, (req, res) => {
  const { id } = req.params

  Usuario.destroy({ where: { id_usuario: id } })
    .then((result) => {
      if (result === 0) {
        res.status(404).send({ error: 'Usuário não encontrado' })
        return
      }
      res.send({ message: 'Usuário excluído com sucesso' })
    })
    .catch((error) => {
      console.log(error)
      res.status(500).send({ error: 'Falha ao excluir o usuário' })
    })
})


app.get('/tarefas', autenticarToken, async (req, res) => {
  const tarefas = await Tarefa.findAll()
  res.status(200).send({data: tarefas})
})

app.post('/tarefas',autenticarToken, (req, res) => {
  const { titulo, descricao, data_realizacao, user_id } = req.body

  Tarefa.create({ titulo, descricao, data_realizacao, user_id })
    .then((tarefa) => {
      res.status(201).send({ message: 'Tarefa criada com sucesso' })
    })
    .catch((error) => {
      res.status(500).send({ error: 'Falha ao criar a tarefa' })
    })
})



app.put('/tarefas/:id', autenticarToken, (req, res) => {
  const { id } = req.params
  const { titulo, descricao, data_realizacao, user_id } = req.body

  Tarefa.update(
    { titulo, descricao, data_realizacao, user_id },
    { where: { id } }
  )
    .then((result) => {
      if (result[0] === 0) {
        res.status(404).send({ error: 'Tarefa não encontrada' })
        return
      }
      res.send({ message: 'Tarefa atualizada com sucesso' })
    })
    .catch((error) => {
      res.status(500).send({ error: 'Falha ao atualizar a tarefa' })
    })
})

app.delete('/tarefas/:id', autenticarToken, (req, res) => {
  const { id } = req.params

  Tarefa.destroy({ where: { id } })
    .then((result) => {
      if (result === 0) {
        res.status(404).send({ error: 'Tarefa não encontrada' })
        return
      }
      res.send({ message: 'Tarefa excluída com sucesso' })
    })
    .catch((error) => {
      res.status(500).send({ error: 'Falha ao excluir a tarefa' })
    })
})





app.post('/token', (req, res) => {
  const { email, senha } = req.body

  // Procurar o usuário na base de dados
  Usuario.findOne({ where: { email, senha } })
    .then((usuario) => {
      if (!usuario) {
        res.status(401).send({ error: 'Email ou senha inválidos' })
        return
      }

      const payload = { number: Math.random() }

      jwt.sign(payload, secret, { expiresIn: '1h' }, 
      (err, token) => {
        if (err) {
          console.log(err)
          res.status(500).send({ error: 'Falha ao gerar o token' })
          return
        }
        res.send({ token })
      }
      )
    })
    .catch((error) => {
      console.log(error)
      res.status(500).send({ error: 'Falha ao buscar o usuário' })
    })
})

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})
