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

export const ref = (explicitNode) => {
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
      if (!explicitNode) {
        console.error('Called .done() without explict node reference!')
        return
      }

      for (let i = 0 ; i < callbacks.length ; ++i) {
        callbacks[i](explicitNode)
      }
    },

    toString: () => {
      if (explicitNode) {
        console.error('Used deferred referencing with explicit node reference!')
        return ''
      }

      const refAttribute = `_ref_${++refIdGenerator}_`

      queueMicrotask(() => {
        const implicitNode = document.querySelector(`[${refAttribute}]`)
        if (!implicitNode) {
          console.error('Implicit node could not be found during referencing!')
          return
        }
        implicitNode.removeAttribute(refAttribute)

        for (let i = 0 ; i < callbacks.length ; ++i) {
          callbacks[i](implicitNode)
        }
      })
    
      return refAttribute
    }
  }

  return api
}

const renderTemplate = document.createElement('template')
const validateRepeatRenderingSingleRoot = (children) => children.length > 1 && console.error('Repeat does not support multiple roots in render function, remaining roots omitted!')

export const template = (explicitInsertionPoint) => {
  const callbacks = []
  const api = {
    modify: (callback) => {
      callbacks.push(callback)
      return api
    },

    text: (valueFunc) => {
      api.modify((insert) => {
        ref(insert(document.createTextNode('')))
          .set((node, value) => node.textContent = value, valueFunc)
          .done()
      })
      return api
    },

    // TODO: Remove in favor of repeat as basis instead?
    conditional: (valueFunc, renderFunc) => {
      api.modify((insert) => {
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

    // TODO: Support for multiple render roots by using text nodes as markers
    repeat: (valueFunc, renderFunc, keyFunc = (item, index) => item, compareFunc) => {
      api.modify((insert) => {
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

    if: (valueFunc, renderFunc) => {
      // TODO: Use repeat instead?
      api.conditional(valueFunc, (value) => value ? renderFunc() : '')
      return api
    },

    switch: (valueFunc, renderFuncs) => {
      api.conditional(valueFunc, (value) => renderFuncs[value]?.() || '')
      return api
    },

    done: () => {
      if (!explicitInsertionPoint) {
        console.error('Called .done() without explict insertion point!')
        return
      }

      const insert = (node) => explicitInsertionPoint.parentNode.insertBefore(node, explicitInsertionPoint)
      for (let i = 0 ; i < callbacks.length ; ++i) {
        callbacks[i](insert)
      }
    },

    toString: () => {
      if (explicitInsertionPoint) {
        console.error('Used deferred templating with explicit insertion point!')
        return ''
      }

      const templateId = `_template_${++templateIdGenerator}_`

      queueMicrotask(() => {
        const commentIterator = document.createNodeIterator(document.body, NodeFilter.SHOW_COMMENT);

        let implicitInsertionPoint
        let currentComment
        while (currentComment = commentIterator.nextNode()) {
          if (currentComment.textContent === templateId)  {
            implicitInsertionPoint = currentComment
            break
          }
        }

        if (!implicitInsertionPoint) {
          console.error('Implicit insertion point could not be found during templating!')
          return
        }

        const insert = (node) => implicitInsertionPoint.parentNode.insertBefore(node, implicitInsertionPoint)
        for (let i = 0 ; i < callbacks.length ; ++i) {
          callbacks[i](insert)
        }

        implicitInsertionPoint.remove()
      })
    
      return `<!--${templateId}-->`
    }
  }

  return api
}

export const text = (...args) => template().text(...args)
export const iffy = (...args) => template().if(...args)
export const repeat = (...args) => template().repeat(...args)
export const switchy = (...args) => template().switch(...args)
export const conditional = (...args) => template().conditional(...args)

// Helpers
export const compareArrays = (a, b) => a === b || (a?.length === b?.length && a.every((element, index) => element === b[index]))
