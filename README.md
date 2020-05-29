# Simple Timer

All you agile practitioners, you know these nice devices which can be placed on the desk and show the remaining time in the current time box.

Regrettably, whenever you need it, you left it home. And if only, because it is too large to transport in your case.

Now you can use this small application to use it without needing to carry more than you already have - your computer.

[![Timer](timer.png)](https://jschirrmacher.github.io/timer/?value=1200)
Click on image to try the timer yourself

## Features

- Rings a bell when time is up
- Runs without internet connection (you need to be connected, when opening it, though)
- Works with both, mouse or touch screen
- Works in all sizes (change your window size, if you like)
- Shows current time with hands and digital (the latter only if window is at least a minimum size)
- Works in the background (you don't need to keep the window in front)
- No installation needed, runs [just here](https://jschirrmacher.github.io/timer)
- No fees, no signup, no tracking
- optimized for OBS

## How to use with [OBS](https://obsproject.com/)

With OBS, you can use this timer in your next live stream or video conference. To do so, add the timer as `Browser` Element.
The standard user defined CSS added by OBS will already render the background transparent.
To remove the text elements from the timer, style this elements with `display: none`:

```
body { 
    background-color: rgba(0, 0, 0, 0); 
    margin: 0px auto; 
    overflow: hidden; 
}
#info, #goGitHub, #currentTime {
    display: none;
}
```

Feel free to change additional styles to fit your design.

When use use the timer installed on a web server, you can just use the URL and append the parameter `duration` with the duration in minutes.
For example, `timer.html?duration=13` would give you a 13 minutes timer.

Since there is no good way to interact with the timer while embedded in an OBS scene, it makes sense to create an extra scene for the timer and mark the checkbox `Refresh browser when scene becomes active`.
This will let you start the timer by switching the scene.

To speed up the refresh of your timer, it makes sense to reference it as local file from OBS.
In that case you use the ability to specify the duration via a URL parameter, but we have a solution for that.

You can specify the duration as custom CSS style!
Add 

```
duration {
    --timer-duration: 25;
}
```
to your custom CSS and it will obey your wish.

Here is a full custom CSS for you to copy:

```
body { 
    background-color: rgba(0, 0, 0, 0); 
    margin: 0px auto; 
    overflow: hidden; 
}
#info, #goGitHub, #currentTime {
    display: none;
}
duration {
    --timer-duration: 5;
}
```