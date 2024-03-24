import { ref, repeat, conditional, text } from '../feppla/feppla.js'

import { Game } from './view/Game.js'
import { Editor } from './view/Editor.js'
import { Design } from './view/Design.js'

const routes = [
  {
    path: '/game',
    name: 'Game',
    view: Game
  },
  {
    path: '/editor',
    name: 'Editor',
    view: Editor
  },
  {
    path: '/design',
    name: 'Design',
    view: Design
  }
]

let currentRoute
const updateRoute = () => {
  const currentPath = location.hash?.substring(1)

  for (let i = 0 ; i < routes.length ; ++i) {
    const route = routes[i]
    if (route.path === currentPath) {
      currentRoute = route
      return
    }
  }

  location.hash = `#${routes[0].path}`
}

updateRoute()
window.addEventListener('hashchange', updateRoute)

ref(document)
  .property('title', () => [currentRoute?.name,'Lagoon'].join(' | '))
  .done()

document.querySelector('#app').innerHTML = `
  <div class="main-menu dialog">
    ${repeat(() => routes, (route) => `
      <div class="item" ${ref()
        .class('selected', () => route === currentRoute)
        .on('click', () => location.hash = `#${route.path}`)
      }>
        ${text(() => route.name)}
      </div>
    `)}
  </div>

  ${conditional(() => currentRoute, () => currentRoute.view())}
`
