define('views/mixins/LazyImageLoader', ['globals', 'underscore', 'utils', 'domUtils', 'events', 'lib/fastdom'], function(G, _, U, DOM, Events, Q) {
  var doc = document,
      docEl = doc.documentElement,
      KEEP_BLOB_ON_RESOURCE = false,
      LAZY_DATA_ATTR = G.lazyImgSrcAttr,
      LAZY_ATTR = LAZY_DATA_ATTR.slice(5),
      DUMMY_IMG = G.getBlankImgSrc(),
      DUMMY_IMG,
      AXIS_INDEX = {
        X: 0,
        Y: 1
      };
//  ,
//      WIN_HEIGHT,
      // Vertical offset in px. Used for preloading images while scrolling
//      IMG_OFFSET = 1000;
//      ,
//      intersectTest = U.isIntersecting.bind(U);

//  Events.once('startingApp', function() {    
//    DUMMY_IMG = G.getBlankImgSrc();
//  });
//  
//  window.addEventListener('debouncedresize', function() {
//    IMG_OFFSET = Math.max(G.viewport.height * 3, 500);
//  });

  function isSickLazyImage(img) {
    var lazyVal = img.getAttribute(LAZY_DATA_ATTR);
    return !lazyVal || !(lazyVal = lazyVal.trim()) || lazyVal == DUMMY_IMG;
  }
  
  var isHealthyLazyImage = _.negate(isSickLazyImage);
      
  return Backbone.Mixin.extend({
//    _delayedImages: [],
//    _delayedImagesCounts: [],
//    _lazyImages: [],
    _loadQueue: [],
    _fetchQueue: [],
    _updateQueue: [],
    events: {
//      'imageOnload': '_queueImageLoad',
      'page_show': '_onpageshow',
      'page_hide': '_hideImages',
      'scrollocontent': '_queueImagesJob'
    },
    
    myEvents: {
//      'viewportDestination': '_onViewportDestinationChanged',
      'loadLazyImages': '_queueImagesJob'
    },
    
    windowEvents: {
      'debouncedresize': '_queueImagesJob'
    },
    
    initialize: function() {
      _.bindAll(this, '_showImages', /*'_queueImageLoad', */'_queueImageFetch', '_queueImageUpdate', /*'_showAndHideImages', '_updateBasedOnViewportDestination',*/ '_onpageshow', '_hideImages');
    },

    _lazyImagesTimeout: function(fn, timeout) {
      if (this._lazyImagesTimer) {
        if (resetTimeout(this._lazyImagesTimer))
          return;
        else
          clearTimeout(this._lazyImagesTimer);
      }
      
      this._lazyImagesTimer = setTimeout(fn, timeout);
    },
    
//    _onViewportDestinationChanged: function(x, y, timeToDestination) {
//      this._lazyImagesTimeout(this._updateBasedOnViewportDestination, Math.min(timeToDestination, 300));
//    },
//    
//    _updateBasedOnViewportDestination: function() {
//      var prevDest = this._lastImagesJobCoords,
//          axis = this.getScrollAxis(),
//          dest = this.getViewportDestination();
//      
//      if (prevDest) {
//        if (Math.abs(dest[axis] - prevDest[axis]) < IMG_OFFSET * 2 / 3) {
//          // we load images within IMG_OFFSET of out current viewport position but we trigger a load when we're 1/3 of an IMG_OFFSET away from the lazy/loaded border
//          // For example, if IMG_OFFSET is viewport.height * 3, we will load images as far as IMG_OFFSET AWAY, but then we won't load more until we are viewport.height away from the closest unloaded image
//          return;
//        }
//      }
//      else
//        prevDest = this._lastImagesJobCoords = {};
//        
//      _.extend(prevDest, dest);
//      this._queueImagesJob();
//    },
    
    _onpageshow: function() {
//      var info = this.getScrollInfo() || {
//        scrollTop: 0,
//        scrollLeft: 0
//      };
//      
//      this._lastImagesJobCoords = {
//        X: -Infinity,
//        Y: -Infinity
//      };
      
      this._queueImagesJob();
    },
    
    _queueImagesJob: function() {
      this._lazyImagesTimeout(this._showImages, 50);      
//      this._lazyImagesTimeout(this._showAndHideImages, 50);      
    },
    
    /**
     * override this if you want to optimize it
     */
    _getWasLazyImages: function() {
      return this.el.getElementsByClassName('wasLazyImage');
    },

    /**
     * override this if you want to optimize it
     */
    _getLazyImages: function() {
      return this.el.getElementsByClassName('lazyImage');
    },
    
    _hideImages: function() {
//      var offscreenImgs = this.el.querySelectorAll('img:not([src="{0}"])'.format(DUMMY_IMG));
      var offscreenImgs = this._getWasLazyImages(this.el);
//      ,
//          viewport = this._getAdjustedViewport();
          
      if (offscreenImgs.length)
        DOM.lazifyImages(offscreenImgs);
    },

    _imageJobIds: [],
    _addImageJob: function(id) {
      this._imageJobIds[this._imageJobIds.length] = id;
    },

    _removeImageJob: function(id) {
      Array.remove(this._imageJobIds, id);
    },

    _hasImageJob: function(id) {
      return !!~this._imageJobIds.indexOf(id);
    },
    
    _clearImageJobs: function() {
//      if (this._imageJobIds.length)
//        console.log("CLEARING IMAGE JOB");
      
      this._imageJobIds.length = 0;
    },

    _showImages: function() {
      this._clearImageJobs();
      var lazy = this._getLazyImages()
          bad = _.filter(lazy, isSickLazyImage);

      if (lazy.length) {
        var i = bad.length;
        while (i--) {
          DOM.unlazifyImage(bad[i]);
        }
        
        if (lazy.length > bad.length) {
          lazy = _.filter(lazy, isHealthyLazyImage);
          if (lazy.length)
            this._loadImages(lazy);
        }
      }
    },
    
//    _queueImageLoad: function(e) {
//      this._loadQueue.push(e.target);
//      this._processImageLoadQueue();
//    },
//    
//    _processImageLoadQueue: function() {
//      if (this.isActive())
//        this._doProcessImageLoadQueue();
//    },
//
//    _doProcessImageLoadQueue: Q.debounce(function() {
//      var loadQueue = U.clone(this._loadQueue);
//      this._loadQueue.length = 0;
//      this._loadImages(loadQueue).always(U.recycle.bind(U, loadQueue));
//    }, 100),

    _queueImageFetch: function(img) {
      this._fetchQueue.push(img);
      this._processImageFetchQueue();
    },
    
    _processImageFetchQueue: Q.debounce(function() {
      this._fetchImages(this._fetchQueue);
    }, 100),

    _queueImageUpdate: function(img, props) {
      this._updateQueue.push(arguments);
      this._processImageUpdateQueue();
    },
    
    _processImageUpdateQueue: Q.debounce(function() {
      this._updateImages(this._updateQueue);
      this._updateQueue.length = 0;
    }, 100),
    
//    _getAdjustedViewport: function() {
//      var viewport = G.viewport,
//          viewportDestination = this.getViewportDestination(),
//          translation = DOM.getTranslation(this.el),
//          viewportPositionX = -translation.X, // if we scroll the page down, we will be looking at elements with positive offset, like top:200px, 
//          viewportPositionY = -translation.Y, // while translation will be negative, like translate(0px, -200px), meaning the top of the page is 200px submerged into the header
//          xAdjustment = viewportDestination.X - viewportPositionX,
//          yAdjustment = viewportDestination.Y - viewportPositionY,
////          favorX = xAdjustment > 0 ? 1 - xAdjustment / IMG_OFFSET : 1 + xAdjustment / IMG_OFFSET,
////          favorY = yAdjustment > 0 ? 1 - yAdjustment / IMG_OFFSET : 1 + yAdjustment / IMG_OFFSET,
//          adjustedViewport = {        
//            top: yAdjustment - IMG_OFFSET, // * favorY, // favor the current scroll direction
//            left: xAdjustment - IMG_OFFSET // * favorX
//          };
//      
//      adjustedViewport.right = adjustedViewport.left + viewport.width + 2 * IMG_OFFSET;
//      adjustedViewport.bottom = adjustedViewport.top + viewport.height + 2 * IMG_OFFSET;
////      console.log("Viewport Y", viewportPositionY);
////      console.log("Viewport Destination Y", viewportDestination.Y);
////      console.log("Y adjustment", yAdjustment);
////      console.debug("Adjusted Viewport", adjustedViewport);
//      return (this._adjustedViewport = adjustedViewport);
//    },
    
    _getImageInfos: function(imgs) {
      var infos = [];
//          ,
//          viewport = this._getAdjustedViewport();
      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i],
            resInfoStr = img.getAttribute('data-for'),
            resInfo = resInfoStr && U.parseImageAttribute(resInfoStr),
            realSrc = img.getAttribute(LAZY_DATA_ATTR),
            res = this.findResourceByCid(resInfo.id) || this.findResourceByUri(resInfo.id),
            rect,
            info;
        
        if (realSrc) {
//          rect = img.getBoundingClientRect();
          info = {
            src: img.src,
            realSrc: realSrc,
            inDoc: docEl.contains(img),
            resource: res
//            ,
//            data: res.get(resInfo.prop + '.data'),
//            data: img.file || img.blob,
//            distance: distance(rect, viewport, adjustment),
//            inBounds: intersectTest(rect, viewport)
          }
              
          if (resInfo)
            info['for'] = resInfo;
        }
        else {
          info = {
            src: DUMMY_IMG,
            realSrc: DUMMY_IMG
          }
        }
        
        infos[infos.length] = info;
      }
      
      return infos;
    },
    
    log: function() {
      var args = _.toArray(arguments);
      args.unshift('LazyImageLoader', 'events');
      G.log.apply(G, args);
    },
    
    _loadImages: function(imgs) {
      if (!imgs.length)
        return G.getRejectedPromise();
      
      imgs = imgs.slice();
      var self = this,
          dfd = $.Deferred(),
          promise = dfd.promise(),
          loadImageJobId;
      
      loadImageJobId = Q.read(function() {
        if (!self._hasImageJob(loadImageJobId))
          return;
        
        self.log("LOADING LAZY IMAGES", _.now());
        var imgInfos = this._getImageInfos(imgs),
//            outOfBounds = [],
            toFetch = [],
            toFetchInfos = [],
            delayed = [];
            
        
        for (var i = imgs.length - 1; i >= 0; i--) {
          var img = imgs[i],
              info = imgInfos[i];
          
          if (info.src != DUMMY_IMG)
            continue;
          
          if (!info.realSrc || info.realSrc == DUMMY_IMG) {
            Q.write(DOM.unlazifyImage.bind(DOM, img)); // this image doesn't need to be lazy (now or in the future)
            continue;
          }
          
          if (info.inDoc) {
//            if (info.inBounds) {
              toFetch.push(img);
              toFetchInfos.push(info);
              continue;
//            }
//            else
//              outOfBounds.push(img, info);
            
//            // wait till it's scrolled into the viewport
//            if (!_.contains(this._lazyImages, img))
//              this._lazyImages.push(img);
//              
//            // check on it a couple more times in case it's arriving in the viewport and we missed the load event
//            // TODO: check current velocity and/or current scroll destination to see if this image will be needed
////              if (velocity > 0 && )
//            this._delayImage(img);
          }
        }
        
        if (toFetch.length)
          this._fetchImages(toFetch, toFetchInfos);
        
//        console.debug(outOfBounds);
        dfd.resolve();
//        this._loadQueue.length = 0;
      }, this);
      
      this._addImageJob(loadImageJobId); 
      return promise;
    },

    _updateImages: function(imagesData) {
      var self = this,
          imgJobId;
      
      imgJobId = Q.write(function() {        
        if (!self._hasImageJob(imgJobId))
          return;
        
        for (var i = 0, num = imagesData.length; i < num; i++) {
          self._updateImage.apply(self, imagesData[i]);
        }
      });
      
      this._addImageJob(imgJobId);
    },

    _updateImage: function(img, info) {
      DOM.unlazifyImage(img, info);
      if (!KEEP_BLOB_ON_RESOURCE) {
        if (info.resource) {
          var prop = info['for'].prop;
          if (prop)
            info.resource.unset(prop + '.data', { silent: true }); // don't keep the file/blob in memory
        }
      }

//      this._distanceToFarthestImage = Math.max(this._distanceToFarthestImage || 0, info.distance);
      _.wipe(info); // just in case it gets leaked...yea, that sounds bad      
    },
    
    _fetchImages: function(imgs, infos) {
      // do all DOM reads first, then writes
      imgs = imgs.slice();
      var self = this,
          toUpdate = [],
          imgJobId;
      
      imgJobId = Q.read(function() {
        if (!self._hasImageJob(imgJobId))
          return;
        
        infos = infos || this._getImageInfos(imgs);
        for (var i = 0, num = imgs.length; i < num; i++) {
          var img = imgs[i],
              info = infos[i];
          
          if (this._fetchImage(img, info))
            toUpdate[toUpdate.length] = [img, info];
        }
        
        this._updateImages(toUpdate);
        this._fetchQueue.length = 0;
      }, this);
      
      this._addImageJob(imgJobId);
    },

    _fetchImage: function(img, info) {
      var self = this,
//          imgInfo, // { id: {String} resource cid for the resource to which this image belongs, prop: {String} property name }
          res,
          prop,
          imgUri;
      
//      Array.remove(this._lazyImages, img);      
      if (info.data) {
        debugger;
//        this._queueImageUpdate(img, info);
        return true;
      }
      
      if (!(imgInfo = info['for'])) {
        img.src = info.realSrc;
        return;
      }
      
//      res = this.findResourceByCid(imgInfo.id) || this.findResourceByUri(imgInfo.id);
      res = info.resource;
//      info.resource = res;
      prop = imgInfo.prop;
      
      if (res && prop && (imgUri = res.get(prop))) {
        var dataProp = prop + '.data',
            hasDataProp = prop + '.hasData',
            hasData = res.get(hasDataProp),
            data = res.get(dataProp);
        
        if (data) {
          var isBlob = data instanceof Blob,
              isFile = data instanceof File;
          
          if (typeof data == 'string') {
            info.src = data;
//            this._queueImageUpdate(img, info);
            return true;
  //            img.src = data;
          }
          else if (isBlob || isFile) {
            //img[isBlob ? 'blob' : 'file'] = 
            info.data = data; // do keep file/blob on the image
//            this._queueImageUpdate(img, info);
            return true;
          }
          else if (data._filePath) {
            U.require('fileSystem').done(function(FS) {
              FS.readAsFile(data._filePath, data._contentType).done(function(file) {
                //img.file = 
                info.data = file; // do keep file/blob on the image
                self._queueImageUpdate(img, info);
              });
            });
          }
          
          return;
        }
        else if (hasData) {
          res.fetch({
            dbOnly: true,
            success: function() {
              if (!res.get(dataProp))
                res.unset(hasDataProp, {silent: true});
              
              self._queueImageFetch(img);
            }
//            error: function() {
//              debugger;
//            }
          });
          
          return;
        }
       
        var realSrc = info.realSrc;
        if (!realSrc)
          return;
        
        info.onload = function() {
          U.getImage(realSrc, 'blob').done(function(blob) {
            if (!blob)
              return;
                  
            // save to resource
            var atts = {};
            atts[prop + '.uri'] = imgUri;
            atts[dataProp] = blob;
            atts[hasDataProp] = true;
            res.set(atts, {
              silent: true
            });
            
            Events.trigger('updatedResources', [res]); // save the image to the db
          }).always(function() {
            info = null;
          });
        };
      }
      
//      this._queueImageUpdate(img, info);
      return true;
    }
  }, {
    displayName: 'LazyImageLoader'
  });
});