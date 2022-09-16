import { ICE_TWILIO_CONF} from './config.local.js'

// mozilla    stun.services.mozilla.org
const ICE_GOOGLE_CONF = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  }

export class RTCController {

    constructor (host, callType) {

        (this.host = host).addController(this)

        // init
        this.callerOrCallee = callType

        // ICE Google Config
        // this.peerConnection = new RTCPeerConnection(this.ICE_GOOGLE_CONF)

        // ICE Twilio Config
        this.peerConnection = new RTCPeerConnection(this.ICE_TWILIO_CONF)

        this.initDataChannel()
        this.#registerPeerConnectionListeners()

    }

    hostConnected () {
	    this.host.requestUpdate()
    }

    hostDisconnected () {
        console.log('@HOST >> Disconnected from Controller')
    }

    hostUpdated () {
        console.log('@HOST >> Updated by Controller')
    }

    /**
     *  #caller #1 - create the offer and set the localDescription on peerConnection
     * @returns 'offer' - caller offer 
     */
     async createOffer () {
        const offer = await this.peerConnection.createOffer()
        await this.peerConnection.setLocalDescription(offer)

        return offer
    }

    /**
     * #callee #1 - receive the caller offer, set the peerConnection handler to callee
     * this method once called set the peerConnection to CALLEE
     * 
     */
    async setCallerOffer (offer) {

      this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      )

      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      return answer
    }

    // setRemoteDescription received from Callee on Caller
    async setCalleeAnswerOnCaller (answer) {
      if (this.callerOrCallee === 'CALLER') {

        this.peerConnection.setRemoteDescription(answer)
      } else {
        console.error(`@ERROR >> Called a caller method on callee!`)
      }
    }

    /**
     * Set the IceCandidate, can be set from both CALLER / CALLEE
     * @param {RTCIceCandidate} iceCandidate 
     */
    addIceCandidate (iceCandidate) {
      this.peerConnection.addIceCandidate(iceCandidate)
    }

    listenIceCandidate (callback) {
        this.peerConnection.addEventListener('icecandidate', callback)
    }

    #registerPeerConnectionListeners() {

      this.peerConnection.addEventListener('iceconnectionstatechange ', () => {
        console.log(
            `@ICE-${this.callerOrCallee} Connection state change >> ${this.peerConnection.iceConnectionState}`)
      })
      
      this.peerConnection.addEventListener('icegatheringstatechange', () => {
        console.log(
            `@ICE-${this.callerOrCallee} Gathering state changed >> ${this.peerConnection.iceGatheringState}`)
      })
  
      this.peerConnection.addEventListener('icecandidateerror', (err) => {
        console.log(`@ICE-${this.callerOrCallee} icecandidateerror >> `, err)
      })
    
      this.peerConnection.addEventListener('connectionstatechange', () => {
        console.log(`@CONNECTION-${this.callerOrCallee} STATE CHANGE >> ${this.peerConnection.connectionState}`)
  
        // gathering the connectionState
        // if (this.peerConnection.connectionState === 'connected') {
        //   console.log('@PEER >> Connected!')
        // }

      })
    
      // listening to signalingstate change
      this.peerConnection.addEventListener('signalingstatechange', () => {
        console.log(`@SIGNALING-${this.callerOrCallee} >> ${this.peerConnection.signalingState}`)
      })
    
    }

    // ----------------------------- DATA CHANNEL ---------------------------
    initDataChannel () {

      const chName = 'X07'

      // the caller start the data channel - callee listen to
      if (this.callerOrCallee === 'CALLER') {

        this.ch = this.peerConnection.createDataChannel(chName)
        this.#initDataListeners()
      }

      
      // The remote peer can receive data channels by listening for the datachannel
      // event on the RTCPeerConnection object. The received event is of the type
      // RTCDataChannelEvent and contains a channel property that represents the
      // RTCDataChannel connected between the peers.
      if (this.callerOrCallee === 'CALLEE') {
        this.peerConnection.addEventListener('datachannel', event => {
          console.log(`@${chName}-${this.callerOrCallee} >> `, event.channel)

          this.ch = event.channel
          this.#initDataListeners()
        })
      }

    }

    #initDataListeners () {

      if (!this.ch) return

      // RTCDataChannel
      const chName = this.ch.label

      this.ch.addEventListener('open', event => {
        // data channel open
        console.log(`@${chName}-${this.callerOrCallee} >> OPEN`)
      })

      this.ch.addEventListener('close', event => {
          // data channel close
          console.log(`@${chName}-${this.callerOrCallee} >> CLOSE`)
      })

      this.ch.addEventListener('message', event => {
          console.log(`@${chName}-${this.callerOrCallee} MSG (Received) >> ${event.data}`)
      })

      this.ch.addEventListener('error', event => {
          console.log(`@ERROR-${this.callerOrCallee} >> ${event}`)
      })
    }

    async sendMsg (text) {

      if (!this.ch) return

      this.ch.send(text)

      // @DEBUG
      // this.debugPeerConnection()
      // this.debugRTCDataChannel(this.ch)
    }

    async getWebRTCConnectionStats () {
      if (!this.peerConnection) return
  
      let statsOutput = `${this.callerOrCallee} `
      const stats = await this.peerConnection.getStats(null)
      
      stats.forEach((report) => {
        // check what you want to see
        // https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_Statistics_API
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          Object.keys(report).forEach((statName) => {
            statsOutput += `${statName}: ${report[statName]}\n`;
          })
        }
  
        // describing the state of the RTCPeerConnection
        if (report.type === 'peer-connection') {
          statsOutput += '@peer-connection\n'
          Object.keys(report).forEach((statName) => {
            statsOutput += `${statName}: ${report[statName]}\n`;
          })
        }
  
        // statistics about a transport used by the connection
        if (report.type === 'transport') {
          statsOutput += '@transport\n'
          Object.keys(report).forEach((statName) => {
            statsOutput += `${statName}: ${report[statName]}\n`;
          })
        }
  
      })
  
      console.log(statsOutput)
    }

    debugPeerConnection () {
      // RTCPeerConnection
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection

      const pc = this.peerConnection
      const peerIdentity = pc.peerIdentity

      if (!pc || !(pc instanceof RTCPeerConnection)) {
        console.log(`@DEBUG-RTCPeerConnection >> ${pc}`)
        return
      }

      // properties
      console.log('-------------------------------------------')
      console.log(`@DEBUG-RTCPeerConnection >> ${peerIdentity}`)
      console.log(`connectionState ${pc.connectionState}`)
      // RTCSessionDescription
      // console.log(`currentLocalDescription ${pc.currentLocalDescription}`)
      // console.log(`currentRemoteDescription ${pc.currentRemoteDescription}`)
      console.log(`iceConnectionState ${pc.iceConnectionState}`)
      // RTCSctpTransport
      // console.log(`sctp ${pc.sctp}`)
      console.log(`signalingState ${pc.signalingState}`)
      console.log('-------------------------------------------')

    }

    debugRTCSessionDescription (sd) {
      // RTCSessionDescription
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCSessionDescription

      if (!sd || !(sd instanceof RTCSessionDescription)) {
        console.log(`@DEBUG-RTCSessionDescription >> ${sd}`)
        return
      }

      // properties
      console.log('-------------------------------------------')
      console.log(`@DEBUG-RTCSessionDescription >> `)
      console.log(`type ${sd.type}`)
      console.log(`spd ${sd.sdp}`)
      console.log('-------------------------------------------')

      // method toJSON()
    }

    debugRTCIceCandidate (ic) {
      // RTCIceCandidate
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate

      if (!ic || !(ic instanceof RTCIceCandidate)) {
        console.log(`@DEBUG-RTCIceCandidate >> ${ic}`)
        return
      }

      // properties
      console.log('-------------------------------------------')
      console.log(`@DEBUG-RTCIceCandidate >> `)
      console.log(`address ${ic.address}`)
      console.log(`candidate ${ic.candidate}`)
      console.log(`component ${ic.component}`)
      console.log(`foundation ${ic.foundation}`)
      console.log(`port ${ic.port}`)
      console.log(`protocol ${ic.protocol}`)
      console.log(`relatedAddress ${ic.relatedAddress}`)
      console.log(`relatedPort ${ic.relatedPort}`)
      console.log(`sdpMid ${ic.sdpMid}`)
      console.log(`sdpMLineIndex ${ic.sdpMLineIndex}`)
      console.log(`tcpType ${ic.tcpType}`)
      console.log(`type ${ic.type}`)
      console.log(`usernameFragment ${ic.usernameFragment}`)
      console.log('-------------------------------------------')

      // method toJSON()
    }

    debugRTCDataChannel (ch) {
      // RTCDataChannel
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel

      if (!ch || !(ch instanceof RTCDataChannel)) {
        console.log(`@DEBUG-RTCDataChannel >> ${ch}`)
        return
      }

      // properties
      console.log('-------------------------------------------')
      console.log(`@DEBUG-RTCDataChannel >> Channel ${ch.label}`)
      console.log(`id ${ch.id}`)
      console.log(`label ${ch.label}`)
      console.log(`binaryType ${ch.binaryType}`)
      console.log(`maxPacketLifeTime ${ch.maxPacketLifeTime}`)
      console.log(`maxRetransmits ${ch.maxRetransmits}`)
      console.log(`negotiated ${ch.negotiated}`)
      console.log(`ordered ${ch.ordered}`)
      // empty protocol means no subprotocol in use
      console.log(`protocol ${ch.protocol}`)
      console.log(`readyState ${ch.readyState}`)
      console.log('-------------------------------------------')

      // methods close() / send()

      // listening the events - docs for complete reference
      ch.addEventListener('close', () => {
        // Sent when the underlying data transport closes.
      })
    }

    debugRTCSctpTransport (sctp) {
      // RTCSctpTransport
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCSctpTransport

      if (!sctp || !(sctp instanceof RTCSctpTransport)) {
        console.log(`@DEBUG-RTCSctpTransport >> ${sctp}`)
        return
      }

      // TODO
    }

    debugRTCIceTransport () {
      // TODO
      // const remoteCandidates =
      //   this.peerConnection.getSenders()[0].transport.transport.getRemoteCandidates()

      // remoteCandidates.forEach((candidate, index) => {
      //   console.log("Candidate " + index + ": " + candidate.candidate)
      // })

    }

}