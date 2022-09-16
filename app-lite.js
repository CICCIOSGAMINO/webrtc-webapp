// (App Skeleton)
import { LitElement, html, css } from 'lit'
import { sharedStyles } from './shared-styles.js'

import './rtc-caller.js'
import './rtc-callee.js'

class AppLite extends LitElement {

	static get styles () {
		return [
			sharedStyles,
			css`
        :host {
          min-width: 100%;
          min-height: 100vh;

          display: grid;
          justify-items: center;
          align-items: center;
          gap: 1rem;
        }

        #top-notification {
          --size: 37px;
          height: var(--size);

          position: absolute;
          top: 0;
          left: 0;
          right: 0;

          z-index: 101;

          font-size: 2rem;
          text-align: center;
          line-height: 3.7rem;
          color: var(--surface1);
          background-color: var(--brand);

          transform: translateY(-37px);
          animation: slideDown 5s 1.0s ease forwards;
        }

        @keyframes slideDown {
          0%, 100% {
            transform: translateY(-37px);
          }
          10%, 90% {
            transform: translateY(0px);
          }
        }

        /* box with objects */
        .box-container {
          width: 95%;
          height: max(250px, 20vh);

          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          place-content: center;

          gap: 1rem;
        }

        .box {          
          border: 2px solid var(--brand);

          display: flex;
          flex-direction: row;
          align-items: center;

          position: relative;
        }

        .box-title {
          position: absolute;
          top: -3.5rem;
        }

        .box-title-bottom {
          position: absolute;
          bottom: -3.5rem;
        }

        .session-box {
          margin: 1rem;
          width: 99px;
          height: 99px;
          background-color: yellowgreen;

          display: grid;
          place-content: center;

          cursor: pointer;
        }

        .ice-box {
          margin: 1rem;
          margin-left: auto;
          width: 99px;
          height: 99px;
          background-color: #FE019A;

          display: grid;
          place-content: center;

          cursor: pointer;
        }

        .box-text {
          font-size: 1.3rem;
          color: var(--brand);
          text-align: center;
        }
      `
		]
	}
	// properties
	static get properties () {
		return {
			title: String,
			offline: Boolean,
			mobileLayout: Boolean,
      channelOpened: Boolean,
      warpId: {
        type: String,
        state: true,
        attribute: false
      }
		}
	}

	constructor () {
		super()
		// init
		this.asideIsOpen = false
		this.offline = !navigator.onLine
		this.mobileLayout =
      window.innerWidth < 640

    this.warpId = '---'
    this.channelOpened = false

    // caller objects
    this.callerObjects = new Map()
    this.callerIceObjects = new Map()
    // callee objects
    this.calleeObjects = new Map()
    this.calleeIceObjects = new Map()
	}

