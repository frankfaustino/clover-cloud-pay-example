require('dotenv').config()
const clover = require('remote-pay-cloud')
const XMLHttpRequest = require('xmlhttprequest-ssl').XMLHttpRequest

const xhr = new XMLHttpRequest()
const httpSupport = new clover.HttpSupport(xhr)

const { applicationId, merchantId, accessToken, deviceId, cloverServer, friendlyId, posName, serialNumber } = process.env

const baseConfiguration = { applicationId, posName, serialNumber }
const cloudConfiguration = { accessToken, cloverServer, merchantId, deviceId, friendlyId, httpSupport }

const useCloudConfiguration = true

// console.log('⚠️️️️️', cloudConfiguration, '\n')

function buildCloverConnectionListener() {
  return Object.assign({}, clover.remotepay.ICloverConnectorListener.prototype, {

    onDeviceReady: function (merchantInfo) {
      updateStatus("Your Clover device is ready to process requests.", true);
      console.log({ message: "Device Ready to process requests!", merchantInfo: merchantInfo });
      toggleActions(true);
    },

    onDeviceError: function (cloverDeviceErrorEvent) {
      updateStatus(`An error has occurred and we could not connect to your Clover Device. ${cloverDeviceErrorEvent.message}`, false);
      toggleActions(false);
    },

    onDeviceDisconnected: function (e) {
      updateStatus("The connection to your Clover Device has been dropped.", false);
      console.log({ message: "Disconnected" });
      toggleActions(false);
    }

  });
}

function getDeviceConfigurationForCloud({ applicationId, accessToken, cloverServer, deviceId, friendlyId, merchantId }) {
  const configBuilder = new clover.WebSocketCloudCloverDeviceConfigurationBuilder(applicationId, deviceId, merchantId, accessToken)
  // console.log(configBuilder)
  configBuilder.setCloverServer(cloverServer)
  configBuilder.setFriendlyId(friendlyId)

  return configBuilder.build()
}

class CloverConnector {
  constructor() {
    this.applicationId = applicationId
    this.accessToken = accessToken
    this.merchantId = merchantId
    this.deviceId = deviceId
    this.cloverServer = cloverServer
    this.friendlyId = friendlyId
    this.cloverConnector = null
  }

  connect() {
    clover.DebugConfig.loggingEnabled = true
    let cloverDeviceConnectionConfiguration = null

    if (useCloudConfiguration) {
      cloverDeviceConnectionConfiguration = getDeviceConfigurationForCloud({ ...baseConfiguration, ...cloudConfiguration })
      // console.log('', cloverDeviceConnectionConfiguration)
    }

    const builderConfiguration = {}
    builderConfiguration[clover.CloverConnectorFactoryBuilder.FACTORY_VERSION] = clover.CloverConnectorFactoryBuilder.VERSION_12
    const cloverConnectorFactory = clover.CloverConnectorFactoryBuilder.createICloverConnectorFactory(builderConfiguration)
    const cloverConnector = cloverConnectorFactory.createICloverConnector(cloverDeviceConnectionConfiguration)
    this.setCloverConnector(cloverConnector)
    cloverConnector.addCloverConnectorListener(buildCloverConnectionListener(cloverConnector))
    cloverConnector.initializeConnection()
  }

  setCloverConnector(cloverConnector) {
    this.cloverConnector = cloverConnector
  }
}

const test = new CloverConnector()
test.connect()