Backbone.EventRouter
====================

[![Travis Status](http://img.shields.io/travis/RoundingWellOS/backbone.eventrouter/master.svg?style=flat&amp;label=travis)](https://travis-ci.org/RoundingWellOS/backbone.eventrouter) [![Code Climate Score](http://img.shields.io/codeclimate/github/RoundingWellOS/backbone.eventrouter.svg?style=flat)](https://codeclimate.com/github/RoundingWellOS/backbone.eventrouter) [![Coverage](http://img.shields.io/codeclimate/coverage/github/RoundingWellOS/backbone.eventrouter.svg?style=flat)](https://codeclimate.com/github/RoundingWellOS/backbone.eventrouter) [![Dependency Status](http://img.shields.io/david/RoundingWellOS/backbone.eventrouter.svg?style=flat)](https://david-dm.org/RoundingWellOS/backbone.eventrouter)


## About Backbone.EventRouter

Backbone.EventRouter extends the [Backbone.Router](http://backbonejs.org/#Router).  It is coupled with a [Backbone.Radio](https://github.com/marionettejs/backbone.radio) Channel such that when an event is triggered on the channel, it will set the route URL, or when a URL matches a route it will throw an event on the channel.

This router was built from scripts open sourced from [RoundingWell.com](http://www.roundingwell.com).

## Why yet another Backbone router?
Early on we attempted to adopt [event based routing](https://lostechies.com/derickbailey/2011/08/28/dont-execute-a-backbone-js-route-handler-from-your-code/) but found that the patterns led to a lot of repetition.  Not only did you need to define your routes in the router, you also had to do it in corresponding events.  This router helps prevent the repetition and makes the concept maintainable. This extension allows you to use Backbone's router how it was intended (`{trigger: false}`), as well as allowing you to change the state of your app fully through events, using the router to merely kick-off the initial state.

##### But Ember does it differently...
Quite a good argument against Backbone's router is that it isn't Ember's router, and you'll find many Backbone.Router extensions modeling functionality from that router.  While that is a very valid use case, we find Ember's router to be very heavy.  That router often has the concern of handling the routes, fetching the data and kicking off an app (aka: sub-app, module, component, widget, etc).

##### Backbone.EventRouter is simplistic
This router is much simpler in that it listens for routes and triggers events, and listens for events and replace the URL with the applicable route.  That's essentially it.  You're on your own as far as how to handle those events.  But we'd recommend something like [marionette.toolkit.routerapp](https://github.com/RoundingWellOS/marionette.toolkit.routerapp).


## Documentation Index
* [EventRouter's `channelName`](#eventrouters-channelname)
* [EventRouter's `routeTriggers`](#eventrouters-routetriggers)
* [EventRouter Events](#eventrouter-events)
  * ["before:route" event](#beforeroute-event)
  * ["before:route:[name]" event](#beforeroutename-event)
  * ["noMatch" event](#nomatch-event)
* [EventRouter API](#eventrouter-api)
  * [`getChannel`](#getchannel)
  * [`addRouteTrigger`](#addroutetrigger)
  * [`getDefaultRoute`](#getdefaultroute)
  * [`navigateFromEvent`](#navigatefromevent)
  * [`translateRoute`](#translateroute)

## EventRouter's `channelName`
*Default Value:* `'event-router'`

Specify a `channelName` in your router class definition. This should be a
string or a function returning a string that indicates the Backbone.Radio
[Channel](https://github.com/marionettejs/backbone.radio#channels) name
that EventRouter will use.

```js
Backbone.EventRouter.extend({
  channelName: 'my-event-channel'
});
```

Alternatively, you can specify a `channelName` in the options for
the `constructor`:

```js
var MyEventRouter = Backbone.EventRouter.extend({...});

new MyEventRouter({
  channelName: 'my-event-channel'
});
```

## EventRouter's `routeTriggers`
`routeTriggers` can be a hash or function on the definition
or passed as an option when instantiating an EventRouter.

This hash is used to add multiple trigger routes at instantiation.
Essentially [`addRouteTrigger`](#addroutetrigger) is called for each route trigger.
More information about route triggers can be found [here](#addroutetrigger).

```js
new MyEventRouter({
  routeTriggers: {
    'some:event': 'some/url',
    'thing:list': 'other/:param',
    'thing:item': ['some/thing/:id', 'some/thing']
  }
});

```

## EventRouter Events
These are events triggered on the EventRouter itself.  They are not triggered on the Radio channel.  The Radio channel should be used strictly for routing events.

### "before:route" event
The "before:route" event is functionally equivalent to Backbone's "route" [event](http://backbonejs.org/#Events-catalog) but triggered immediately before the route handler instead of after.  [See Backbone.Router.route](http://backbonejs.org/#Router-route) for more information.
### "before:route:[name]" event
The "before:route:[name]" event is functionally equivalent to Backbone's "route:[name]" [event](http://backbonejs.org/#Events-catalog) but triggered immediately before the route handler instead of after.  [See Backbone.Router.route](http://backbonejs.org/#Router-route) for more information.
### "noMatch" event
If any event triggered on the Radio Channel is not handled by this EventRouter, this event will be triggered and receive the event string and any data sent to the event.

```js
var myEventRouter = new MyEventRouter({
  routeTriggers: {
    'some:event': 'some/url',
    'thing:list': 'other/:param'
  }
});

myEventRouter.on('noMatch', function(event, data){
  console.log('The event ' + event + ' with data ' + data + ' was not handled by this router!');
});

var routeChannel = myEventRouter.getChannel();

// "The event event:not:handled with data foo was not handled by this router!" will be logged
routeChannel.trigger('event:not:handled', 'foo');
```


## EventRouter API
### `getChannel`
Gets the EventRouter's Backbone.Radio Channel instance.

```js
var router = new Backbone.EventRouter({
  channelName: 'my-event-channel'
});

var routerChannel = router.getChannel();

routerChannel.on('foo', function(){
  console.log('Same channel!');
});

// Triggering here will log: "Same channel!"
Backbone.Radio.trigger('my-event-channel', 'foo');
```


### `addRouteTrigger`
Adds a routerTrigger, and route(s) to Backbone.Router
which, on route, triggers the appropriate event.

Conversely when the event is triggered, the URL will update
to match the route paired with the event.

```js
myEventRouter.addRouteTrigger('some/url/:param', 'some:event');

var myRouterChannel = myEventRouter.getChannel();

myRouterChannel.on('some:event', function(param){
  console.log('Triggered: ' + param);
});

// Will console log "Triggered foo"
myEventRouter.navigate('some/url/foo', { trigger: true });

```

This function also takes an array of routes.  Any route in the array will
trigger the given event.  In this case the first route in the array is
considered the default route and will be matched if the event is triggered.

```js
myEventRouter.addRouteTrigger(['some/url/:param', 'some/url', 'other/:section/:id'], 'some:event');

var myRouterChannel = myEventRouter.getChannel();

// Will route URL to "some/url/bar"
myRouterChannel.trigger('some:event', 'bar');
```

*Note:* Splat routes and Optional params are not currently supported. ( ie: "some/url(/:param)" )
Similar handling of multiple routes can be done by setting an array of possible permutations.
You can additionally handle these routes as your normally would on a [Backbone.Router](http://backbonejs.org/#Router-routes).

### `getDefaultRoute`
Get the default route string.
It will be either the first of the array or the passed-in event if singular.

```js
var myEventRouter =new MyEventRouter({
  routeTriggers: {
    'some:event': ['some/url/:param', 'some/url', 'other/:section/:id'],
    'thing:list': 'other/:param'
  }
});

// will return 'some/url/:param'
myEventRouter.getDefaultRoute('some:event');

// will return 'other/:param'
myEventRouter.getDefaultRoute('thing:list');
```

### `navigateFromEvent`
Takes an event string and any arguments passed to that event and translates
the event into a URL and navigates to it without re-triggering the route.

```js
var myEventRouter =new MyEventRouter({
  routeTriggers: {
    'some:event': ['some/url/:param', 'some/url', 'other/:section/:id'],
    'thing:list': 'other/:param'
  }
});

// Will change the route to  "some/url/foo" but will not trigger the route or event
myEventRouter.navigateFromEvent('some:event', 'foo');
```

### `translateRoute`
Takes a route string and an array of arguments
and returns a url with the named params replaced with the argument values.

```js
// will return 'some/url/foo/22'
myEventRouter.translateRoute('some/url/:param/:id', ['foo', 22]);
```

## Getting Help

If you have questions or concerns please feel free to [open an issue](#github-issues).
Additionally join us on the [Marionette Gitter](https://gitter.im/marionettejs/backbone.marionette) to have a chat.
Everyone there is happy to discuss design patterns.


## Project Details

#### Library Downloads

You can download the latest builds directly from the [dist](https://github.com/RoundingWellOS/backbone.eventrouter/tree/master/dist) folder above.

#### Available Packages

**Via [npm](https://www.npmjs.com/package/backbone.eventrouter)**
```
$ npm install backbone.eventrouter
```

**Via [bower](http://bower.io/search/?q=backbone.eventrouter)**
```
$ bower install backbone.eventrouter
```


Currently Backbone.EventRouter is available via npm and bower. If you would like add it to another channel, please
[open an issue](#github-issues).

#### Changelog

For change logs and release notes, see the [changelog](CHANGELOG.md) file.

#### Compatibility and Requirements

Backbone.EventRouter currently requires [Backbone](http://backbonejs.com) `1.1.1+`.

Backbone.EventRouter supports IE8+ and modern browsers.


## How to Contribute

If you would like to contribute to Backbone.EventRouter's source code, please read
the [guidelines for pull requests and contributions](CONTRIBUTING.md).
Following these guidelines will help make your contributions easier to
bring into the next release.


### Github Issues

[Report issues](https://gitter.im/RoundingWellOS/backbone.eventrouter/issues) with Backbone.EventRouter, and [submit pull requests](https://github.com/RoundingWellOS/backbone.eventrouter/pulls) to fix problems or to
create summarized and documented feature requests (preferably with the feature implemented in the pull request).


===

This library is © 2015 RoundingWell. Distributed under MIT license.
