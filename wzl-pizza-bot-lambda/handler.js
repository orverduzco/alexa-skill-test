'use strict'
const Alexa = require('alexa-sdk')
const AWS = require('aws-sdk')
const DDB = new AWS.DynamoDB({ apiVersion: '2012-08-10' })
AWS.config.update({ region: 'us-west-2' })

module.exports.handler = (event, context, callback) => {
  let alexa = Alexa.handler(event, context)
  alexa.appId = process.env.ASK_APP_ID || 'amzn1.ask.skill.b75c6ad8-90b4-4162-a789-8ca13b58c76b'
  alexa.registerHandlers(handlers)
  alexa.execute()
}

function orderPizza (context) {
  const slots = context.event.request.intent.slots

  if (!slots.ingredient.value || !slots.thickness.value) {
    // Some slots are missing.
    context.context.succeed({
      'response': {
        'directives': [
          {
            'type': 'Dialog.Delegate'
          }
        ],
        'shouldEndSession': false
      },
      'sessionAttributes': {}
    })
  } else {
    // fetch the latest track number and add to it.
    const getLastOrder = new Promise((resolve, reject) => {
      const countParams = {
        TableName: 'wizeline-pizza-bot-orders'
      }

      DDB.scan(countParams, (err, data) => {
        if (err) reject(err)
        resolve(data.Items.length)
      })
    })

    getLastOrder
    .then(result => {
      console.log('orders:', result)
      const latestOrder = result // hardcode for now.
      const newOrderId = latestOrder + 1
      const ingredient = slots.ingredient.value
      const thickness = slots.thickness.value

      const params = {
        TableName: 'wizeline-pizza-bot-orders',
        Item: {
          'ORDER_ID': { N: `${newOrderId}` },
          'INGREDIENTS': { S: ingredient },
          'CRUST': { S: thickness },
          'DELIVERED': { BOOL: false },
          'COOKED': { BOOL: false }
        }
      }

      // Call DynamoDB to add the item to the table
      DDB.putItem(params, function (err, data) {
        if (err) {
          console.log('error')
          console.error(err)
          context.emit(':tell', 'Sorry, we couldn\'t take your order.')
        } else {
          console.log('saved! ')
          context.response.cardRenderer(`Wize Pizza Bot–Order #${newOrderId}`, `Successfully ordered a ${thickness} ${ingredient} pizza.`)
          context.response.speak(`We've received your order. Your pizza order is number ${newOrderId}.`)
          context.emit(':responseReady')
        }
      })
    })
    .catch(reason => {
      console.log('error')
      console.error(reason)
      context.emit(':tell', 'Sorry, we couldn\'t take your order.')
    })
  }
}

function orderPizzaBak(context) {
  const slots = context.event.request.intent.slots

  if (!slots.ingredient.value || !slots.thickness.value) {
    // Some slots are missing.
    context.context.succeed({
      'response': {
        'directives': [
          {
            'type': 'Dialog.Delegate'
          }
        ],
        'shouldEndSession': false
      },
      'sessionAttributes': {}
    })
  } else {
    const ingredient = slots.ingredient.value
    const thickness = slots.thickness.value

    console.log(`Connecting to DB: ${databaseUri}`)
    mongoose.connect(databaseUri)
    mongoose.Promise = global.Promise

    let db = mongoose.connection
    let Schema = mongoose.Schema

    db.on('error', console.error.bind(console, 'MongoDB connection error: '))

    let orderSchema = new Schema({
      orderId: {
        type: Number,
        default: 1
      },
      ingredients: {
        type: String,
        default: ''
      },
      crust: {
        type: String,
        default: ''
      },
      delivered: {
        type: Boolean,
        default: false
      },
      cooked: {
        type: Boolean,
        default: false
      }
    })

    let orderModel = mongoose.model('PizzaOrders', orderSchema)

    orderSchema.pre('save', function (next) {
      // Only increment on new Order.
      if (this.isNew) {
        orderModel.count().then(quantity => {
          // Increment count
          this.orderId = 10 + quantity
          next()
        })
      } else {
        next()
      }
    })

    let pizza = new orderModel({
      orderId: 0,
      ingredients: ingredient,
      crust: thickness,
      delivered: false,
      cooked: false
    })

    console.log(`New Order: ${JSON.stringify([ingredient, thickness])}`)

    pizza.save((err, savedPizza) => {
      console.log('saved?')
      if (err) {
        console.log('error')
        console.error(err)
        context.emit(':tell', 'Sorry, we couldn\'t take your order.')
      } else {
        console.log('saved! ' + savedPizza)
        context.response.cardRenderer(`Wize Pizza Bot – Order #${savedPizza.orderId}`, `Successfully ordered a ${savedPizza.crust} ${savedPizza.ingredients} pizza.`)
        context.response.speak(`We've received your order. Your pizza order is number ${savedPizza.orderId}.`)
        context.emit(':responseReady')
      }
    })
  }
}

let handlers = {
  'LaunchRequest': function () {
    this.emit(':ask', `Welcome to Wize Pizza Bot. You can: Order a Pizza. Or, Track order.`)
  },
  'AddOrder': function () {
    orderPizza(this)
  },
  'AMAZON.StopIntent': function () {
    this.response.speak(`Ciao!`)
    this.emit(':responseReady')
  },
  'AMAZON.HelpIntent': function () {
    this.response.speak(`You can try: 'alexa, wize pizza bot' or 'alexa, ask wize pizza bot for a pizza with pepperoni and thin crust`)
    this.emit(':responseReady')
  },
  'AMAZON.CancelIntent': function () {
    this.response.speak('Ciao!')
    this.emit(':responseReady')
  },
  'Unhandled': function () {
    this.response.speak(`Sorry, I didn't get that.You can try: 'alexa, wize pizza bot' or 'alexa, ask wize pizza bot for a pizza with pepperoni and thin crust'`)
  }
}
