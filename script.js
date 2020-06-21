let inSet = false
let playSound = 0
let alarmTime
let alarmTimer
const config = {}

const currentTime = document.getElementById('currentTime')
const sound = document.getElementById('sound')
const svg = document.getElementById('timer')

const showSettings = document.getElementById('show-settings')
const settings = document.getElementById('settings')

let startValue = 0
let remainingSecs = 0

addElement(svg, 'circle', 'background')
addElement(svg, 'circle', 'fives', 'tick')
addElement(svg, 'circle', 'ones', 'tick')
const timer2 = addElement(svg, 'circle', 'green', 'area')
const timer = addElement(svg, 'circle', 'red', 'area')
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

bindHandler(document.getElementById('saveSettings'), 'click', saveSettings)
bindHandler(svg, 'mousedown touchstart', handleStart)
bindHandler(svg, 'mouseup touchend', handleEnd)
bindHandler(svg, 'mousemove touchmove', handleMove)
bindHandler(window, 'load', delayInitTimer)
bindHandler(showSettings, 'click', () => settings.classList.add('open'))
bindHandler('.popup .close', 'click', event => closeCorrespondingDialog(event.target))
bindHandler(sound, 'ended', () => --playSound && sound.play())
const hasTouch = 'ontouchstart' in window
document.documentElement.classList.toggle('hasTouch', hasTouch)

function bindHandler(selector, events, listener) {
    const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : [selector]
    events.split(' ').forEach(event => {
        elements.forEach(el => el.addEventListener(event, listener))
    })
}

function setupSetting(el, name, value) {
    if (el.type === 'checkbox') {
        el.checked = !!+value
        config[name] = el.checked
    } else {
        el.value = +value
        config[name] = +value
    }
    document.documentElement.style.setProperty('--' + name, value + (el.dataset.unit || ''))
}

const allSettings = document.querySelectorAll('#settings form input')
allSettings.forEach(el => {
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

function getAreaTransform(seconds, minutePos) {
    const rotate = minutePos - seconds / 10
    const strokeLength = Math.PI * seconds / 1800

    return 'transform: rotate(calc(var(--relative) * ' + rotate + 'deg)); ' +
                      'stroke-dasharray: calc((var(--radius) + var(--spacing)) / 2 * ' + strokeLength + '),2000'
}

function initTimer(event) {
    const value = hasTouch ? 0 : minMax(getSetting('duration') * 60, 0, 3600)

    //init the green section
    const now = new Date()
    const startMinutePos = -(now.getMinutes() * 60 + now.getSeconds()) / 10
    timer2.setAttribute('style', getAreaTransform(value, startMinutePos))

    setupAlarm(value)
    updateTimer()
    window.setInterval(updateTimer, 1000)
}

function updateTimer() {
    const now = new Date()
    const hourPos = -(now.getHours() * 60 + now.getMinutes()) / 2
    const minutePos = -(now.getMinutes() * 60 + now.getSeconds()) / 10
    minute.setAttribute('style', 'transform: rotate(' + minutePos + 'deg)')
    hour.setAttribute('style', 'transform: rotate(' + hourPos + 'deg)')

    remainingSecs = (alarmTime - now) / 1000
    if (remainingSecs >= 0) {
        timer.setAttribute('style', getAreaTransform(remainingSecs, minutePos))
    } else {
        timer.setAttribute('style', 'display: none')
        timer2.setAttribute('style', 'display: none')
    }
    currentTime.innerText = (new Date()).toLocaleTimeString()
}

function handleStart() {
    inSet = true
    sound.play()
    sound.pause()
    timer2.setAttribute('style', 'display: none')
}

function handleMove(event) {
    if (inSet) {
        event.preventDefault()
        const pos = event.type === 'touchmove' ? event.changedTouches[0] : event
        const r = svg.getBoundingClientRect()
        const deltaX = pos.clientX - r.x - r.width / 2
        const deltaY = pos.clientY - r.y - r.height / 2
        if (config.relative) {
            const now = new Date()
            const minutePos = (now.getMinutes() * 60 + now.getSeconds()) / 10
            const valueDeg = -(minutePos - 90 + Math.atan2(-deltaY, deltaX) * (180 / Math.PI))
            remainingSecs = ((valueDeg % 360) + 360) % 360 * 10
        } else {
            remainingSecs = ((270 + Math.atan2(-deltaY, deltaX) * (180 / Math.PI)) % 360) * 10
        }
        setupAlarm(remainingSecs)
        updateTimer()
    }
}

function handleEnd() {
    inSet = false
    setupAlarm(remainingSecs)
    const now = new Date()
    const startMinutePos = -(now.getMinutes() * 60 + now.getSeconds()) / 10
    timer2.setAttribute('style', getAreaTransform(remainingSecs, startMinutePos))
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
}

function alarm() {
    alarmTimer = 0
    playSound = 3
    sound.play()
}
