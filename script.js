let inSet = false
let alarmTime
let alarmTimer
const config = {}

const currentTime = document.getElementById('currentTime')
const svg = document.getElementById('timer')

const showSettings = document.getElementById('show-settings')
const settings = document.getElementById('settings')

let remaining = 0
let startMinutePos
let minutePos

addElement(svg, 'circle', 'background')
addElement(svg, 'circle', 'fives', 'tick')
addElement(svg, 'circle', 'ones', 'tick')
const greenArea = addElement(svg, 'circle', 'green', 'area')
const redArea = addElement(svg, 'circle', 'red', 'area')
const minute = addElement(svg, 'rect', 'minute', 'hand')
const hour = addElement(svg, 'rect', 'hour', 'hand')

function addElement(svg, type, id, classes) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', type)
    el.id = id || undefined
    classes && el.setAttribute('class', classes)
    svg.appendChild(el)
    return el
}

function saveSettings(event) {
    event.preventDefault()
    closeCorrespondingDialog(event.target)
    return false
}

function closeCorrespondingDialog(target) {
    target.closest('.popup').classList.remove('open')
}

bindHandler(document.getElementById('saveSettings'), 'click', saveSettings, false)
bindHandler(svg, 'mousedown touchstart', handleStart)
bindHandler(svg, 'mouseup touchend', handleEnd)
bindHandler(svg, 'mousemove touchmove', handleMove)
bindHandler(window, 'load', delayInitTimer)
bindHandler(showSettings, 'click', () => settings.classList.add('open'))
bindHandler('.popup .close', 'click', event => closeCorrespondingDialog(event.target))
const hasTouch = 'ontouchstart' in window
document.documentElement.classList.toggle('hasTouch', hasTouch)

function bindHandler(selector, events, listener, passive = true) {
    const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : [selector]
    events.split(' ').forEach(event => {
        elements.forEach(el => el.addEventListener(event, listener, {passive}))
    })
}

function setupSetting(el, name, value) {
    if (el.type === 'checkbox') {
        el.checked = !!+value
        config[name] = el.checked
    } else if (el.type == 'select-one') {
        const options = Array.from(el.options)
        const index = options.findIndex(o => o.value === value)
        el.selectedIndex = Math.max(0, index)
        config[name] = options[el.selectedIndex].value
    } else {
        el.value = +value
        config[name] = +value
    }
    document.documentElement.style.setProperty('--' + name, value + (el.dataset.unit || ''))
}

const allSettings = Array.from(document.querySelector('#settings form').elements)
    .filter(el => el.id)
    .forEach(el => {
        setupSetting(el, el.id, getSetting(el.id))
        bindHandler(el, 'change', event => {
            const value = event.target.type === 'checkbox' ? +event.target.checked : event.target.value
            setupSetting(el, el.id, value)
        })
    })

//dirty hack to wait for external systems like OBS to apply custom css
function delayInitTimer() {
    window.setTimeout(initTimer, 5)
}

function getSetting(name) {
    const el = document.querySelector('.settings')
    const cssValue = getComputedStyle(el).getPropertyValue('--' + name)
    const match = location.search.match(new RegExp(name + '=(\\w+)')) || [undefined, cssValue]
    return match[1]
}

function minMax(value, min, max) {
    return Math.min(max, Math.max(min, value))
}

function initTimer() {
    const value = hasTouch ? 0 : minMax(getSetting('duration') * 60, 0, 3600)
    const now = new Date()
    startMinutePos = -(now.getMinutes() * 60 + now.getSeconds()) / 10 
    setupAlarm(value)
    window.setInterval(updateTimer, 1000)
}

function getStroke(areaDegree) {
    const strokeLength = areaDegree * Math.PI / 360
    return 'stroke-dasharray: calc((var(--radius) + var(--spacing)) * ' + strokeLength + '),2000'
}

function getRotate(relFactor, nonRelFactor) {
    return 'transform: rotate(calc(var(--relative) * ' + relFactor + 'deg + ' +
                                  '(1 - var(--relative)) * ' + nonRelFactor + 'deg))'
}

function updateTimer() {
    const now = new Date()
    const hourPos = -(now.getHours() * 60 + now.getMinutes()) / 2
    minutePos = -(now.getMinutes() * 60 + now.getSeconds()) / 10
    minute.setAttribute('style', 'transform: rotate(' + minutePos + 'deg)')
    hour.setAttribute('style', 'transform: rotate(' + hourPos + 'deg)')

    remaining = (alarmTime - now) / 10000
    if (remaining >= 0) {
        redArea.setAttribute('style', getRotate(minutePos - remaining, 0) + '; ' + getStroke(remaining))
        greenArea.setAttribute('style', getRotate(minutePos, remaining) + '; ' + getStroke(startMinutePos - minutePos))
    } else {
        redArea.setAttribute('style', 'display: none')
        greenArea.setAttribute('style', 'display: none')
    }
    currentTime.innerText = (new Date()).toLocaleTimeString()
}

function handleStart() {
    inSet = true
    redArea.setAttribute('style', 'display: none')
    greenArea.setAttribute('style', 'display: none')
}

function handleMove(event) {
    if (inSet) {
        const pos = event.type === 'touchmove' ? event.changedTouches[0] : event
        const r = svg.getBoundingClientRect()
        const deltaX = pos.clientX - r.x - r.width / 2
        const deltaY = pos.clientY - r.y - r.height / 2
        if (config.relative) {
            const now = new Date()
            const minutePos = (now.getMinutes() * 60 + now.getSeconds()) / 10
            const valueDeg = -(minutePos - 90 + Math.atan2(-deltaY, deltaX) * (180 / Math.PI))
            remaining = ((valueDeg % 360) + 360) % 360 * 10
        } else {
            remaining = ((270 + Math.atan2(-deltaY, deltaX) * (180 / Math.PI)) % 360) * 10
        }
        setupAlarm(remaining)
    }
}

function handleEnd() {
    inSet = false
    const now = new Date()
    startMinutePos = -(now.getMinutes() * 60 + now.getSeconds()) / 10
}

function setupAlarm(seconds) {
    if (alarmTimer) {
        clearTimeout(alarmTimer)
        alarmTimer = 0
    }
    if (seconds > 0) {
        alarmTime = new Date((new Date()).getTime() + seconds * 1000)
        alarmTimer = setTimeout(alarm, seconds * 1000)
    }
    updateTimer()
}

function alarm() {
    alarmTimer = 0
    let playSound = 3
    const sound = new Audio(config.ringtone)
    bindHandler(sound, 'ended', () => --playSound && sound.play())
    sound.play()
}
