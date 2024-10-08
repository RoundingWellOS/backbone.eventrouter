/**
 * backbone.eventrouter - A highly opinionated, simplistic Backbone.Router coupled with a Backbone.Radio.Channel
 * @version v1.1.0
 * @link https://github.com/RoundingWellOS/backbone.eventrouter
 * @license MIT
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('underscore'), require('backbone'), require('backbone.radio')) :
  typeof define === 'function' && define.amd ? define(['underscore', 'backbone', 'backbone.radio'], factory) :
  (global.Backbone = global.Backbone || {}, global.Backbone.EventRouter = factory(global._,global.Backbone,global.Radio));
}(this, function (_,Backbone,backbone_radio) { 'use strict';

  _ = 'default' in _ ? _['default'] : _;
  Backbone = 'default' in Backbone ? Backbone['default'] : Backbone;

  // eslint-disable-line

  // https://github.com/jashkenas/backbone/blob/1.2.1/backbone.js#L1425
  var namedParamRegex = /(\(\?)?:\w+/;

  /**
   * Backbone.Router coupled with a Backbone.Radio Channel.
   *
   * @public
   * @class EventRouter
   * @memberOf Backbone
   */
  var EventRouter = Backbone.EventRouter = Backbone.Router.extend({

    /**
     * @public
     * @constructs EventRouter
     * @param {Object} [options] - Settings for the EventRouter
     * @param {Boolean} [options.channelName]
     * @param {Boolean} [options.routeTriggers]
     */
    constructor: function constructor(options) {
      _.extend(this, _.pick(options, ['channelName', 'routeTriggers']));

      this.cid = _.uniqueId('bber');

      this._ch = Backbone.Radio.channel(_.result(this, 'channelName'));

      this.listenTo(this._ch, 'all', this.navigateFromEvent);

      // Backbone.Router routes are added first
      // Routes can be added after the triggerRoutes with the Backbone.Router API
      Backbone.Router.apply(this, arguments);

      this._initRoutes();
    },


    /**
     * The Radio Channel name.
     *
     * @type {String}
     * @default 'event-router'
     */
    channelName: 'event-router',

    /**
     * Get the router's Radio channel instance
     *
     * @public
     * @method getChannel
     * @memberOf EventRouter
     * @returns {Backbone.Radio.Channel}
     */
    getChannel: function getChannel() {
      return this._ch;
    },


    /**
     * For each routeTrigger it adds a route to Backbone.Router
     *
     * @private
     * @method _initRoutes
     * @memberOf EventRouter
     */
    _initRoutes: function _initRoutes() {
      this._routeTriggers = _.result(this, 'routeTriggers', {});

      _.each(this._routeTriggers, this._addRouteTrigger, this);
    },


    /**
     * Adds a route(s) to Backbone.Router which on route triggers
     * the appropriate event
     *
     * @private
     * @method _addRouteTrigger
     * @param {Array|String} routes - Route string or array of route strings
     * @param {String} event - Event string to trigger on route
     * @memberOf EventRouter
     */
    _addRouteTrigger: function _addRouteTrigger(routes, event) {
      // handle any route as an array by default for the _.each
      routes = _.isArray(routes) ? routes : [routes];

      _.each(routes, function (route) {
        this.route(route, event, _.bind(this._ch.trigger, this._ch, event));
      }, this);
    },


    /**
     * Adds a routeTrigger, and route(s) to Backbone.Router
     * which on route triggers the appropriate event.
     *
     * @public
     * @method addRouteTrigger
     * @param {Array|String} routes - Route string or array of route strings
     * @param {String} event - Event string to trigger on route
     * @memberOf EventRouter
     * @returns {EventRouter}
     */
    addRouteTrigger: function addRouteTrigger(routes, event) {
      this._routeTriggers[event] = routes;
      this._addRouteTrigger(routes, event);

      return this;
    },


    /**
     * Overrides `Backbone.Router.route()
     * Like Backbone.Router.Route but with before events
     * It also temporarily stores the event for understanding
     * what route is currently being handled.
     *
     * @public
     * @method route
     * @param {String} route - Route string
     * @param {String} [name] - Name of route
     * @param {String} callback - Function called on route
     * @event EventRouter#before:route - passes route name and route arguments
     * @event EventRouter#before:route:{event_name} - passes route arguments
     * @memberOf EventRouter
     * @returns {EventRouter}
     */
    route: function route(_route, name, callback) {
      var bbRoute = Backbone.Router.prototype.route;

      if (_.isFunction(name) || !callback) {
        _route = bbRoute.call(this, _route, name, callback);
        Backbone.history.handlers[0].cid = this.cid;
        return _route;
      }

      var wrappedCallback = _.bind(function () {
        var args = _.drop(arguments, 0);

        // Trigger before: events that match currently triggered events
        this.trigger('before:route', name, args);
        this.trigger.apply(this, ['before:route:' + name].concat(args));

        this._storeRouteTrigger([name].concat(args));
        callback.apply(this, args);
        this._clearRouteTrigger();
      }, this);

      _route = bbRoute.call(this, _route, name, wrappedCallback);
      Backbone.history.handlers[0].cid = this.cid;
      return _route;
    },


    /**
     * Stores the route name and route arguments on a stack
     *
     * @private
     * @method _storeRouteTrigger
     * @param {Array} args - Array of route name and route arguments
     * @memberOf EventRouter
     */
    _storeRouteTrigger: function _storeRouteTrigger(args) {
      this._routeArgs = this._routeArgs || [];
      this._routeArgs.push(args);
    },


    /**
     * Gets the top of the triggered route store stack
     *
     * @private
     * @method _getCurrentRouteTrigger
     * @memberOf EventRouter
     * @returns {Array}
     */
    _getCurrentRouteTrigger: function _getCurrentRouteTrigger() {
      return _.last(this._routeArgs) || [];
    },


    /**
     * Pops the latests route triggered off of the store stack
     *
     * @private
     * @method _clearRouteTrigger
     * @memberOf EventRouter
     */
    _clearRouteTrigger: function _clearRouteTrigger() {
      this._routeArgs.pop();
    },


    /**
     * Checks to see if the current event being tests is the latest
     * route being handled by comparing the route name and arguments
     *
     * @private
     * @method _isTriggeredFromRoute
     * @memberOf EventRouter
     * @returns {Boolean}
     */
    _isTriggeredFromRoute: function _isTriggeredFromRoute() {
      var currentRoute = this._getCurrentRouteTrigger();

      if (arguments.length !== currentRoute.length) {
        return false;
      }

      return arguments.length === _.union(arguments, currentRoute).length;
    },


    /**
     * Takes a event string and any arguments passed to that event
     * And if not initiated by a route, translates the event into a
     * URL and navigates to it without re-triggering the route
     *
     * @public
     * @method navigateFromEvent
     * @param {String} event - Event string
     * @event EventRouter#noMatch - passes route arguments
     * @memberOf EventRouter
     * @returns {EventRouter}
     */
    navigateFromEvent: function navigateFromEvent(event) {
      var route = this.getDefaultRoute(event);

      // if no matching route exists do nothing
      if (!route) {
        var args = _.drop(arguments, 0);
        this.trigger.apply(this, ['noMatch'].concat(args));
        return this;
      }

      if (this._isTriggeredFromRoute.apply(this, arguments)) {
        return this;
      }

      var eventArgs = _.drop(arguments, 1);

      var translatedRoute = this.translateRoute(route, eventArgs);

      // update URL without triggering the route
      return this.navigate(translatedRoute, { trigger: false });
    },


    /**
     * Get the default route string
     * Either the first of the array or the passed in event if singular
     *
     * @public
     * @method getDefaultRoute
     * @memberOf EventRouter
     * @returns {String}
     */
    getDefaultRoute: function getDefaultRoute(event) {
      var routes = this._routeTriggers[event];

      return _.isArray(routes) ? routes[0] : routes;
    },


    /**
     * Finds the next name params (ie: :param) and replaces it with the arg
     *
     * @private
     * @method _replaceParam
     * @param {String} route - Route string
     * @param {String|Number} arg - value to replace named param
     * @memberOf EventRouter
     * @returns {String}
     */
    _replaceParam: function _replaceParam(route, arg) {
      return route.replace(namedParamRegex, arg);
    },


    /**
     * Takes a route string and an array or arguments
     * and returns a url with the named params replaced with the argument values
     *
     * @public
     * @method translateRoute
     * @param {String} route - Route string
     * @param {Array} eventArgs - Passed event arguments
     * @memberOf EventRouter
     * @returns {String}
     */
    translateRoute: function translateRoute(route, eventArgs) {
      return _.reduce(eventArgs, this._replaceParam, route);
    },


    /**
     * Destroys the eventrouter and removes any registered route handlers.
     *
     * @public
     * @method destroy
     * @memberOf EventRouter
     * @returns {EventRouter}
     */
    destroy: function destroy() {
      Backbone.history.handlers = _.reject(Backbone.history.handlers, { cid: this.cid });
      this.stopListening();
      this.trigger('destroy', this);
      return this;
    }
  });

  return EventRouter;

}));

//# sourceMappingURL=backbone.eventrouter.js.map
