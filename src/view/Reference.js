import { repeat, ref } from '../../feppla/feppla.js'

const references = new Array(75).fill(0)

export const Reference = () => `
  <div class="reference">

    ${repeat(() => references, (_, index) => `
      <div class="map-reference" map-width="?" map-height="?">
        <img ${ref()
          .property('src', () => `references/maps-from-secret-place-homepage/${String(index).padStart(2, '0')}.png`)
          .on('load', (event) => {
            const width = event.target.clientWidth / 16
            const height = event.target.clientHeight / 16
            event.target.parentElement.setAttribute('map-width', width)
            event.target.parentElement.setAttribute('map-height', height)
          })
        }>
      </div>
    `)}


  </div>
`