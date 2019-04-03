require('dotenv').config()
const clover = require('remote-pay-cloud')
const { XMLHttpRequest } = require('xmlhttprequest-ssl')

// https://github.com/clover/remote-pay-cloud/blob/bc1bc6fec041484b9fcfee8d2665a4fd0a654c3e/src/com/clover/util/HttpSupport.ts
const httpSupport = new clover.HttpSupport(XMLHttpRequest)

const { applicationId, merchantId, accessToken, deviceId, cloverServer, friendlyId, posName, serialNumber } = process.env

const baseConfiguration = { applicationId, posName, serialNumber }
const cloudConfiguration = { accessToken, cloverServer, merchantId, deviceId, friendlyId, httpSupport }

const useCloudConfiguration = true


class CloverConnector {
  constructor() {
    this.applicationId = applicationId
    this.accessToken = accessToken
    this.merchantId = merchantId
    this.deviceId = deviceId
    this.cloverServer = cloverServer
    this.friendlyId = friendlyId
    this.cloverConnector = null
    this.cloverDeviceConnectionConfiguration = null
  }

  connect() {
    clover.DebugConfig.loggingEnabled = true

    if (useCloudConfiguration) {
      this.getDeviceConfigurationForCloud({ ...baseConfiguration, ...cloudConfiguration })
      console.log('🧪', this.cloverDeviceConnectionConfiguration, '\n')
    }

    const builderConfiguration = {}
    builderConfiguration[clover.CloverConnectorFactoryBuilder.FACTORY_VERSION] = clover.CloverConnectorFactoryBuilder.VERSION_12
    const cloverConnectorFactory = clover.CloverConnectorFactoryBuilder.createICloverConnectorFactory(builderConfiguration)
    const cloverConnector = cloverConnectorFactory.createICloverConnector(this.cloverDeviceConnectionConfiguration)
    this.setCloverConnector(cloverConnector)
    cloverConnector.addCloverConnectorListener(this.buildCloverConnectionListener(cloverConnector))
    cloverConnector.initializeConnection()
  }

  getDeviceConfigurationForCloud({ applicationId, accessToken, cloverServer, deviceId, friendlyId, httpSupport, merchantId }) {
    const configBuilder = new clover.WebSocketCloudCloverDeviceConfigurationBuilder(applicationId, deviceId, merchantId, accessToken)

    configBuilder.setCloverServer(cloverServer)
    configBuilder.setFriendlyId(friendlyId)
    configBuilder.setHttpSupport(httpSupport)
    // 👷‍♂️ To-do: build websocket functionality
    configBuilder.setWebSocketFactoryFunction()

    this.cloverDeviceConnectionConfiguration = configBuilder.build()
  }

  buildCloverConnectionListener() {
    return {
      ...clover.remotepay.ICloverConnectorListener.prototype,
      onDeviceReady: (merchantInfo) => {
        console.log({ message: 'Device Ready to process requests!', merchantInfo })
      },
      onDeviceError: (cloverDeviceErrorEvent) => {
        console.log({ message: 'An error has occurred and we could not connect to your Clover Device.', cloverDeviceErrorEvent })
      },
      onDeviceDisconnected: (e) => {
        console.log({ message: 'Disconnected' })
      }
    }
  }

  setCloverConnector(cloverConnector) {
    this.cloverConnector = cloverConnector
  }
}

const start = new CloverConnector()
start.connect()