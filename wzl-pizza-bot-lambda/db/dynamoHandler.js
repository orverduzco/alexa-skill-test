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
