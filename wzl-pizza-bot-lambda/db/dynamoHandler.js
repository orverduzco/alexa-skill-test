const AWS = require('aws-sdk')
const DDB = new AWS.DynamoDB({ apiVersion: '2012-08-10' })
AWS.config.update({ region: 'us-west-2' })

class DynamoHandler {
  constructor () {
    this.table = 'wizeline-pizza-bot-orders'
  }

  getLastOrder () {
    return new Promise((resolve, reject) => {
      const countParams = {
        TableName: this.table
      }

      DDB.scan(countParams, (err, data) => {
        if (err) reject(err)
        resolve(data.Items.length)
      })
    })
  }

  getOrderInfo (orderNumber) {
    console.log('will try to track ', orderNumber)
    return new Promise((resolve, reject) => {
      const params = {
        TableName: this.table,
        KeyConditionExpression: 'ORDER_ID = :o',
        ExpressionAttributeValues: {
          ':o': { N: `${orderNumber}` }
        }
      }

      DDB.query(params, (err, data) => {
        if (err) reject(err)
        if (data.Items.length === 0) reject('Not found')
        console.log(JSON.stringify(data.Items[0]))
        resolve(this._parseItem(data.Items[0]))
      })
    })
  }

  _parseItem (item) {
    let parsed = {}
    const ingredients = item.INGREDIENTS.S
    const orderId = item.ORDER_ID.N
    const hasBeenCooked = item.COOKED.BOOL ? 'has': 'has not'
    const hasBeenDelivered = item.DELIVERED.BOOL ? 'has' : 'has not'
    const crust = item.CRUST.S
    return {ingredients, hasBeenCooked, hasBeenDelivered, crust}
  }

  store (item) {
    const params = {
      TableName: this.table,
      Item: item
    }

    return new Promise ((resolve, reject) => {
      DDB.putItem(params, function (err, data) {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }
}

module.exports = new DynamoHandler()
