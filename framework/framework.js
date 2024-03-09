let refIdGenerator = 0
export const debugRefCounter = () => refIdGenerator

let templateIdGenerator = 0
export const debugTemplateCounter = () => templateIdGenerator

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

export const ref = (node) => {
  const callbacks = []
  const api = {
    node: (callback) => {
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
        const newValue = valueFunc(el)
        if (!compareFunc(newValue, oldValue)) {
          setter(el, newValue, oldValue)
          oldValue = newValue
        }
      })
      return api
    },

    // TODO: Make "on" set based instead so you can change or remove the event listener dynamically
    on: (type, callback, options = {}) => {
      api.node((el) => el.addEventListener(type, (event) => callback(event, el), options))
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

    done: () => {
      if (!node) {
        console.error('Called .done() without explict node reference!')
        return
      }

      for (let i = 0 ; i < callbacks.length ; ++i) {
        callbacks[i](node)
      }
    },

    toString: () => {
      if (node) {
        console.error('Used deferred referencing with explicit node reference!')
        return ''
      }

      const refAttribute = `_ref_${++refIdGenerator}_`

      queueMicrotask(() => {
        const element = document.querySelector(`[${refAttribute}]`)
        if (!element) {
          console.error('Element could not be found during referencing!')
          return
        }
        element.removeAttribute(refAttribute)

        for (let i = 0 ; i < callbacks.length ; ++i) {
          callbacks[i](element)
        }
      })
    
      return refAttribute
    }
  }

  return api
}

const renderTemplate = document.createElement('template')
const validateRepeatRenderingSingleRoot = (children) => children.length > 1 && console.error('Repeat does not support multiple roots in render function, remaining roots omitted!')

// TODO: Revise template code structure (keeping this internal for now)
// TODO: Support explicit insertion point?
const template = () => {
  const callbacks = []
  const api = {
    insert: (callback) => {
      callbacks.push(callback)
      return api
    },

    text: (valueFunc) => {
      callbacks.push((insert) => {
        ref(insert(document.createTextNode('')))
          .set((node, value) => node.textContent = value, valueFunc)
          .done()
      })
      return api
    },

    conditional: (valueFunc, renderFunc) => {
      callbacks.push((insert) => {
        const startNode = insert(document.createTextNode(''))
        const endNode = insert(document.createTextNode(''))

        ref(startNode)
          .set(
            (_, value) => {
              const currentContent = []
              
              let contentNode = startNode
              while ((contentNode = contentNode.nextSibling) != endNode) {
                if (contentNode == null) {
                  console.error('Conditional end point is missing!')
                  return
                }
                currentContent.push(contentNode)
              }

              for (let i = 0 ; i < currentContent.length ; ++i) {
                currentContent[i].remove()
              }

              let elements
              const parentElement = startNode.parentNode
              if (parentElement instanceof SVGElement) {
                renderTemplate.innerHTML = `<svg>${renderFunc(value)}</svg>`
                elements = Array.from(renderTemplate.content.children[0].children)
              } else {
                renderTemplate.innerHTML = renderFunc(value)
                elements = Array.from(renderTemplate.content.children)
              }

              for (let i = 0 ; i < elements.length ; ++i) {
                parentElement.insertBefore(elements[i], endNode)
              }
            }, 
            valueFunc
          )
          .done()
      })
      return api
    },

    if: (valueFunc, renderFunc) => {
      api.conditional(valueFunc, (value) => value ? renderFunc() : '')
      return api
    },

    // TODO: Support for multiple render roots by using text nodes as markers
    repeat: (valueFunc, renderFunc, keyFunc = (item, index) => item, compareFunc) => {
      callbacks.push((insert) => {
        const startNode = insert(document.createTextNode(''))
        const endNode = insert(document.createTextNode(''))

        ref(startNode)
          .set(
            (_, items) => {
              const currentContent = []
              
              let contentNode = startNode
              while ((contentNode = contentNode.nextSibling) != endNode) {
                if (contentNode == null) {
                  console.error('Repeat end point is missing!')
                  return
                }
                currentContent.push(contentNode)
              }
              
              const parentElement = startNode.parentNode
              for (let index = 0 ; index < items.length ; ++index) {
                const item = items[index]
                const key = keyFunc(item, index)
                const currentElementIndex = currentContent.findIndex(x => x._key === key)
                let element
            
                if (currentElementIndex < 0) {
                  if (parentElement instanceof SVGElement) {
                    renderTemplate.innerHTML = `<svg>${renderFunc(item, index)}</svg>`
                    element = renderTemplate.content.children[0].children[0]
                    validateRepeatRenderingSingleRoot(renderTemplate.content.children[0].children)
                  } else {
                    renderTemplate.innerHTML = renderFunc(item, index)
                    element = renderTemplate.content.children[0]
                    validateRepeatRenderingSingleRoot(renderTemplate.content.children)
                  }
                  element._key = key
                } else {
                  element = currentContent.splice(currentElementIndex, 1)[0]
                }
                parentElement.insertBefore(element, endNode)
              }
            
              for (let i = 0 ; i < currentContent.length ; ++i) {
                currentContent[i].remove()
              }
            },
            valueFunc,
            compareFunc
          )
          .done()
      })
      return api
    },

    toString: () => {
      const templateId = `_template_${++templateIdGenerator}_`

      queueMicrotask(() => {
        const commentIterator = document.createNodeIterator(document.body, NodeFilter.SHOW_COMMENT);

        let insertionPoint
        let currentComment
        while (currentComment = commentIterator.nextNode()) {
          if (currentComment.textContent === templateId)  {
            insertionPoint = currentComment
            break
          }
        }

        if (!insertionPoint) {
          console.error('Insertion point could not be found during templating!')
          return
        }

        const insert = (node) => insertionPoint.parentNode.insertBefore(node, insertionPoint)
        for (let i = 0 ; i < callbacks.length ; ++i) {
          callbacks[i](insert)
        }

        insertionPoint.remove()
      })
    
      return `<!--${templateId}-->`
    }
  }

  return api
}

export const text = (...args) => template().text(...args)
export const iffy = (...args) => template().if(...args)
export const repeat = (...args) => template().repeat(...args)

// Helpers
export const compareArrays = (a, b) => a === b || (a?.length === b?.length && a.every((element, index) => element === b[index]))
