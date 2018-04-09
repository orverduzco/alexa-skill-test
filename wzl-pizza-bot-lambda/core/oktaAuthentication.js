const axios = require('axios')
const util = require('util')

const axiosConfig = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'SSWS 00OVC_P4Cn1wKLQw9HzzCz6TET9JeWDulesyNCBt27'
  }
}

const endpoint = 'https://dev-876247.oktapreview.com/api/v1'

class OktaAuthentication {
  verifyUser (name, pin) {
    return new Promise((resolve, reject) => {
      console.log('Verifying: ' + name + ' and ' + pin)
      // Check if user exists and gets ID
      let userId, factorId
      getUser(name)
        .then((res) => {
          userId = res

          getFactor(userId)
            .then((res) => {
              factorId = res

              // Check if it has Google Authentication activated and get its ID

              // Verify with PIN
              authenticateUser(userId, factorId, pin)
                .then((res) => {
                  resolve('Authenticated')
                })
                .catch((err) => {
                  console.log('Not Authenticated Found')
                  reject(new Error(err))
                })
            })
            .catch((err) => {
              console.log('No Factor Found')
              reject(new Error(err))
            })
        })
        .catch((err) => {
          console.log('ERR2:' + err)
        })
    })
  }
}

function getUser (name) {
  return new Promise((resolve, reject) => {
    const userFilter = endpoint + `/users?filter=profile.firstName%20eq%20"${name}"&limit=1`
    console.log(userFilter)

    axios.get(userFilter, {headers: {'Authorization': 'SSWS 00OVC_P4Cn1wKLQw9HzzCz6TET9JeWDulesyNCBt27'}})
      .then((res) => {
        let userId = util.inspect(res.data[0].id)
        userId = userId.replace(/'/g, '')
        console.log('USER ID: ' + userId)
        // Remove apotrophes from util.inspect res
        // console.log('USER: ' + util.inspect(res, false, null))
        resolve(userId)
      })
      .catch((err) => {
        console.log('ERR: ' + err)
        reject(err)
      })
  })
}

function getFactor (userId) {
  return new Promise((resolve, reject) => {
    const factorFilter = endpoint + `/users/${userId}/factors`
    console.log(factorFilter)
    axios.get(factorFilter, axiosConfig)
      .then((res) => {
        let factorId = util.inspect(res.data[0].id)
        factorId = factorId.replace(/'/g, '')
        console.log('FactorId: ' + factorId)
        resolve(factorId)
      })
      .catch((err) => {
        console.log('ERR FACTOR: ' + err)
        reject(err)
      })
  })
}

function authenticateUser (userId, factorId, pin) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      passCode: pin
    })
    const authUser = endpoint + `/users/${userId}/factors/${factorId}/verify`
    console.log(authUser)
    axios.post(
      authUser,
      data,
      axiosConfig
    )
      .then((res) => {
        console.log('RES' + util.inspect(res.data))
        resolve(res)
      }).catch((err) => {
        console.log('ERR' + err)
        reject(err)
      })
  })
}

module.exports = new OktaAuthentication()
