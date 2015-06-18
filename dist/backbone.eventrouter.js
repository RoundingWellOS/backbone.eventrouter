/**
 * backbone.eventrouter - A highly opinionated, simplistic Backbone.Router coupled with a Backbone.Radio.Channel
 * @version v0.1.0
 * @link https://github.com/RoundingWellOS/backbone.eventrouter
 * @license MIT
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('underscore'), require('backbone'), require('backbone.radio')) : typeof define === 'function' && define.amd ? define(['underscore', 'backbone', 'backbone.radio'], factory) : global.Backbone.EventRouter = factory(global._, global.Backbone, global.Radio);
})(this, function (_, Backbone, Radio) {
  'use strict';

  var EventRouter = Backbone.EventRouter = Backbone.Router.extend({
    constructor: function constructor(options) {
      options = _.extend({}, options);

      Backbone.Router.apply(this, arguments);

      _.extend(this, _.pick(options, ['channelName', 'routeTriggers']));

      this._ch = Backbone.Radio.channel(_.result(this, 'channelName'));

      this._initRoutes();

      this.listenTo(this._ch, 'all', this.navigateFromEvent);
    },

    channelName: 'event-router',

    getChannel: function getChannel() {
      return this._ch;
    },

    _initRoutes: function _initRoutes() {
      this._routeTriggers = _.result(this, 'routeTriggers') || {};

      _.each(this._routeTriggers, this._addTriggerRoute, this);
    },

    _addTriggerRoute: function _addTriggerRoute(routes, event) {
      routes = _.isArray(routes) ? routes : [routes];

      _.each(routes, function (route) {
        this.route(route, event, _.bind(this._ch.trigger, this._ch, event));
      }, this);
    },

    addTriggerRoute: function addTriggerRoute(routes, event) {
      this._routeTriggers[event] = routes;
      this._addTriggerRoute(routes, event);

      return this;
    },

    route: function route(_route, name, callback) {
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) {
        callback = this[name];
      }

      var wrappedCallback = _.bind(function () {
        var args = Array.prototype.slice.call(arguments);
        this.trigger('before:route', name, args);
        this.trigger.apply(this, ['before:route:' + name].concat(args));
        this._storeRouteTrigger([name].concat(args));
        callback.apply(this, args);
        this._clearRouteTrigger();
      }, this);

      return Backbone.Router.prototype.route.call(this, _route, name, wrappedCallback);
    },

    _storeRouteTrigger: function _storeRouteTrigger(args) {
      this._routeArgs = this._routeArgs || [];
      this._routeArgs.push(args);
    },

    _getCurrentRouteTrigger: function _getCurrentRouteTrigger() {
      return _.last(this._routeArgs) || [];
    },

    _clearRouteTrigger: function _clearRouteTrigger() {
      this._routeArgs.pop();
    },

    _isTriggeredFromRoute: function _isTriggeredFromRoute() {
      var currentRoute = this._getCurrentRouteTrigger();

      if (arguments.length !== currentRoute.length) {
        return false;
      }

      return arguments.length === _.union(arguments, this.currentRoute).length;
    },

    navigateFromEvent: function navigateFromEvent(event) {
      var route = this.getDefaultRoute(event);

      // if no matching route exists do nothing
      if (!route) {
        this.trigger.apply(this, ['noMatch'].concat(arguments));
        return this;
      }

      if (this._isTriggeredFromRoute.apply(this, arguments)) {
        return this;
      }

      var eventArgs = _.rest(arguments);

      var translatedRoute = this.translateRoute(route, eventArgs);

      // update URL without triggering the route
      return this.navigate(translatedRoute, { trigger: false });
    },

    getDefaultRoute: function getDefaultRoute(event) {
      var routes = this._routeTriggers[event];

      return _.isArray(routes) ? routes[0] : routes;
    },

    _replaceParam: function _replaceParam(route, arg) {
      // https://github.com/jashkenas/backbone/blob/1.2.1/backbone.js#L1425
      var namedParam = /(\(\?)?:\w+/;

      return route.replace(namedParam, arg);
    },

    translateRoute: function translateRoute(route, eventArgs) {
      return _.reduce(eventArgs, this._replaceParam, route);
    }
  });

  var backbone_eventrouter = EventRouter;

  return backbone_eventrouter;
});
//# sourceMappingURL=./backbone.eventrouter.js.map