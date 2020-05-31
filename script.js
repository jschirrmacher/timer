const config = {
    radius: +getSetting('radius'),
    tickWidth: +getSetting('tick-width'),
    tickLength: +getSetting('tick-length'),
    fivesLength: +getSetting('fives-length'),
    redSpacing: +getSetting('red-spacing'),
    handWidth: +getSetting('hand-width')
}
config.ticks = config.radius * 2 * Math.PI
let inSet = false
let playSound = 0
let alarmTime
let alarmTimer

const currentTime = document.getElementById('currentTime')
const sound = document.getElementById('sound')
const svg = document.getElementById('timer')

const showSettings = document.getElementById('show-settings')
const settings = document.getElementById('settings')

const background = createCircle('background', config.radius*2.3, '1')
svg.appendChild(background)

svg.appendChild(createTicks('fives', 12, config.fivesLength))
svg.appendChild(createTicks('ones', 60, config.tickLength))

let startValue = 0
let value = 0
//some svg elements
const timer2 = createCircle('green', config.radius, '')
svg.appendChild(timer2)
const timer = createCircle('red', config.radius, '')
svg.appendChild(timer)
const minute = createHand('minute', 350)
svg.appendChild(minute)
const hour = createHand('hour', 220)
svg.appendChild(hour)

bindHandler(svg, 'mousedown touchstart', handleStart)
bindHandler(svg, 'mouseup touchend', handleEnd)
bindHandler(svg, 'mousemove touchmove', handleMove)
bindHandler(window, 'load', delayInitTimer)
bindHandler(showSettings, 'click', () => settings.classList.add('open'))
bindHandler('.popup .close', 'click', event => event.target.closest('.popup').classList.remove('open'))
bindHandler(sound, 'ended', () => {
    if (--playSound) {
        sound.play()
    }
})

function bindHandler(selector, events, listener) {
    const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : [selector]
    events.split(' ').forEach(event => {
        elements.forEach(el => el.addEventListener(event, listener))
    })
}

function setupSetting(el, name, value) {
    if (el.type === 'checkbox') {
        el.checked = !!+value
        document.body.classList.toggle(name, !!+value)
    } else {
        el.value = +value
    }
}

const allSettings = [
    'hide-text',
    'radius',
    'tick-width',
    'tick-length',
    'fives-length',
    'red-spacing',
    'hand-width'
]
allSettings.forEach(setting => {
    const el = document.getElementById(setting)
    if (el) {
        setupSetting(el, setting, getSetting(setting))
        bindHandler(el, 'change', event => {
            const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
            setupSetting(el, setting, value)
        })
    }
})

//dirty hack to wait for external systems like OBS to apply custom css
function delayInitTimer(event) {
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

function initTimer(event) {
    const value = 'ontouchstart' in window ? 0 : minMax(getSetting('duration') * 60, 0, 3600)

    //init the green section
    const now = new Date()
    const valueDeg = value/3600*360
    const startMinutePos = -(now.getMinutes() * 60 + now.getSeconds()) / 10
    timer2.setAttribute('style', 'transform: translate(50%, 50%) rotate(' + (startMinutePos -valueDeg) + 'deg) translate(-50%, -50%); '+'stroke-width: ' + (config.radius) * 2 + '; stroke-dasharray: ' + (value / 3600 * config.ticks) + ',2000')

    setupAlarm(value)
    updateTimer()
    window.setInterval(updateTimer, 1000)
}

function handleStart(event) {
    inSet = true
    sound.play()
    sound.pause()
}

function handleMove(event) {
    if (inSet) {
        event.preventDefault()
        const pos = event.type === 'touchmove' ? event.changedTouches[0] : event
        const r = svg.getBoundingClientRect()
        const deltaX = pos.clientX - r.x - r.width / 2
        const deltaY = pos.clientY - r.y - r.height / 2
        const now = new Date()
        const minutePos = (now.getMinutes() * 60 + now.getSeconds()) / 10
        const valueDeg = -(minutePos - 90 + Math.atan2(-deltaY, deltaX) * (180 / Math.PI))
        value = ((valueDeg % 360) + 360) % 360 * 10
        setupAlarm(value)
        updateTimer()
    }
}

function handleEnd() {
    inSet = false
    setupAlarm(value)
    const now = new Date()
    const valueDeg = value/3600*360
    const startMinutePos = -(now.getMinutes() * 60 + now.getSeconds()) / 10
    timer2.setAttribute('style', 'transform: translate(50%, 50%) rotate(' + (startMinutePos -valueDeg) + 'deg) translate(-50%, -50%); '+'stroke-width: ' + (config.radius) * 2 + '; stroke-dasharray: ' + (value / 3600 * config.ticks) + ',2000')
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

function updateTimer() {
    value = (alarmTime - new Date()) / 1000
    const now = new Date()
    const hourPos = -(now.getHours() * 60 + now.getMinutes()) / 2
    const minutePos = -(now.getMinutes() * 60 + now.getSeconds()) / 10
    const valueDeg = value/3600*360
    minute.setAttribute('style', 'transform: translate(50%,50%) rotate(' + minutePos + 'deg)')
    if (value >= 0) {
        timer.setAttribute('style', 'transform: translate(50%, 50%) rotate(' + (minutePos -valueDeg) + 'deg) translate(-50%, -50%); '+'stroke-width: ' + (config.radius) * 2 + '; stroke-dasharray: ' + (value / 3600 * config.ticks) + ',2000')
    } else {
        timer.removeAttribute('style')
    }
    hour.setAttribute('style', 'transform: translate(50%,50%) rotate(' + hourPos + 'deg)')
    currentTime.innerText = (new Date()).toLocaleTimeString()
}

function createTicks(id, count, length) {
    const radius = config.radius * 2 + config.redSpacing - length / 2
    const strokeArray = config.tickWidth + ',' + (radius * 2 * Math.PI / count - config.tickWidth)
    return createCircle(id, radius, length, strokeArray)
}

function createCircle(id, radius, strokeWidth, dashArray) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.id = id
    circle.setAttribute('cx', 500)
    circle.setAttribute('cy', 500)
    circle.setAttribute('r', radius)
    circle.setAttribute('style', 'stroke-width: ' + strokeWidth + '; stroke-dasharray: ' + dashArray)
    return circle
}

function createHand(id, width) {
    const hand = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    hand.id = id
    hand.setAttribute('class', 'hand')
    hand.setAttribute('x', -config.handWidth * 2)
    hand.setAttribute('y', -config.handWidth / 2)
    hand.setAttribute('width', width)
    hand.setAttribute('height', config.handWidth)
    return hand
}
