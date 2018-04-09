const Alexa = require('alexa-sdk')
const states = require('./states')
const ddb = require('../core/dynamoHandler')
const messages = require('../core/messages')

const handlers = Alexa.CreateStateHandler(states.PAYING_STATE, {
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
    this.emit(':responseReady')
  }
})

class PayingState {
  handlers () {
    return handlers
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

module.exports = new PayingState()
