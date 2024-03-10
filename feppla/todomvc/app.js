import { ref, compareArrays, text, iffy, repeat } from '../feppla.js'

let todos = []
let editingTodo

const LOCATION_ALL = '#/all'
const LOCATION_ACTIVE = '#/active'
const LOCATION_COMPLETED = '#/completed' 

let currentFilter
const updateFilter = () => {
  switch(location.hash) {
    default:
    case LOCATION_ALL:
      currentFilter = (todo) => todo
      break
    case LOCATION_ACTIVE:
      currentFilter = (todo) => !todo.done
      break
    case LOCATION_COMPLETED:
      currentFilter = (todo) => todo.done
      break
  }
}

updateFilter()
window.addEventListener('hashchange', updateFilter)

document.querySelector('#app').innerHTML = `
  <section class="todoapp">
    <header class="header">
      <h1>todos</h1>
      <input class="new-todo" 
        placeholder="What needs to be done?" 
        autofocus
        ${ref()
          .on('keydown', (event) => {
            if (event.key === 'Enter') {
              todos = [
                ...todos,
                {
                  name: event.target.value,
                  done: false
                }
              ]
              event.target.value = ''
            }
          })
        }
      >
    </header>

    ${iffy(() => todos.length, () => `
      <section class="main">
        <input id="toggle-all" 
          class="toggle-all" 
          type="checkbox"
          ${ref()
            .on('change', () => {
              const hasRemainingTodos = todos.find((x) => !x.done)
              for (const todo of todos) {
                todo.done = hasRemainingTodos
              }
            })
          }
        >
        <label for="toggle-all">Mark all as complete</label>
        <ul class="todo-list"> 
          ${repeat(() => todos.filter(currentFilter), (todo) => `
            <li ${ref()
              .class('editing', () => todo === editingTodo)
              .class('completed', () => todo.done)
            }>
              <div class="view">
                <input class="toggle" 
                  type="checkbox" 
                  checked
                  ${ref()
                    .property('checked', () => todo.done)
                    .on('change', () => todo.done = !todo.done)
                  }
                >
                <label ${ref()
                  .on('dblclick', (event, el) => {
                    editingTodo = todo
                    requestAnimationFrame(() => {
                      el.closest('li').querySelector('.edit').focus()
                    })
                  })
                }>
                  ${text(() => todo.name)}
                </label>
        
                <button class="destroy" ${ref().on('click', () => todos = todos.filter((x) => x !== todo))}></button>
              </div>
        
              <input class="edit" ${ref()
                .property('value', () => todo.name)
                .on('input', (event) => todo.name = event.target.value)
                .on('blur', () => editingTodo = null)
                .on('keypress', (event) => { if (event.key === 'Enter') editingTodo = null })
              }>
            </li>
          `, (todo) => todo, compareArrays)}
        </ul>
      </section>

      <footer class="footer">
        <span class="todo-count">
          <strong>${text(() => todos.filter((x) => !x.done).length)}</strong> item left
        </span>
        
        <ul class="filters">
          <li>
            <a ${ref()
              .property('href', () => LOCATION_ALL)
              .class('selected', () => !location.hash || location.hash === LOCATION_ALL)
            }>
              All
            </a>
          </li>
          <li>
            <a ${ref()
              .property('href', () => LOCATION_ACTIVE)
              .class('selected', () => location.hash === LOCATION_ACTIVE)
            }>
              Active
            </a>
          </li>
          <li>
            <a ${ref()
              .property('href', () => LOCATION_COMPLETED)
              .class('selected', () => location.hash === LOCATION_COMPLETED)
            }>
              Completed
            </a>
          </li>
        </ul>

        ${iffy(() => todos.some((x) => x.done), () => `
          <button class="clear-completed" ${ref().on('click', () => todos = todos.filter((x) => !x.done))}>
            Clear completed
          </button>    
        `)}
      </footer>
    `)}
  </section>

  <footer class="info">
    <p>Double-click to edit a todo</p>
    <p>Created by <a href="https://github.com/Brassawiking">Brassawiking</a></p>
    <p>Based on <a href="http://todomvc.com">TodoMVC</a></p>
  </footer>
`
