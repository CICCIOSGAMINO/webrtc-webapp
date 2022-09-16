import { LitElement, html, css } from 'lit'
import { sharedStyles } from './shared-styles.js'
import { RTCController } from './rtc-controller.js'

let peerConnection

class RTCCaller extends LitElement {

    #rtcController = new RTCController(this, 'CALLER')

    static get styles () {
		return [
			sharedStyles,
			css`
                :host {
                    margin: 3rem;
                    padding: 1rem;
                    min-width: 50%;
                    min-height: 91px;
                    background-color: yellowgreen;
                }
            `
        ]
    }

    constructor () {
        super()
        this.#initIceCandidateListener()
    }

    #initIceCandidateListener () {
        // listen of ICE candidate
        let candidateCount = 0
        this.#rtcController.listenIceCandidate(async (event) => {
            candidateCount++

            if (!event.candidate) {
              console.log('@ICE-CALLEE >> Candidate Got Final!')
              return
            }

            // @DEBUG
            // this.#rtcController.debugRTCIceCandidate(event.candidate)
      
            // dispatch ICE candidate
            this.#fireCustomEvent(
                'caller-ice-candidate',
                event.candidate.toJSON()
            )

            console.log(
                `@ICE Callee ${candidateCount} >> `,
                event.candidate.toJSON().candidate)
          })
    }

    // #1
    async #createOffer () {

        this.#rtcController.debugRTCIceTransport()

        // #1 crete the caller offer and setLocalDescription
        const offer =
            await this.#rtcController.createOffer()

        // @DEBUG
        // this.#rtcController.debugRTCSessionDescription(offer)

        // fire event to parent
        this.#fireCustomEvent(
            'caller-offer',
            offer
        )
    }

    // #2
    async setCalleeAnswer (answer) {

        // @DEBUG
        console.log('@CALLER >> Set Callee Answer')

        await this.#rtcController.setCalleeAnswerOnCaller(answer)
    }

    #sendMsg () {
        // ch opened between the two components
        this.#rtcController.sendMsg(`${Date.now()}`)
    }

    #fireCustomEvent (eventType, eventDetail) {
        const ce = new CustomEvent(
            eventType, {
                bubbles: true,
                composed: true,
                detail: eventDetail
            })

        this.dispatchEvent(ce)
    }

    render () {
        return html`
            <h2>Caller</h2>
            <button @click=${this.#createOffer}>Create Caller Offer</button>

            <button @click=${this.#sendMsg}>Send</button>
        `
    }

}

window.customElements.define('rtc-caller', RTCCaller)