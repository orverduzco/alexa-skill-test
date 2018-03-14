'use strict'
const Alexa = require('alexa-sdk')
const ddb = require('./db/dynamoHandler')
const states = require('./core/states')
const messages = require('./core/messages')

module.exports.handler = (event, context, callback) => {
  let alexa = Alexa.handler(event, context)
  alexa.appId = process.env.ASK_APP_ID || 'amzn1.ask.skill.57a085a6-ee65-42a1-b9f2-dafbaf384ea6'
  alexa.registerHandlers(newSessionHandlers, startStateHandlers, payingStateHandlers)
  alexa.execute()
}

function orderPizza (context) {
  const slots = context.event.request.intent.slots

  if (!slots.ingredient.value || !slots.thickness.value) {
    // Some slots are missing.
    context.context.succeed(messages.START_STATE.MISING_SLOTS)
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
          'ORDER_ID': newOrderId,
          'INGREDIENTS': ingredient,
          'CRUST': thickness,
          'DELIVERED': false,
          'COOKED': false,
          'PAYMENT_METHOD': 'none'
        }

        // store item into db
        ddb.store(item)
          .then(result => {
            console.log('saved! ')
            context.response.cardRenderer(`Wize Pizza Bot–Order #${newOrderId}`, `Successfully ordered a ${thickness} ${ingredient} pizza. ` +
            `How would you like to pay?`)
            context.response.speak(`We've received your order. Your pizza order is number ${newOrderId}. ` +
            `How would you like to pay?`)
            context.handler.state = states.PAYING_STATE
            context.response.shouldEndSession(false)
            context.attributes['orderNumber'] = newOrderId
            context.emit(':responseReady')
          })
          .catch(reason => {
            console.log('error')
            console.error(reason)
            context.emit(':tell', messages.START_STATE.FAIL_ORDER)
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
    context.context.succeed(messages.START_STATE.MISING_SLOTS)
  } else {
    ddb.getOrderInfo(slots.orderNumber.value)
      .then(result => {
        const {ingredients, hasBeenCooked, hasBeenDelivered, crust} = result
        console.log('order tracked.')
        context.response.cardRenderer(`Wize Pizza Bot–Order #${slots.orderNumber.value}. ` +
        `How would you like to pay?`)
        context.response.speak(`We've tracked your order. It is a ${ingredients} pizza with ${crust} crust, that ${hasBeenCooked} been cooked and ${hasBeenDelivered} been delivered. ` +
        `How would you like to pay?`)
        context.handler.state = states.PAYING_STATE
        context.response.shouldEndSession(false)
        context.attributes['orderNumber'] = parseInt(slots.orderNumber.value)
        context.emit(':responseReady')
      })
      .catch(reason => {
        console.log('error')
        console.error(reason)
        context.emit(':tell', messages.START_STATE.FAIL_TRACK_ORDER)
      })
  }
}

function getPaymentInfo (context) {
  const slots = context.event.request.intent.slots

  if (!slots.paymentMethod.value) {
    // Some slots are missing.
    context.context.succeed(messages.PAYING_STATE.MISING_SLOTS)
  } else {
    // Update item's payment method
    const orderNumber = context.attributes.orderNumber
    const paymentMethod = slots.paymentMethod.value
    const item = {
      'ORDER_ID': orderNumber
    }
    // update item into db with payment_method
    ddb.update(item, paymentMethod)
      .then(result => {
        console.log('saved! ')
        context.response.cardRenderer(messages.PAYING_STATE.PAYMENT_READY)
        context.response.speak(messages.PAYING_STATE.PAYMENT_READY)
        context.response.shouldEndSession(true)
        context.emit(':responseReady')
      })
      .catch(reason => {
        console.log('error')
        console.error(reason)
        context.emit(':tell', messages.START_STATE.FAIL_ORDER)
      })
  }
}

let newSessionHandlers = {
  // Almost every request will pass through 'NewSession'
  'NewSession': function () {
    this.handler.state = states.START_STATE
    this.emit(':ask', messages.NEW_SESSION_STATE.WELCOME)
  }
}

let startStateHandlers = Alexa.CreateStateHandler(states.START_STATE, {
  'LaunchRequest': function () { // If LaunchRequest, return to NewSession Handler
    delete this.attributes['STATE']
    this.emitWithState('NewSession')
  },
  'AddOrder': function () {
    orderPizza(this)
  },
  'GetOrderInfo': function () {
    getOrderInfo(this)
  },
  'AMAZON.StopIntent': function () {
    this.response.speak(messages.START_STATE.STOP_INTENT)
    this.emit(':responseReady')
  },
  'AMAZON.HelpIntent': function () {
    this.response.speak(messages.START_STATE.HELP)
    this.emit(':responseReady')
  },
  'AMAZON.CancelIntent': function () {
    this.response.speak(messages.START_STATE.CANCEL_INTENT)
    this.emit(':responseReady')
  },
  'Unhandled': function () {
    this.response.speak(messages.START_STATE.UNHANDLED)
  }
})

let payingStateHandlers = Alexa.CreateStateHandler(states.PAYING_STATE, {
  'LaunchRequest': function () { // If LaunchRequest, return to NewSessionHandlers
    delete this.attributes['STATE']
    this.emitWithState('NewSession')
  },
  'PaymentInfo': function () {
    getPaymentInfo(this)
  },
  'AMAZON.StopIntent': function () {
    this.response.speak(messages.PAYING_STATE.STOP_INTENT)
    this.emit(':responseReady')
  },
  'AMAZON.HelpIntent': function () {
    this.response.speak(messages.PAYING_STATE.HELP)
    this.emit(':responseReady')
  },
  'AMAZON.CancelIntent': function () {
    this.response.speak(messages.PAYING_STATE.CANCEL_INTENT)
    this.emit(':responseReady')
  },
  'Unhandled': function () {
    this.response.speak(messages.PAYING_STATE.UNHANDLED)
  }
})
