import _ from 'underscore';
import Backbone from 'backbone';
import Radio from 'backbone.radio'; // eslint-disable-line

var EventRouter = Backbone.EventRouter = Backbone.Router.extend({
  constructor: function(options) {
    options = _.extend({}, options);

    Backbone.Router.apply(this, arguments);

    _.extend(this, _.pick(options, ['channelName', 'routeTriggers']));

    this._ch = Backbone.Radio.channel(_.result(this, 'channelName'));

    this._initRoutes();

    this.listenTo(this._ch, 'all', this.navigateFromEvent);
  },

  channelName: 'event-router',

  getChannel: function() {
    return this._ch;
  },

  _initRoutes: function() {
    this._routeTriggers = _.result(this, 'routeTriggers') || {};

    _.each(this._routeTriggers, this._addTriggerRoute, this);
  },

  _addTriggerRoute: function(routes, event){
    routes = _.isArray(routes) ? routes : [routes];

    _.each(routes, function(route) {
      this.route(route, event, _.bind(this._ch.trigger, this._ch, event));
    }, this);
  },

  addTriggerRoute: function(routes, event){
    this._routeTriggers[event] = routes;
    this._addTriggerRoute(routes, event);

    return this;
  },

  route: function(route, name, callback) {
    if (_.isFunction(name)) {
      callback = name;
      name = '';
    }
    if (!callback) {
      callback = this[name];
    }

    var wrappedCallback = _.bind(function() {
      var args = Array.prototype.slice.call(arguments);
      this.trigger('before:route', name, args);
      this.trigger.apply(this, ['before:route:' + name].concat(args));
      this._storeRouteTrigger([name].concat(args));
      callback.apply(this, args);
      this._clearRouteTrigger();
    }, this);

    return Backbone.Router.prototype.route.call(this, route, name, wrappedCallback);
  },

  _storeRouteTrigger: function(args){
    this._routeArgs = this._routeArgs || [];
    this._routeArgs.push(args);
  },

  _getCurrentRouteTrigger: function(){
    return _.last(this._routeArgs) || [];
  },

  _clearRouteTrigger: function(){
    this._routeArgs.pop();
  },

  _isTriggeredFromRoute: function(){
    var currentRoute = this._getCurrentRouteTrigger();

    if(arguments.length !== currentRoute.length){
      return false;
    }

    return (arguments.length === _.union(arguments, this.currentRoute).length);
  },

  navigateFromEvent: function(event) {
    var route = this.getDefaultRoute(event);

    // if no matching route exists do nothing
    if(!route) {
      this.trigger.apply(this, ['noMatch'].concat(arguments));
      return this;
    }

    if(this._isTriggeredFromRoute.apply(this, arguments)) {
      return this;
    }

    var eventArgs = _.rest(arguments);

    var translatedRoute = this.translateRoute(route, eventArgs);

    // update URL without triggering the route
    return this.navigate(translatedRoute, { trigger: false });
  },

  getDefaultRoute: function(event) {
    var routes = this._routeTriggers[event];

    return _.isArray(routes) ? routes[0] : routes;
  },

  _replaceParam: function(route, arg){
    // https://github.com/jashkenas/backbone/blob/1.2.1/backbone.js#L1425
    var namedParam = /(\(\?)?:\w+/;

    return route.replace(namedParam, arg);
  },

  translateRoute: function(route, eventArgs) {
    return _.reduce(eventArgs, this._replaceParam, route);
  }
});

export default EventRouter;
