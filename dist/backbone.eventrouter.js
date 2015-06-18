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

  var namedParam = /(\(\?)?:\w+/;
  var slice = [].slice;

  var EventRouter = Backbone.EventRouter = Backbone.Router.extend({
    constructor: function constructor(options) {
      options = _.extend({}, options);

      Backbone.Router.apply(this, arguments);

      _.extend(this, _.pick(options, ['channelName', 'routeTriggers']));

      this._ch = Backbone.Radio.channel(_.result(this, 'channelName'));

      if (_.isFunction(this.routeTriggers)) {
        this.routeTriggers = this.routeTriggers.call(this, options);
      }

      this._createRoutes();

      this.listenTo(this._ch, 'all', this.handleRoute);
    },

    channelName: 'event-router',

    getChannel: function getChannel() {
      return this._ch;
    },

    _createRoutes: function _createRoutes() {
      _.each(this.routeTriggers, function (routes, event) {
        routes = _.isArray(routes) ? routes : [routes];
        _.each(routes, function (route) {
          this.route(route, event, _.bind(this._ch.trigger, this._ch, event));
        }, this);
      }, this);
    },

    route: function route(_route, name, callback) {
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) {
        callback = this[name];
      }
      if (!callback) {
        return this;
      }

      var wrappedCallback = _.bind(function () {
        var args = slice.call(arguments);
        this.trigger('before:route', name, args);
        this.trigger.apply(this, ['before:route:' + name].concat(args));
        callback.apply(this, args);
      }, this);

      return Backbone.Router.prototype.route.call(this, _route, name, wrappedCallback);
    },

    handleRoute: function handleRoute(event) {
      var route = this.getDefaultRoute(event);

      if (!route) {
        return this;
      }

      // remove the event name and the query string from the passed arguments
      var eventArgs = slice.call(arguments, 1, arguments.length - 1);

      var translatedRoute = this.translateRoute.apply(this, [event, route].concat(eventArgs));

      this.navigate(translatedRoute, { trigger: false });

      return this;
    },

    getDefaultRoute: function getDefaultRoute(event) {
      var routes = this.routeTriggers[event];

      return _.isArray(routes) ? routes[0] : routes;
    },

    translateRoute: function translateRoute(routeEvent, route) {
      var eventArgs = _.tail(arguments, 2);

      var translatedRoute = route;

      _.each(eventArgs, function (arg) {
        translatedRoute = translatedRoute.replace(namedParam, arg);
      });

      return translatedRoute;
    }
  });

  var backbone_eventrouter = EventRouter;

  return backbone_eventrouter;
});
//# sourceMappingURL=./backbone.eventrouter.js.map