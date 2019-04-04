require('dotenv').config()
const clover = require('remote-pay-cloud')
const { XMLHttpRequest } = require('xmlhttprequest-ssl')

const WebSocketFactory = require('./WebSocketFactory')

// https://github.com/clover/remote-pay-cloud/blob/bc1bc6fec041484b9fcfee8d2665a4fd0a654c3e/src/com/clover/util/HttpSupport.ts
const httpSupport = new clover.HttpSupport(XMLHttpRequest)

const { applicationId, merchantId, accessToken, deviceId, cloverServer, friendlyId, posName, serialNumber } = process.env

const webSocketFactoryFunction = WebSocketFactory.create({ webSocketLibrary: 'nodejs-websocket' }).get
const baseConfiguration = { applicationId, posName, serialNumber, webSocketFactoryFunction }
const cloudConfiguration = { accessToken, cloverServer, merchantId, deviceId, friendlyId, httpSupport }
const useCloud = true


class CloverConnector {
  constructor(configuration) {
    this.configuration = configuration
    this.cloverConnector = null
    this.cloverDeviceConnectionConfiguration = null
  }

  connect() {
    clover.DebugConfig.loggingEnabled = true

    if (this.configuration && this.configuration.useCloud) {
      this.getDeviceConfigurationForCloud(this.configuration)
      // console.log('🧪✨🚗', this.cloverDeviceConnectionConfiguration, '\n')
    }

    const { FACTORY_VERSION, VERSION_12 } = clover.CloverConnectorFactoryBuilder
    const builderConfiguration = { [FACTORY_VERSION]: VERSION_12 }
    const cloverConnectorFactory = clover.CloverConnectorFactoryBuilder.createICloverConnectorFactory(builderConfiguration)

    this.cloverConnector = cloverConnectorFactory.createICloverConnector(this.cloverDeviceConnectionConfiguration)
    this.cloverConnector.addCloverConnectorListener(this.buildCloverConnectionListener(this.cloverConnector))
    this.cloverConnector.initializeConnection()
  }

  getDeviceConfigurationForCloud({ applicationId, accessToken, cloverServer, deviceId, friendlyId, httpSupport, merchantId, webSocketFactoryFunction }) {
    const configBuilder = new clover.WebSocketCloudCloverDeviceConfigurationBuilder(applicationId, deviceId, merchantId, accessToken)

    configBuilder.setCloverServer(cloverServer)
    configBuilder.setFriendlyId(friendlyId)
    configBuilder.setHttpSupport(httpSupport)
    configBuilder.setWebSocketFactoryFunction(webSocketFactoryFunction)

    this.cloverDeviceConnectionConfiguration = configBuilder.build()
  }

  buildCloverConnectionListener(cloverConnector) {
    return {
      ...clover.remotepay.ICloverConnectorListener.prototype,
      cloverConnector,
      onDeviceReady: (merchantInfo) => {
        console.log({ message: '🚀 Device ready to process requests!', merchantInfo })
      },
      onDeviceError: (cloverDeviceErrorEvent) => {
        console.log({ message: '⚠️ An error has occurred and we could not connect to your Clover Device.', cloverDeviceErrorEvent })
      },
      onDeviceDisconnected: (e) => {
        console.log({ message: '❌ Disconnected' })
      }
    }
  }
}

const start = new CloverConnector({ ...baseConfiguration, ...cloudConfiguration, useCloud })
start.connect()