//@ts-check
import { ref, repeat, conditional, text } from '../feppla/feppla.js'

import { Game } from './view/Game.js'
import { Editor } from './view/Editor.js'
import { Reference } from './view/Reference.js'
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
    path: '/reference',
    name: 'Reference',
    view: Reference
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

//@ts-ignore
document.querySelector('#app').innerHTML = `
  <div class="main-menu dialog">
    ${repeat(() => routes, (route) => `
      <a class="item" ${ref()
        .class('selected', () => route === currentRoute)
        .property('href', () => `#${route.path}`)
      }>
        ${text(() => route.name)}
      </a>
    `)}
  </div>

  ${conditional(() => currentRoute, () => currentRoute.view())}
`
