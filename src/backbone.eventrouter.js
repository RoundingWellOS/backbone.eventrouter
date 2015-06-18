import _ from 'underscore';
import Backbone from 'backbone';
import Radio from 'backbone.radio'; // eslint-disable-line

var namedParam = /(\(\?)?:\w+/;
var slice = [].slice;

var EventRouter = Backbone.EventRouter = Backbone.Router.extend({
  constructor: function(options) {
    options = _.extend({}, options);

    Backbone.Router.apply(this, arguments);

    _.extend(this, _.pick(options, ['channelName', 'routeTriggers']));

    this._ch = Backbone.Radio.channel(_.result(this, 'channelName'));

    if(_.isFunction(this.routeTriggers)) {
      this.routeTriggers = this.routeTriggers.call(this, options);
    }

    this._createRoutes();

    this.listenTo(this._ch, 'all', this.handleRoute);
  },

  channelName: 'event-router',

  getChannel: function() {
    return this._ch;
  },

  _createRoutes: function() {
    _.each(this.routeTriggers, function(routes, event) {
      routes = _.isArray(routes) ? routes : [routes];
      _.each(routes, function(route) {
        this.route(route, event, _.bind(this._ch.trigger, this._ch, event));
      }, this);
    }, this);
  },

  route: function(route, name, callback) {
    if (_.isFunction(name)) {
      callback = name;
      name = '';
    }
    if (!callback) {
      callback = this[name];
    }
    if(!callback) {
      return this;
    }

    var wrappedCallback = _.bind(function() {
      var args = slice.call(arguments);
      this.trigger('before:route', name, args);
      this.trigger.apply(this, ['before:route:' + name].concat(args));
      callback.apply(this, args);
    }, this);

    return Backbone.Router.prototype.route.call(this, route, name, wrappedCallback);
  },

  handleRoute: function(event) {
    var route = this.getDefaultRoute(event);

    if(!route) {
      return this;
    }

    // remove the event name and the query string from the passed arguments
    var eventArgs = slice.call(arguments, 1, arguments.length - 1);

    var translatedRoute = this.translateRoute.apply(this, [event, route].concat(eventArgs));

    this.navigate(translatedRoute, { trigger: false });

    return this;
  },

  getDefaultRoute: function(event) {
    var routes = this.routeTriggers[event];

    return _.isArray(routes) ? routes[0] : routes;
  },

  translateRoute: function(routeEvent, route) {
    var eventArgs = _.tail(arguments, 2);

    var translatedRoute = route;

    _.each(eventArgs, function(arg) {
      translatedRoute = translatedRoute.replace(namedParam, arg);
    });

    return translatedRoute;
  }
});

export default EventRouter;
