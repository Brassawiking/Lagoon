import { ref, switchy } from '../feppla/feppla.js'

import { Game } from './view/Game.js'
import { Editor } from './view/Editor.js'
import { Design } from './view/Design.js'

const LOCATION_GAME = '#/game'
const LOCATION_EDITOR = '#/editor'
const LOCATION_DESIGN = '#/design' 

let currentRouteName
const updateRoute = () => {
  switch(location.hash) {
    case LOCATION_GAME:
      currentRouteName = 'Game'
      break
    case LOCATION_EDITOR:
      currentRouteName = 'Editor'
      break
    case LOCATION_DESIGN:
      currentRouteName = 'Design'
      break
    default:
      location.hash = LOCATION_EDITOR
  }
}

updateRoute()
window.addEventListener('hashchange', updateRoute)

ref(document)
  .property('title', () => [currentRouteName,'Lagoon'].join(' | '))
  .done()

document.querySelector('#app').innerHTML = `
  <div class="main-menu dialog">
    <div class="item" ${ref()
      .class('selected', () => location.hash === LOCATION_GAME)
      .on('click', () => location.hash = LOCATION_GAME)
    }>
      Game
    </div>

    <div class="item" ${ref()
      .class('selected', () => location.hash === LOCATION_EDITOR)
      .on('click', () => location.hash = LOCATION_EDITOR)
    }>
      Editor
    </div>

    <div class="item" ${ref()
      .class('selected', () => location.hash === LOCATION_DESIGN)
      .on('click', () => location.hash = LOCATION_DESIGN)
    }>
      Design
    </div>
  </div>

  ${switchy(() => location.hash, {
    [LOCATION_GAME]: Game,
    [LOCATION_EDITOR]: Editor,
    [LOCATION_DESIGN]: Design
  })}
`
