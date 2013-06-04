//'use strict';
define('views/AroundMeButton', [
  'globals',
  'views/ToggleButton',
  'utils',
  'events'
], function(G, ToggleButton, U, Events) {
  return ToggleButton.extend({
    TAG: 'AroundMeButton',
    id: 'aroundMe',
    tagName: 'li',
    templateName: 'aroundMeButtonTemplate',
    events: {
      'click': 'toggleAroundMe'
    },
    initialize: function(options) {      
      _.bindAll(this, 'render', 'toggleAroundMe', 'isOn');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.vocModel.type);
      this._isOn = this._onByDefault = !!(options || {}).isOn || this.isOn();
      return this;
    },
    isOn: function() {
      return !!U.getHashParams()['-item'];
    },
    reset: function() {
      this._isOn = this._onByDefault;  
    },
    render: function(options) {
      this.$el.html(this.template());
      this.setStyle();
      return this;
    },
    toggleAroundMe : function() {
      this._isOn = !this._isOn;
      var vocModel = this.vocModel;
      if (!this._isOn) {
        this.reset();
        this.router.navigate(U.makeMobileUrl(null, vocModel.type), {trigger: true});
        return this;
      }
      
      if (!navigator.geolocation) {
        alert("Sorry, your browser does not support geolocation services.");
        return this;
      }
        
      var iFaces = vocModel.interfaces;
      if (!_.contains(iFaces, 'Locatable'))
        return this;
      
  //    if (!props.distance || !props.latitude || !props.longitude)
  //      return;
      
      var self = this, 
          userLoc = G.currentUser.location;
      
      navigator.geolocation.getCurrentPosition(
        function(position) {
          return self.fetchAroundPosition(position.coords);
        },
        function(error) {
          var lastLocTime = userLoc ? userLoc.timestamp : 0;
          if (lastLocTime && new Date().getTime() - lastLocTime < 1000)
            self.fetchAroundPosition(G.userLocation.location);
          else
            self.constructor.locationError(error);
        }
      );
      
      return this;
    },
    fetchAroundPosition : function(coords, item) {
      G.currentUser.location = {
        location: coords,
        timestamp: new Date().getTime()
      };
      
      var isCollection = U.isCollection(this.model), 
          params = isCollection ? U.getQueryParams(this.model) : {};

      _.extend(params, {latitude: coords.latitude, longitude: coords.longitude, '-item': item || 'me', '$orderBy': 'distance'});
      
      this.reset();
      this.router.navigate(U.makeMobileUrl(null, this.vocModel.type, params), {trigger: true});
      return this;
    }
  },
  {
    locationError: function(error) {
      switch (error.code) { 
       case error.PERMISSION_DENIED:
         alert("Could not get position as permission was denied.");
         break;
       case error.POSITION_UNAVAILABLE:
         alert("Could not get position as this information is not available at this time.");
         break;
        case error.TIMEOUT:
          alert("Attempt to get position timed out.");
         break;
        default:
         alert("Sorry, an error occurred. Code: " + error.code + " Message: " + error.message);
         break;  
      }
    }
  },
  {
    displayName: 'AroundMeButton'
  });
});