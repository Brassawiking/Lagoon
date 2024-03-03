let refIdGenerator = 0
export const ref = (callback) => {
  const refAttribute = `_ref_${refIdGenerator++}_`

  queueMicrotask(() => {
    const el = document.querySelector(`[${refAttribute}]`)
    if (!el) {
      console.error('Element could not be found during referencing!')
      return
    }

    el.removeAttribute(refAttribute)
    callback(el)
  })

  return refAttribute
}

let liveQueue = []
requestAnimationFrame(function processLiveQueue() {
  const currentQueue = liveQueue
  liveQueue = []
  for (let i = 0 ; i < currentQueue.length; ++i) {
    currentQueue[i]()
  }
  requestAnimationFrame(processLiveQueue)
})

let liveWatchers = 0
export const debugLiveWatchers = () => liveWatchers
export const live = (callback) => {
  ++liveWatchers
  return ref(el => {
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
}

export const set = (setter, valueFunc, compareFunc = (a, b) => a === b) => {
  let oldValue
  return live((el) => {
    const newValue = valueFunc()
    if (!compareFunc(newValue, oldValue)) {
      setter(el, newValue, oldValue)
      oldValue = newValue
    }
  })
}

const repeatTemplate = document.createElement('template')
const validateRepeatSingleRoot = (children) => children.length > 1 && console.error('Repeat does not support multiple roots in render function, remaining roots omitted!')
export const repeat = (valueFunc, renderFunc, keyFunc = (item, index) => item, compareFunc) => set((el, items) => {
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

// TODO: Make "on" set based instead so you can change or remove the event listener dynamically
export const on = (type, callback, options = {}) => ref((el) => el.addEventListener(type, (event) => callback(event, el), options))
export const style = (property, valueFunc) => set((el, value) => el.style[property] = value, valueFunc)
export const property = (property, valueFunc) => set((el, value) => el[property] = value, valueFunc)
export const attribute = (attribute, valueFunc) => set((el, value) => el.setAttribute(attribute, value), valueFunc)
export const cssClass = (className, valueFunc) => set((el, value) => el.classList.toggle(className, value), valueFunc) 

// Helpers
export const compareArrays = (a, b) => a?.length === b?.length && a.every((element, index) => element === b[index])