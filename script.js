const match = location.search.match(/value=(\d+)/) || [0, 15 * 60]
let value = 'ontouchstart' in window ? 0 : Math.min(3600, Math.max(0, match[1]))

const config = {
    radius: 180,
    tickWidth: 10,
    tickLength: 30,
    fivesLength: 60,
    redSpacing: 20,
    handWidth: 10
}
config.ticks = config.radius * 2 * Math.PI
let inSet = false
let playSound = 0
let alarmTime
let alarmTimer

const currentTime = document.getElementById('currentTime')
const sound = document.getElementById('sound')
const svg = document.getElementById('timer')
svg.appendChild(createTicks('fives', 12, config.fivesLength))
svg.appendChild(createTicks('ones', 60, config.tickLength))
const timer = createCircle('red', config.radius, '')
svg.appendChild(timer)
const minute = createHand('minute', 350)
svg.appendChild(minute)
const hour = createHand('hour', 220)
svg.appendChild(hour)

setupAlarm(value)
updateTimer()
window.setInterval(updateTimer, 1000)
bindHandler(svg, 'mousedown touchstart', handleStart)
bindHandler(svg, 'mouseup touchend', handleEnd)
bindHandler(svg, 'mousemove touchmove', handleMove)
sound.addEventListener('ended', () => {
    if (--playSound) {
        sound.play()
    }
})

function bindHandler(el, events, listener) {
    events.split(' ').forEach(event => el.addEventListener(event, listener))
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
        value = ((270 - Math.atan2(deltaY, deltaX) * (180 / Math.PI)) % 360) * 10
        setupAlarm(value)
        updateTimer()
    }
}

function handleEnd() {
    inSet = false
    setupAlarm(value)
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
    const radius = config.radius * 2 + config.redSpacing + length / 2
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