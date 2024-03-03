// 1. [DONE] Full page static render => .innerHTML
// 2. [DONE] Full page static render with data => .innerHTML + tagged template literal
// 3. [DONE] Event binding => Delayed binding by unique ref attribute
// 4. [DONE] Unify initial static data render with dynamic update => live binding
// 5. [DONE] Support derivative data => comparison function for set
// 6. [DONE] Daisy-chained API to reduce refs => Refactored API and implementatoin
// 7. Support templating for conditional renderering

let refIdGenerator = 0
export const debugRefCounter = () => refIdGenerator

let liveWatchers = 0
let liveQueue = []
requestAnimationFrame(function processLiveQueue() {
  const currentQueue = liveQueue
  liveQueue = []
  for (let i = 0 ; i < currentQueue.length; ++i) {
    currentQueue[i]()
  }
  requestAnimationFrame(processLiveQueue)
})
export const debugLiveWatchers = () => liveWatchers

const repeatTemplate = document.createElement('template')
const validateRepeatSingleRoot = (children) => children.length > 1 && console.error('Repeat does not support multiple roots in render function, remaining roots omitted!')

export const ref = () => {
  const callbacks = []
  const api = {
    ref: (callback) => {
      callbacks.push(callback)
      return api
    },

    live: (callback) => {
      callbacks.push((el) => {
        ++liveWatchers
        callback(el)
        liveQueue.push(function update() {
          if (el.isConnected) {
            callback(el)
            liveQueue.push(update)
          } else {
            --liveWatchers
          }
        })
      })
      return api
    },

    set: (setter, valueFunc, compareFunc = (a, b) => a === b) => {
      let oldValue
      api.live((el) => {
        const newValue = valueFunc()
        if (!compareFunc(newValue, oldValue)) {
          setter(el, newValue, oldValue)
          oldValue = newValue
        }
      })
      return api
    },

    repeat: (valueFunc, renderFunc, keyFunc = (item, index) => item, compareFunc) => {
      api.set((el, items) => {
        const currentChildren = Array.from(el.children)
      
        for (let index = 0 ; index < items.length ; ++index) {
          const item = items[index]
          const key = keyFunc(item, index)
          const currentElementIndex = currentChildren.findIndex(x => x._key === key)
          let element
      
          if (currentElementIndex < 0) {
            if (el instanceof SVGElement) {
              repeatTemplate.innerHTML = `<svg>${renderFunc(item, index)}</svg>`
              element = repeatTemplate.content.children[0].children[0]
              validateRepeatSingleRoot(repeatTemplate.content.children[0].children)
            } else {
              repeatTemplate.innerHTML = renderFunc(item, index)
              element = repeatTemplate.content.children[0]
              validateRepeatSingleRoot(repeatTemplate.content.children)
            }
            element._key = key
          } else {
            element = currentChildren.splice(currentElementIndex, 1)[0]
          }
          el.insertBefore(element, el.children[index])
        }
      
        for (let i = 0 ; i < currentChildren.length ; ++i) {
          currentChildren[i].remove()
        }
      }, valueFunc, compareFunc)
      return api
    },

    // TODO: Make "on" set based instead so you can change or remove the event listener dynamically
    on: (type, callback, options = {}) => {
      api.ref((el) => el.addEventListener(type, (event) => callback(event, el), options))
      return api
    },

    style: (property, valueFunc) => {
      api.set((el, value) => el.style[property] = value, valueFunc)
      return api
    },

    property: (property, valueFunc) => {
      api.set((el, value) => el[property] = value, valueFunc)
      return api
    },

    attribute: (attribute, valueFunc) => {
      api.set((el, value) => el.setAttribute(attribute, value), valueFunc)
      return api
    },

    class: (className, valueFunc) => {
      api.set((el, value) => el.classList.toggle(className, value), valueFunc)
      return api
    },

    toString: () => {
      const refAttribute = `_ref_${++refIdGenerator}_`

      queueMicrotask(() => {
        const el = document.querySelector(`[${refAttribute}]`)
        if (!el) {
          console.error('Element could not be found during referencing!')
          return
        }
        el.removeAttribute(refAttribute)

        for (let i = 0 ; i < callbacks.length ; ++i) {
          callbacks[i](el)
        }
      })
    
      return refAttribute
    }
  }

  return api
}

// Helpers
export const compareArrays = (a, b) => a === b || (a?.length === b?.length && a.every((element, index) => element === b[index]))