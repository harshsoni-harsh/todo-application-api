const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const dateFns = require('date-fns')
const path = require('path')

const app = express()
app.use(express.json())

let db = null

const initializeDbAndRunServer = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, 'todoApplication.db'),
      driver: sqlite3.Database,
    })
    app.listen(3000)
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

initializeDbAndRunServer()

const invalidCheck = async (req, res, next) => {
  let {status, priority, search_q, category, date} = req.query
  let isValid = true
  if (status) {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
    } else {
      res.status(400).send('Invalid Todo Status')
      isValid = false
    }
  }
  if (priority) {
    if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
    } else {
      res.status(400).send('Invalid Todo Priority')
      isValid = false
    }
  }
  if (category) {
    if (category === 'WORK' || category === 'HOME' || category === 'LEARNING') {
    } else {
      res.status(400).send('Invalid Todo Category')
      isValid = false
    }
  }
  if (date) {
    let dateSplit = date.split('-')
    if (
      dateSplit.length === 3 &&
      parseInt(dateSplit[1]) <= 12 &&
      parseInt(dateSplit[1]) > 0 &&
      parseInt(dateSplit[2]) < 32 &&
      parseInt(dateSplit[2]) > 0
    ) {
    } else {
      isValid = false
      res.status(400).send('Invalid Due Date')
    }
  }
  if (isValid) {
    next()
  }
}
const invalidCheckBody = async (req, res, next) => {
  let {status, priority, search_q, category, dueDate} = req.body
  let date = dueDate
  let isValid = true
  if (status) {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
    } else {
      res.status(400).send('Invalid Todo Status')
      isValid = false
    }
  }
  if (priority) {
    if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
    } else {
      res.status(400).send('Invalid Todo Priority')
      isValid = false
    }
  }
  if (category) {
    if (category === 'WORK' || category === 'HOME' || category === 'LEARNING') {
    } else {
      res.status(400).send('Invalid Todo Category')
      isValid = false
    }
  }
  if (date) {
    let dateSplit = date.split('-')
    if (
      dateSplit.length === 3 &&
      parseInt(dateSplit[1]) <= 12 &&
      parseInt(dateSplit[1]) > 0 &&
      parseInt(dateSplit[2]) < 32 &&
      parseInt(dateSplit[2]) > 0
    ) {
    } else {
      isValid = false
      res.status(400).send('Invalid Due Date')
    }
  }
  if (isValid) {
    next()
  }
}

app.get('/todos', invalidCheck, async (req, res) => {
  let {status = '', priority = '', search_q = '', category = ''} = req.query

  let query = `
    SELECT 
      id,
      todo,
      priority,
      status,
      category,
      due_date AS dueDate
    FROM todo
    WHERE 
        status like '%${status}%' AND
        priority like '%${priority}%' AND
        category like '%${category}%' AND
        todo like '%${search_q}%'
  `
  let dbResponse = await db.all(query)
  res.send(dbResponse)
})

app.get('/todos/:todoId', invalidCheck, async (req, res) => {
  let {todoId} = req.params
  let query = `
        SELECT 
          id,
          todo,
          priority,
          status,
          category,
          due_date AS dueDate
       FROM todo
        WHERE id = ${todoId}
    `
  let dbResponse = await db.get(query)
  res.send(dbResponse)
})

app.get('/agenda', invalidCheck, async (req, res) => {
  let {date = ''} = req.query
  date = date.split('-')
  let dateFormatted = dateFns.format(
    new Date(date[0], date[1] - 1, date[2]),
    'yyyy-MM-dd',
  )
  let query = `
        SELECT   
          id,
          todo,
          priority,
          status,
          category,
          due_date AS dueDate
        FROM todo
        WHERE
            due_date = '${dateFormatted}'
    `
  let dbResponse = await db.all(query)
  res.send(dbResponse)
})

app.post('/todos', invalidCheckBody, async (req, res) => {
  let {id, todo, priority, status, category, dueDate} = req.body
  let date = dueDate
  date = date.split('-')
  let dateFormatted = dateFns.format(
    new Date(date[0], date[1] - 1, date[2]),
    'yyyy-MM-dd',
  )
  let query = `
        INSERT INTO 
            todo (id, todo, priority, status, category, due_date)
        VALUES
            (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dateFormatted}')
    `
  await db.run(query)
  res.send('Todo Successfully Added')
})

app.put('/todos/:todoId', invalidCheckBody, async (req, res) => {
  let {todoId} = req.params
  let {
    status = '',
    priority = '',
    todo = '',
    category = '',
    dueDate = '',
  } = req.body
  let query
  if (status) {
    query = `
        UPDATE todo
        SET status = '${status}'
        WHERE id = ${todoId}
    `
    await db.run(query)
    res.send('Status Updated')
  } else if (priority) {
    query = `
        UPDATE todo
        SET priority = '${priority}'
        WHERE id = ${todoId}
    `
    await db.run(query)
    res.send('Priority Updated')
  } else if (todo) {
    query = `
        UPDATE todo
        SET todo = '${todo}'
        WHERE id = ${todoId}
    `
    await db.run(query)
    res.send('Todo Updated')
  } else if (category) {
    query = `
        UPDATE todo
        SET category = '${category}'
        WHERE id = ${todoId}
    `
    await db.run(query)
    res.send('Category Updated')
  } else if (dueDate) {
    let date = dueDate
    date = date.split('-')
    let dateFormatted = dateFns.format(
      new Date(date[0], date[1] - 1, date[2]),
      'yyyy-MM-dd',
    )
    query = `
        UPDATE todo
        SET due_date = '${dueDate}'
        WHERE id = ${todoId}
    `
    await db.run(query)
    res.send('Due Date Updated')
  }
})

app.delete('/todos/:todoId', invalidCheck, async (req, res) => {
  let {todoId} = req.params
  let query = `
        DELETE FROM todo
        WHERE id = ${todoId}
    `
  await db.run(query)
  res.send('Todo Deleted')
})

module.exports = app