	async connectedCallback () {
		super.connectedCallback()
		// online / offline
		window.addEventListener('online', this.#goingOnline)
		window.addEventListener('offline', this.#goingOffline)
		// match the media query
		window.matchMedia('(min-width: 640px)')
			.addEventListener('change', this.#handleResizeToDesktop)
		window.matchMedia('(max-width: 639px)')
			.addEventListener('change', this.#handleResizeToMobile)

    // init the events listeners
    this.addEventListener('caller-offer', this.#handleCallerOffer)
    this.addEventListener('caller-ice-candidate', this.#handleCallerIceCandidate)
    this.addEventListener('callee-answer', this.#handleCalleeAnswer)
    this.addEventListener('callee-ice-candidate', this.#handleCalleeIceCandidate)
    
	}

	async disconnectedCallback () {
		window.removeEventListener('online', this.#goingOnline)
		window.removeEventListener('offline', this.#goingOffline)
		super.disconnectedCallback()
	}

  firstUpdated () {

    // caller box drop listening
    const callerBox =
      this.renderRoot.getElementById('caller-box')

    callerBox.addEventListener('dragover', (event) => {
      event.dataTransfer.dropEffect = 'move'
      event.preventDefault()
    })
    callerBox.addEventListener('drop', (event) => {
      this.#dropElementToCaller(event)
    })

    // callee box drop listening
    const calleeBox =
      this.renderRoot.getElementById('callee-box')

    calleeBox.addEventListener('dragover', (event) => {
      event.dataTransfer.dropEffect = 'move'
      event.preventDefault()
    })
    calleeBox.addEventListener('drop', (event) => {
      this.#dropElementToCallee(event)
    })

    // caller iceBox drop listening
    const callerIceBox =
      this.renderRoot.getElementById('caller-ice-box')

    callerIceBox.addEventListener('dragover', (event) => {
      event.dataTransfer.dropEffect = 'move'
      event.preventDefault()
    })
    callerIceBox.addEventListener('drop', (event) => {
      this.#dropElementToCallee(event)
    })

    // callee iceBox drop listening
    const calleeIceBox =
      this.renderRoot.getElementById('callee-ice-box')

    calleeIceBox.addEventListener('dragover', (event) => {
      event.dataTransfer.dropEffect = 'move'
      event.preventDefault()
    })
    calleeIceBox.addEventListener('drop', (event) => {
      this.#dropElementToCallee(event)
    })

  }


	// handle back online
	#goingOnline = () => {
		this.offline = false
		console.log('@ONLINE')
		this.#showSnackBar('Online')
	}

	// handle going Offline
	#goingOffline = () => {
		this.offline = true
		console.log('@OFFLINE')
		this.#showSnackBar('Offline')
	}

	#showSnackBar (title) {
		const snack =
      this.renderRoot.querySelector('snack-bar')
		snack.title = title
		snack.setAttribute('active', '')
	}

	#handleResizeToDesktop = (e) => {
		if (e.matches) {
			this.mobileLayout = false
			console.log(`@MOBILE >> ${this.mobileLayout}`)
		}
	}

	#handleResizeToMobile = (e) => {
		if (e.matches) {
			this.mobileLayout = true
		}
	}

	// TODO - Test Async tasks
	_firePendingState () {
		const promise = new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve()
			}, 2000)
		})
		const event = new CustomEvent('pending-state', {
			detail: {
				title: 'Async task',
				promise
			}
		})
		this.dispatchEvent(event)
	}

  #handleCallerIceCandidate (event) {
    // RTCIceCandidate
    const ic =
      new RTCIceCandidate(event.detail)
    
    // @DEBUG
    console.log('@APP >> Caller Ice Candidate Received')

    this.callerIceObjects.set(ic.address, ic)

    const callerIceBox =
      this.renderRoot.getElementById('caller-ice-box')

    this.#createBox(
      ic,
      callerIceBox)
  }

  #handleCalleeIceCandidate (event) {
    // RTCIceCandidate
    const ic =
      new RTCIceCandidate(event.detail)

    // @DEBUG
    console.log('@APP >> Callee Ice Candidate Received')
    // console.log(ic)

    this.calleeIceObjects.set(ic.address, ic)

    const calleeIceBox =
      this.renderRoot.getElementById('callee-ice-box')

    this.#createBox(ic, calleeIceBox)
  }

  #handleCallerOffer (event) {
    // event.detail > RTCSessionDescription
    const sd = new RTCSessionDescription(
      event.detail.toJSON())

    const { id, type } = this.#getSmallId(sd)

    // @DEBUG
    console.log('@APP >> Caller Offer Received')
    // console.log(sd)

    this.callerObjects.set(id, sd)

    const callerBox =
      this.renderRoot.getElementById('caller-box')

    this.#createBox(sd, callerBox)
  }

  #handleCalleeAnswer (event) {
    // event.detail > RTCSessionDescription
    const sd = new RTCSessionDescription(
      event.detail.toJSON())

    const { id, type } = this.#getSmallId(sd)

    // @DEBUG
    console.log('@APP >> Callee Answer Received')
    // console.log(sd)

    this.calleeObjects.set(id, sd)

    const calleeBox =
      this.renderRoot.getElementById('callee-box')

    this.#createBox(sd, calleeBox)
  }

  #boxStartDrag (event) {

    // drop offer from caller > callee
    if (event.target.dataset.from === 'caller' &&
      event.target.dataset.type === 'offer') {
      // dataTransfer contai which map to query and id of element
      // you need to use to retrive data of the div moved
      event.dataTransfer.setData('session', true)
      event.dataTransfer.setData('caller', true)
      event.dataTransfer.setData('id', event.target.dataset.id)
      return
    }

    // drop answer from callee > caller
    if (event.target.dataset.from === 'callee' &&
      event.target.dataset.type === 'answer') {
      // dataTransfer contai which map to query and id of element
      // you need to use to retrive data of the div moved
      event.dataTransfer.setData('session', true)
      event.dataTransfer.setData('callee', true)
      event.dataTransfer.setData('id', event.target.dataset.id)
      return
    }

    // drop iceCandidate from caller > callee
    if (event.target.dataset.from === 'caller' &&
      event.target.dataset.type === 'host') {

      event.dataTransfer.setData('ice', true)
      event.dataTransfer.setData('caller', true)
      event.dataTransfer.setData('id', event.target.dataset.id)
      return
    }

    // drop iceCandidate from caller > callee
    if (event.target.dataset.from === 'callee' &&
      event.target.dataset.type === 'host') {

      event.dataTransfer.setData('ice', true)
      event.dataTransfer.setData('callee', true)
      event.dataTransfer.setData('id', event.target.dataset.id)
      return
    }
    
  }

  async #dropElementToCallee (event) {

    // two types of element can be dropped into callee
    // offer >> RTCSessionDescription
    // host (ice) >> RTCIceCandidate
    const isSession = event.dataTransfer.getData('session')
    const isIce = event.dataTransfer.getData('ice')
    const isCaller = event.dataTransfer.getData('caller')
    const isCallee = event.dataTransfer.getData('callee')
    const id = event.dataTransfer.getData('id')

    if (isCallee) {
      console.log('@WRONG >> Wrong drop Callee to Callee!')
      return
    }

    const calleeBox =
      this.renderRoot.getElementById('callee-box')
    const calleeIceBox =
      this.renderRoot.getElementById('callee-ice-box')

    const rtcCallee =
      this.renderRoot.querySelector('rtc-callee')

    if (isSession) {
      // RTCSessionDescription offer / answer
      const sd = new RTCSessionDescription(
        this.callerObjects.get(id))

      if (!sd) return

      this.#createBox(sd, calleeBox)
      // set the offer to callee
      const answer = await rtcCallee.setCallerOffer(sd)
    }

    if (isIce) {
      // RTCIceCandidate host / ?
      const ic = new RTCIceCandidate(
        this.callerIceObjects.get(id))

      if (!ic) return

      this.#createBox(ic, calleeIceBox)
      // set the iceCandidate to callee
      const r = await rtcCallee.addIceCandidate(ic)
    }

  }

  async #dropElementToCaller (event) {

    // two types of element can be dropped into callee
    // offer >> RTCSessionDescription
    // host (ice) >> RTCIceCandidate
    const isSession = event.dataTransfer.getData('session')
    const isIce = event.dataTransfer.getData('ice')
    const isCaller = event.dataTransfer.getData('caller')
    const isCallee = event.dataTransfer.getData('callee')
    const id = event.dataTransfer.getData('id')

    if (isCaller) {
      console.log('@WRONG >> Wrong drop Caller to Caller!')
      return
    }

    const callerBox =
      this.renderRoot.getElementById('caller-box')
    const callerIceBox =
      this.renderRoot.getElementById('caller-ice-box')

    const rtcCaller =
      this.renderRoot.querySelector('rtc-caller')

    if (isSession) {
      // RTCSessionDescription offer / answer
      const sd = new RTCSessionDescription(
        this.calleeObjects.get(id))

      if (!sd) return

      this.#createBox(sd, callerBox)

      // set the answer on caller received from callee
      await rtcCaller.setCalleeAnswer(sd)
    }

    if (isIce) {
      // RTCIceCandidate host / ?
      const ic = new RTCIceCandidate(
        this.calleeIceObjects.get(id))

      if (!ic) return

      this.#createBox(ic, calleeIceBox)
      
      // iceCandidate get back from callee
      await rtcCaller.addIceCandidate(ic)
    }
    
  }

  // get small box id from RTCSessionDescription
  #getSmallId (rtcSessionDesc) {
    
    const type = rtcSessionDesc.type
    const sdp = rtcSessionDesc.sdp
    const shaIndex = (sdp.search('fingerprint:sha-256') + 20)
    const id = sdp.slice(shaIndex, shaIndex + 32)

    return { type, id }
  }

  // rtcInterface : RTCSessionDescription / RTCIceCandidate
  #createBox (rtcInterface, parentBox) {

    const newDiv = document.createElement('div')
    newDiv.setAttribute('data-from', parentBox.dataset.from)

    const boxText = document.createElement('h5')
    boxText.classList.add('box-text')

    if (rtcInterface instanceof RTCSessionDescription) {

      const { id, type } = this.#getSmallId(rtcInterface)

      if (this.#isAlreadyPresent(id, parentBox)) return

      // session offer / answer (class session-box)
      newDiv.classList.add('session-box')
      newDiv.setAttribute('data-id', id)
      newDiv.setAttribute('data-type', type)

      boxText.innerText =
        `${type}\n${id}...`

      newDiv.setAttribute('draggable', true)

      // attach listener
      newDiv.addEventListener('dragstart', this.#boxStartDrag)
  
      newDiv.appendChild(boxText)
      parentBox.appendChild(newDiv)

    }

    if (rtcInterface instanceof RTCIceCandidate) {

      if(this.#isAlreadyPresent(rtcInterface.address, parentBox)) return

      // ice candidate (class ice)
      newDiv.classList.add('ice-box')
      newDiv.setAttribute('data-id', rtcInterface.address)
      newDiv.setAttribute('data-type', rtcInterface.type)

      boxText.innerText =
        `${rtcInterface.type}\n${rtcInterface.address}...`

      newDiv.setAttribute('draggable', true)

      // attach listener
      newDiv.addEventListener('dragstart', this.#boxStartDrag)
  
      newDiv.appendChild(boxText)
      parentBox.appendChild(newDiv)
    }
  }

  #isAlreadyPresent(dataId, parentBox) {
    const r =
      parentBox.querySelectorAll(`div[data-id='${dataId}']`)
      return r.length > 0 ? true : false
  }

	render () {
		return html`

      <!-- top notification -->
      <div id="top-notification">
        Top notification bar
      </div>

      <rtc-caller></rtc-caller>

      <div class="box-container">
        <div id="caller-box" class="box" data-from="caller">
            <h2 class="box-title">Caller RTCSessionDescription</h2>
        </div>

        <div id="caller-ice-box" class="box" data-from="caller">
          <h2 class="box-title">Caller RTCIceCandidate</h2>
        </div>

        <div id="callee-box" class="box" data-from="callee">
            <h2 class="box-title-bottom">Callee RTCSessionDescription</h2>
        </div>

        <div id="callee-ice-box" class="box" data-from="callee">
          <h2 class="box-title-bottom">Callee RTCIceCandidate</h2>
        </div>
      </div>

      <rtc-callee></rtc-callee>

      <snack-bar timing="3000"></snack-bar>
    `
	}

	/* no shadowed (encapsulated CSS unavailable)
  createRenderRoot () {
    return this
  } */
}

window.customElements.define('app-lite', AppLite)