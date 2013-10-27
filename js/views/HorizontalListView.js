'use strict';
define('views/HorizontalListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/HorizontalListItemView',
  'views/mixins/Scrollable'
], function(G, U, Events, ResourceListView, HorizontalListItemView, Scrollable) {
  return ResourceListView.extend({
    mixins: [Scrollable],
    _renderedIntersectionUris: [],
    _scrollableOptions: {
      axis: 'X',
      keyboard: false
    },
    _horizontal: true,
    _visible: false,
    _elementsPerPage: 6,
    className: 'thumbnail-gallery',
    events: {
      'orientationchange': 'refresh',
      'resize': 'refresh',
      'refresh': 'refresh'
    },

    initialize: function(options) {
//      _.bindAll(this, 'renderItem');
      ResourceListView.prototype.initialize.apply(this, arguments);
      _.extend(this, options);
    },

    preRender: function() {
      if (!_.has(this, '_isIntersectingWithCollection')) { // only calc this once
        var source = this.parentView.resource,
            vocModel = this.vocModel,
            first = this.collection.models[0];
        
        this.isIntersection = U.isA(vocModel, 'Intersection');
        this._isIntersectingWithCollection = source && 
                                             this.isIntersection && 
                                             source.vocModel.type == U.getTypeUri(first.get('Intersection.a') || first.get('Intersection.b'));
      }
    },
    
    getPageTag: function() {
      return 'div';
    },

    getPageAttributes: function() {
      return 'style="display:inline-block;"';
    },

    _updateConstraints: function() {
      ResourceListView.prototype._updateConstraints.call(this);
      if (this._viewportDim) {
        if (G.browser.mobile && this._viewportDim < 500)
          this._elementsPerPage = 4;
        else
          this._elementsPerPage = 10;
      }
    },
    
    renderItem: function(res, info) {
      var source = this.parentView.resource,
          xUris = this._renderedIntersectionUris,
          a,
          b;

      source = source && source.getUri();
      if (!this._preinitializedItem) {
        this._preinitializedItem = HorizontalListItemView.preinitialize({
          vocModel: this.vocModel,
          parentView: this,
          source: source
        });
      }

      if (this._isIntersectingWithCollection) {
        a = res.get('Intersection.a');
        b = res.get('Intersection.b');
        if ((source == a && ~xUris.indexOf(b)) ||
            (source == b && ~xUris.indexOf(a))) {
          // if we're in a resource view and are showing intersections with this resource, there may be cases like Friend where there are two intersections to represent the relationship. In that case, only paint one (to avoid having two of the same image) 
          return false;
        }
      }
      
      var liView = new this._preinitializedItem({
        resource: res
      });
      
      var rendered = liView.render({
        force: true,
        renderToHtml: true
      });
      
      if (rendered === false)
        return false;
            
      if (this._isIntersectingWithCollection) {
        if (source !== a)
          xUris.push(a);
        if (source !== b)
          xUris.push(b);
      }
      
      this.addChild(liView);
      return liView;
    },
    
    postRender: function() {
      if (!this._visible) {
        this._visible = true;
        this.el.dataset.viewid = this.cid;
        this.$el.removeClass("hidden")
                .trigger("create");
      }
    }
  }, {
    displayName: "HorizontalListView",
    _itemView: HorizontalListItemView
  });
});