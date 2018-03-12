'use strict'
const Alexa = require('alexa-sdk')
const ddb = require('./db/dynamoHandler')

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
    ddb.getLastOrder()
    .then(result => {
      console.log('orders:', result)
      const lastOrder = result
      const newOrderId = lastOrder + 1
      const ingredient = slots.ingredient.value
      const thickness = slots.thickness.value

      const item = {
        'ORDER_ID': { N: `${newOrderId}` },
        'INGREDIENTS': { S: ingredient },
        'CRUST': { S: thickness },
        'DELIVERED': { BOOL: false },
        'COOKED': { BOOL: false }
      }

      // store item into db
      ddb.store(item)
      .then(result => {
        console.log('saved! ')
        context.response.cardRenderer(`Wize Pizza Bot–Order #${newOrderId}`, `Successfully ordered a ${thickness} ${ingredient} pizza.`)
        context.response.speak(`We've received your order. Your pizza order is number ${newOrderId}.`)
        context.emit(':responseReady')
      })
      .catch(reason => {
        console.log('error')
        console.error(reason)
        context.emit(':tell', 'Sorry, we couldn\'t take your order.')
      })
    })
    .catch(reason => {
      console.log('error')
      console.error(reason)
      context.emit(':tell', 'Sorry, we couldn\'t take your order.')
    })
  }
}

function getOrderInfo (context) {
  const slots = context.event.request.intent.slots
  console.log('slots: ', slots)

  if (!slots.orderNumber.value) {
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
    ddb.getOrderInfo(slots.orderNumber.value)
    .then(result => {
      const {ingredients, hasBeenCooked, hasBeenDelivered, crust} = result
      console.log('order tracked.')
      context.response.cardRenderer(`Wize Pizza Bot–Order #${slots.orderNumber.value}`)
      context.response.speak(`We've tracked your order. It is a ${ingredients} pizza with ${crust} crust, that ${hasBeenCooked} been cooked and ${hasBeenDelivered} been delivered.`)
      context.emit(':responseReady')
    })
    .catch(reason => {
      console.log('error')
      console.error(reason)
      context.emit(':tell', 'Sorry, we couldn\'t track your order.')
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
  'GetOrderInfo': function () {
    getOrderInfo(this)
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
