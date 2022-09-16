import { LitElement, html, css } from 'lit'
import { sharedStyles } from './shared-styles.js'
import { RTCController } from './rtc-controller.js'

let peerConnection

class RTCCallee extends LitElement {

    #rtcController = new RTCController(this, 'CALLEE')

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
      
            // dispatch ICE candidate
            this.#fireCustomEvent(
                'callee-ice-candidate',
                event.candidate.toJSON()
            )

            console.log(
                `@ICE Callee ${candidateCount} >> `,
                event.candidate.toJSON().candidate)
          })
    }

    async setCallerOffer (offer) {

        // @DEBUG
        console.log('@CALLEE >> Set Caller Offer')

        const calleeAnswer =
            await this.#rtcController.setCallerOffer(offer)

        this.#fireCustomEvent(
            'callee-answer',
            calleeAnswer
        )
    }

    async addIceCandidate (ic) {

        // @DEBUG
        console.log('@CALLEE >> addIceCandidate received from Caller')

        await this.#rtcController.addIceCandidate(ic)

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
            <h2>Callee</h2>
            <button @click=${this.#sendMsg}>Send</button>
        `
    }

}

window.customElements.define('rtc-callee', RTCCallee)