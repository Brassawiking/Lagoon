import { repeat, ref } from '../../feppla/feppla.js'

const references = new Array(75).fill(0)

export const Reference = () => `
  <div class="reference">

    ${repeat(() => references, (_, index) => `
      <img ${ref()
        .property('src', () => `references/maps-from-secret-place-homepage/${String(index).padStart(2, '0')}.png`)
      }>
    `)}


  </div>
`