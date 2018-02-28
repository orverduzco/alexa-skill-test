'use strict'
const Alexa = require('alexa-sdk')
const AWS = require('aws-sdk')
AWS.config.update({region: 'us-west-2'})

module.exports.handler = (event, context, callback) => {
  // wizeline-pizza-bot-orders
  const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'})
  const params = {
    TableName: 'wizeline-pizza-bot-orders',
    Item: {
      'id': {S: '1'},
      'CUSTOMER_ID': {N: '001'},
      'CUSTOMER_NAME': {S: 'Richard Roe'}
    }
  }
  // Call DynamoDB to add the item to the table
  ddb.putItem(params, function (err, data) {
    if (err) {
      console.log('Error', err)
    } else {
      console.log('Success', data)
    }
  })

  // let alexa = Alexa.handler(event, context)
  // alexa.appId = process.env.ASK_APP_ID
  // // alexa.registerHandlers(handlers)
  // alexa.execute()
}
