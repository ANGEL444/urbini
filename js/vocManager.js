//'use strict';
define([
  'globals',
  'utils', 
  'error', 
  'events', 
  'models/Resource', 
  'collections/ResourceList' 
], function(G, U, Errors, Events, Resource, ResourceList) {
  Backbone.Model.prototype._super = function(funcName){
    return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
  };
  
  // from http://www.bennadel.com/blog/1929-Using-The-WITH-Keyword-With-Javascript-s-Function-Constructor.htm
  var FunctionProxy = function(sourceCode) {
    
   // When executing the Function constructor, we are going
   // to wrap the source code in a WITH keyword block that
   // allows the THIS context to extend the local scope of
   // the function.
   //
   // NOTE: This works without a nested self-executing
   // function. I put it in there simply because it makes me
   // feel a little more comfortable with the use of the
   // WITH keyword.
    return Function(
      "with (this) {" +
        "return " + sourceCode + ";" +
      "};"
    );
  }

  G.classUsage = _.map(G.classUsage, U.getTypeUri);
  G.shortNameToModel.Resource = Resource;
  G.typeToModel.Resource = Resource;
  var Voc = {
    packages: {Resource: Resource},
    scriptContext: {},
//    unsavedModels: [],
    changedModels: [],
//    newModels: [],
    models: [Resource],
//    getModels: function(models, options) {
//      return $.Deferred(function() {
//        for (var model in models) {
//          
//        }
//      }).promise();
//    },
    
    fetchModels: function(models, options) {
      return $.Deferred(function(defer) {        
        options = options || {};
        var changedAndNew = !models;
        models = changedAndNew ? Voc.changedModels : typeof models === 'string' ? [models] : models;
        models = _.filter(models, function(m) {
          return !G.typeToModel[m]; // we may have loaded some already, e.g. the urgently needed one
        });
        
  //      models = changedAndNew ? _.union(Voc.changedModels, Voc.newModels) : typeof models === 'string' ? [models] : models;      
  //      options = options || {};
  //      var success = options.success;
  //      var error = options.error || Errors.getDefaultErrorHandler();
        
        function earlyExit() {
//          if (success && !options.skipSuccessIfUpToDate)
//            success({fetched: 0});
          defer.resolve({fetched: 0});
          return true;
        }
        
        if (!models.length)
          return earlyExit();
        
        var c = Voc.currentModel;
        var urgent = options.sync && models.length > 1 && c && !G.typeToModel[c] && c;
        if (urgent) {
  //        urgent = urgent[0];        
          Voc.fetchModels([urgent], options).done(function() {
            defer.resolve();
//            if (success)
//              success();
            
//            options.sync = false;
//            options.success = success;
            if (changedAndNew)
              Voc.fetchModels(null, options);
            else {
              models = _.filter(models, function(m) {
                return (m.type || m) != urgent;
              });
              
              Voc.fetchModels(models, options);
            }
          });
          
          return;
        }
        
        if (!models.length)
          return earlyExit();
        
        if (!G.online) {
//          if (error)
//            error(null, {type: 'offline'}, options);
          defer.rejectWith(this, [null, {type: 'offline'}, options]);
          return;
        }
  
  //      var infos = Voc.getModelInfo(models);
        // TODO: undo HACK
        var infos = models;
        var modelsCsv = JSON.stringify(infos);
        G.startedTask("ajax models");
  //      var useWorker = G.hasWebWorkers && !options.sync;
        var checkInModels = function(respModels) {
          if (!changedAndNew)
            return;
          
  //        var tmpC = [];
  //        for (var i = 0; i < respModels.length; i++) {
  //          var m = respModels[i];
  //          var type = U.getLongUri1(m.s.type);
  //          if (models.indexOf(type) != -1)
  //            tmpC.push(type);
  //        }
  //        
  //        models = tmpC;
  //        if (changedAndNew)
  //          Voc.changedModels = tmpC;
  //        
  //        return !!tmpC.length;
          models = _.filter(respModels, function(m) {
            var type = U.getLongUri1(m.s.type);
            return models.indexOf(type) != -1;
          });
          
          if (changedAndNew)
            Voc.changedModels = _.map(models, function(m) {return U.getLongUri1(m.s.type)});
          
          return models.length;
  //        Voc.newModels = tmpN;
  //        return tmpC.length || tmpN.length;
        }
  
        var ajaxSettings = _.extend({
          url: G.modelsUrl, 
          data: {models: modelsCsv}, 
          type: 'POST', 
          timeout: 5000
        }, _.pick(options, 'sync'));
        
        G.ajax(ajaxSettings).done(function(data, status, xhr) {
          if (!data) {
            debugger;
            defer.rejectWith(this, [xhr, status, options]);
            return;
          }
          
          if (data.error) {
//              error(data);
            defer.rejectWith(this, [xhr, data.error, options]);
            return;
          }
          
          var mz = data.models || [];
          var needUpgrade = checkInModels(mz);
          var pkg = data.packages;
          if (pkg)
            U.deepExtend(Voc.packages, pkg);
          
          G.lastModified = data.lastModified;
          G.classUsage = _.union(G.classUsage, _.map(data.classUsage, U.getTypeUri));
          var more = data.linkedModelsMetadata;
          if (more) {
            G.linkedModelsMetadata = _.union(G.linkedModelsMetadata, _.map(more, function(m) {
              m.type = U.getLongUri1(m.type);
              return m;
            }));
          }
          
          if (data.classMap)
            _.extend(G.classMap, data.classMap)
          
          var newModels = [];
          for (var i = 0; i < mz.length; i++) {
            var newModelJson = mz[i];
            var p = newModelJson.path;
            var lastDot = p.lastIndexOf('.');
            var path = p.slice(0, lastDot);
            var name = p.slice(lastDot + 1);
            var sup = newModelJson.sPath;
            newModelJson.lastModified = newModelJson.s.lastModified ? Math.max(G.lastModified, newModelJson.s.lastModified) : G.lastModified;
            
            // mz[i].p and mz[i].s are the private and static members of the Backbone.Model being created
            var newModel;
            if (newModelJson.s.enumeration)
              newModel = Backbone.Model.extend(newModelJson.p, newModelJson.s);
            else
              newModel = U.leaf(Voc.packages, path)[name] = U.leaf(Voc.packages, sup).extend(newModelJson.p, newModelJson.s);
            
            U.pushUniq(newModels, newModel);
          }
          
//          Voc.unsavedModels = _.union(Voc.unsavedModels, newModels);
          Voc.models = _.union(Voc.models, newModels);
  //        for (var i = 0; i < newModels.length; i++) {
  //          U.pushUniq(Voc.models, newModels[i]); // preserve order of Voc.models
  //        }

          Voc.initModels(newModels);          
          setTimeout(function() {
            Voc.saveModelsToStorage(newModels);
          }, 100);
          G.finishedTask("ajax models");
          Voc.setupHandlers(data.handlers);
//            success && success();
          defer.resolve();
          if (needUpgrade)
            Events.trigger('modelsChanged');//, {success: success, error: error});
        }).fail(function(xhr, err, aOpts) {
          if (xhr.status === 304) {
            checkInModels([]);
//              success && success({fetched: 0});
            defer.resolve({fetched: 0});
            return;
          }
          else
            defer.reject();
        });
      }).promise();
    },
    
    setupHandlers: function(handlers) {
      if (handlers) {
        _.extend(G.customHandlers, handlers);
        Voc.saveHandlersToStorage(handlers);
      }
    },
    
    getModelInfo: function(models) {
      var now = G.currentServerTime();
      return _.filter(_.map(models, function(m) {
        if (_.contains(G.storedModelTypes, m)) {
          var info = G.modelsMetadataMap[m];
          if (info && info.stored || (info = G.oldModelsMetadataMap[m]))
            return {uri: info.type, lastModified: info.lastModified};
        }
        
        return m;
//        if (info)
//          return info;
        
//        var model = Voc.snm[U.getShortName(m)];
//        if (model) {
//          // staleness should have already been detected in loadStoredModels
////          if (lm && now - lm < 360000) // consider model stale after 1 hour
////            return null;          
//          var info = {uri: m};
//          if (model._dateStored)
//            info.lastModified = lm;
//          
//          return info;
//        }
//        else
//          return m;
      }), function (m) {return m}); // filter out nulls
    },

    fetchModelsForLinkedResources: function(model) {
      var isResource = typeof model !== 'function';
      var ctr = isResource ? model.constructor : model;
      var props = {};
      for (var name in ctr.properties) {
        if (!isResource || model.get(name))
          props[name] = ctr.properties[name];
      }
      
      var tmp = _.filter(_.uniq(_.map(props, function(prop, name) {
        if (isResource && prop.backLink) {
          var count = model.get(name + 'Count') || model.get(name).count;
          if (!count)
            return null;
        }
        
        var range = prop && prop.range;
        range = range && (range.indexOf('/') == -1 || range.indexOf('/Image') != -1 ? null : U.getTypeUri(range));
        if (range && G.classMap)
          range = G.classMap[range] || range;
        
        return !range ? null : isResource ? range : _.contains(G.classUsage, range) ? range : null;
      })), function(m) {
        // no need to reload known types
        return m && !G.typeToModel[m];
      }); 
  
      var linkedModels = [];
//      G.linkedModelsMetadataMap = {};
      var l = G.linkedModelsMetadata;
      _.each(l, function(m) {
        m.type = U.getLongUri1(m.type);
      });
      
      for (var i = 0; i < l.length; i++) {
        // to preserve order
        var idx = tmp.indexOf(l[i].type);
        if (idx != -1) {
          tmp.splice(idx, idx + 1);
          var info = l[i];
          info.type = G.classMap[info.type] || info.type;
          linkedModels.push(info);
        }
      }
      
//      linkedModels = _.union(linkedModels, tmp); // maybe we were missing some in linkedModels
      if (linkedModels.length) {
  //      linkedModels = _.uniq(linkedModels);
        Voc.loadStoredModels({models: linkedModels, sync: false});
        Voc.fetchModels(null, {sync: false});
      }
      
//      Voc.fetchModels(_.union(Voc.changedModels, Voc.newModels, tmp), {sync: false});
    },

    fetchModelsForReferredResources: function(list) {
      var model = list.vocModel;
      var resources = list.resources;
      var meta = model.properties;
      
      var tmp = [];

      var l = _.keys(G.typeToModel);
      var modelsToFetch = [];

      for (var propName in meta) {
        var p = meta[propName]; 
//        if (p.backLink) {
//          var type = G.defaultVocPath + p.range;
//          if (!_.contains(modelsToFetch, type)  &&  !_.contains(l, type))
//            modelsToFetch.push(type);
//        }
//        else
          !U.isInlined(p)  &&  p.range  &&  !p.backLink  &&  p.range.indexOf('/') != -1  &&  p.range.indexOf('/Image') == -1  &&  tmp.push(propName);
      }
      if (!tmp.length)
        return;
      
      for (var i=0; i<resources.length; i++) {
        for (var j=0; j<tmp.length; j++) {
          var o = resources[i].get(tmp[j]);
          var uri = o  &&  o.value;
          if (!uri)
            continue;
          
          var idx = uri.indexOf("?");
          var idx0 = uri.indexOf('/' + G.sqlUri + '/');
          if (idx0 == -1) // could be S3 Image uri
            continue;
          var type = 'http://' + uri.substring(idx0 + G.sqlUri.length + 2, idx);
          if (!_.contains(modelsToFetch, type)  &&  !_.contains(l, type))
            modelsToFetch.push(type);
        }  
      }  
      
      
      if (modelsToFetch.length) {
//        linkedModels = _.uniq(linkedModels);
        Voc.loadStoredModels({models: modelsToFetch});
        Voc.fetchModels(null, {sync: false});
      }
    },

    initModel: function(m) {
      var sn = m.shortName;
      if (G.shortNameToModel[sn])
        return;

      var type = m.type = U.getTypeUri(m.type);
      if (_.contains(G.classUsage, type)) {
        G.usedModels[type] = true;
      }
        
      Voc.scriptContext[sn] = m;
      if (m.enumeration) {
        G.shortNameToEnum[sn] = m;
        G.typeToEnum[type] = m;
        return;
      }
      else if (m.alwaysInlined) {
        G.shortNameToInline[sn] = m;
        G.typeToInline[type] = m;
        return;
      }
      else {
        G.shortNameToModel[sn] = m;
        G.typeToModel[type] = m;
      }
      
      m.prototype.parse = Resource.prototype.parse;
      m.prototype.validate = Resource.prototype.validate;
      m.superClass = m.__super__.constructor;
      var superProps = m.superClass.properties;
      var myProps = m.myProperties;
      var hidden = m.hiddenProperties ? m.hiddenProperties.replace(/\ /g, '').split(',') : [];
      if (superProps) {
        superProps = U.filterObj(superProps, function(name, prop) {return !_.contains(hidden, name)});
        for (var p in myProps) {
          var subProp = myProps[p];
          var superPropUri = subProp.subPropertyOf;
          if (superPropUri) {
            var superProp = superProps[superPropUri.slice(superPropUri.lastIndexOf('/') + 1)];
            myProps[p] = U.extendAnnotations(subProp, superProp);
            delete superProps[superPropUri];
          }
        }
        
        m.properties = _.extend(superProps, myProps);
      }
      else
        m.properties = _.clone(myProps);
      
      _.extend(m.properties, U.systemProps);
      var superInterfaces = m.superClass.interfaces;
      m.interfaces = superInterfaces ? _.extend(_.clone(superInterfaces), m.myInterfaces) : _.clone(m.myInterfaces);
      m.prototype.initialize = Voc.getInit.apply(m);
      setTimeout(function() {
        Voc.initCustomHandlers(type);
      }, 1000);
    },
    
    prepareHandler: function(handler, resultType) {
      return function(res) {
        return Voc.executeHandler(handler, resultType, res);
      }
    },
    
    executeHandler: function(handler, resultType, res, context) {
      var type = resultType.slice(resultType.lastIndexOf("/") + 1).camelize();
      var result = {};
      result[type] = {};

      try {
        handler.apply(result).call(context || {}, res);
      } catch (err) {
        return;
      }

      var fromRes = res;
      result = result[type];
      Voc.fetchModels(resultType).done(function() {
        var toVocModel =  G.typeToModel[resultType];
        var fromVocModel = G.typeToModel[fromRes._type];
        
        // copy image props, if both are imageResources
        if (U.isA(fromVocModel, "ImageResource") && U.isA(toVocModel, "ImageResource")) {
          var fromTo = {};
          for (var i = 0; i < U.imageResourceProps.length; i++) {
            var iProp = U.imageResourceProps[i];
            var to = U.getCloneOf(toVocModel, iProp);
            if (!to || result[to]) {
              fromTo = null;
              break;
            }
            
            var from = U.getCloneOf(fromVocModel, iProp);
            if (from)
              fromTo[from] = to;
          }
          
          if (fromTo) {
            for (var from in fromTo) {
              var to = fromTo[from];
              from = fromRes[from];
              if (from)
                result[to] = from;
            }
          }
        }
        
        var res = new toVocModel();
        res.save(result, {'$returnMade': false, sync: false});
      }).fail(function() {
        debugger;
      });
    },
    
    buildScript: function(script) {
      if (typeof script === 'string') {
        script = script.replace(/(<([^>]+)>)/ig, '').trim();
        try {
          script = FunctionProxy(script);
        } catch (err) {
          script = null;
        }
      }
      
      return script;
    },
    
    initCustomHandlers: function(type) {
      var handlers = G.customHandlers[type];
      if (!handlers) {
        handlers = G.localStorage.get("handlers:" + type);
        if (handlers)
          handlers = JSON.parse(handlers);
      }
      
      if (!handlers)
        return;
    
      var typeName = type.slice(type.lastIndexOf('/') + 1);
      _.each(handlers, function(handler) {
        var create = handler.createScript;
        if (create) {
          create = Voc.buildScript(create);
          if (create === null)
            G.log(Voc.TAG, 'error', 'bad custom createScript', handler.app, type);
        }
        var edit = handler.editScript;
        if (edit) {
          edit = Voc.buildScript(edit);
          if (edit === null)
            G.log(Voc.TAG, 'error', 'bad custom editScript', handler.app, type);
        }
        
        if (create)
          Events.on('add.' + type, Voc.prepareHandler(create, handler.toDavClassUri));
        if (edit)
          Events.on('edit.' + type, Voc.prepareHandler(edit, handler.toDavClassUri));

//        var events = script.events;
//        if (events) {
//          for (var event in events) {
//            try {
//              var listener = script[events[event]];
//              Events.on(event + '.' + type, listener, Voc.scriptContext);
//            } catch (err) {
//              G.log(Voc.TAG, 'error', 'bad custom script', handler.app, type);
//            }
//          }
//        }
      });
    },
    
    getInit: function() {
      var self = this;
      return function() { 
        self.__super__.initialize.apply(this, arguments); 
//        this.on('change', Voc.updateDB);
      }
    },

    initModels: function(models) {
      models = models || Voc.models;
      for (var i = 0; i < models.length; i++) {
        var m = models[i];
        if (m.shortName != 'Resource')
          delete G.shortNameToModel[m.shortName];
        
        Voc.initModel(m);
      }
    },
    
    contactKey: "com.fog.security.contact",
    checkUser: function() {
      if (!G.hasLocalStorage)
        return; // TODO: use indexedDB
      
      var p = G.localStorage.get(Voc.contactKey);
      p = p && JSON.parse(p);
      var c = G.currentUser;
      G.userChanged = !p && !c.guest || p && !c.guest && p._uri != c._uri || p && c.guest;
      if (G.userChanged) {
        if (c.guest) {
          G.localStorage.del(Voc.contactKey);          
        }
        else {
          // no need to clear localStorage, it's only used to store models, which can be shared
          G.localStorage.put(Voc.contactKey, JSON.stringify(c));
        }
         
        G.localStorage.nukeHandlers();
        Voc.fetchHandlers();
      }
    },
    
    fetchHandlers: function(models) {
      if (!models) {
        models = _.keys(G.typeToModel);
        for (var key in localStorage) {
          if (key.startsWith('model:'))
            models.push(key.slice(6));
        }
        
        models = _.uniq(models).join(',');
      }
      
      G.ajax({type: 'POST', url: G.modelsUrl, data: {models: models, handlersOnly: true}}).done(function(data, status, xhr) {
        debugger;
        Voc.setupHandlers(data);
      });
    },
    
    saveModelsToStorage: function(models) {
      if (!localStorage)
        return; // TODO: use indexedDB
      
      models = models || Voc.models;
      if (!models.length)
        return;
    
      var now = G.currentServerTime();
      var enumModels = {};
      _.each(models, function(model) {
        if (model.type.endsWith('#Resource'))
          return;
        
        var modelJson = U.toJSON(model);
        modelJson._dateStored = now;
        if (model.superClass)
          modelJson._super = model.superClass.type;
        if (model.enumeration)
          enumModels[model.type] = modelJson;
        else
          Voc.storeModel(modelJson);
      });
      
      if (_.size(enumModels)) {
        var enums = Voc.getEnumsFromLS();
        enums = enums ? JSON.parse(enums) : {};
        _.extend(enums, enumModels);
        Voc.storeEnumsInLS(enums);
      }
    },

    saveHandlersToStorage: function(handlers) {
      if (!localStorage || !_.size(handlers))
        return;
    
      for (var type in handlers) {
        G.localStorage.putAsync('handlers:' + type, handlers[type]);
      }
    },

    loadModel: function(modelJson, sUri, superName) {
      superName = superName || sUri.slice(sUri.lastIndexOf('/') + 1); 
      var pkgPath = U.getPackagePath(modelJson.type);
      var sPath = U.getPackagePath(sUri);
      var pkg = U.addPackage(Voc.packages, pkgPath);
      var sName = modelJson.shortName;
      if (Voc.snm[sName])
        delete Voc.snm[sName];
      
      var model = pkg[sName] = U.leaf(Voc, (sPath ? sPath + '.' : '') + superName).extend({}, modelJson);
      Voc.initModel(model);
    },

    getModelChain: function(model, have) {
      if (have)
        have[model.type] = model;
      
      if (!G.hasLocalStorage)
        return null;
      
      var sup = model.subClassOf;
      if (!sup)
        throw new Error('every model except Resource must be a subClassOf of another model');
      
      if (sup == 'Resource')
        return [model];
        
      sup = sup.startsWith('http') ? sup : 'http://www.hudsonfog.com/voc/' + sup;
      var savedSModel = have && have[sup];
      sModel = savedSModel || Voc.getModelFromLS(sup);
      if (!sModel)
        return null;
      
      sModel = savedSModel || JSON.parse(sModel);
      if (!savedSModel && have)
        have[sup] = sModel;
      
      var sChain = Voc.getModelChain(sModel, have);
      return sChain == null ? null : sChain.concat(model);
    },
    
    initStoredModels: function(models) {
      models = _.filter(models, function(model) {
        if (model.subClassOf != null || model.type.endsWith("#Resource"))
          return true;
        else {
          U.pushUniq(Voc.changedModels, model.type);
          return false;
        }
      });
      
      if (!models.length)
        return models;
      
      var unloaded = [];
      for (var i = 0; i < models.length; i++) {
        var m = models[i];
        var sUri = m.subClassOf;
        var sIdx = sUri.lastIndexOf('/');
        var superName = sIdx == -1 ? sUri : sUri.slice(sIdx + 1);
        if (!Voc.snm[superName]) {
          if (_.contains(unloaded, m))
            continue;
          
          var chain = Voc.getModelChain(m, null);
          if (chain) {
            var fresh = [], stale = [];
            Voc.filterExpired(null, chain, fresh, stale);
            if (stale.length)
              unloaded.push(m);
          }
          else
            unloaded.push(m);
          
          continue;
        }
        
        Voc.loadModel(m, sUri, superName);
      }
      
      return unloaded;
    },

    getEnumsFromLS: function() {
      return G.localStorage.get('enumerations');
    },

    storeEnumsInLS: function(enums) {
      setTimeout(function() {
        G.localStorage.putAsync('enumerations', JSON.stringify(enums));
      }, 100);
    },

    getModelFromLS: function(uri) {
      return G.localStorage.get('model:' + uri);
    },

    storeModel: function(modelJson) {
      setTimeout(function() {
        var type = modelJson.type;
        G.localStorage.putAsync('model:' + type, JSON.stringify(modelJson));
        U.pushUniq(G.storedModelTypes, type);
      }, 100);
    },

    detectCurrentModel: function() {
      var hash =  window.location.hash && window.location.hash.slice(1);
      if (!hash)
        return;
      
      var qIdx = hash.indexOf('?');
      if (qIdx != -1)
        hash = hash.slice(0, qIdx);
      
      hash = decodeURIComponent(hash);
      var type;
      var route = hash.match('^view|menu|edit|make|chooser');
      if (route) {
        route = route[0].length;
        var sqlIdx = hash.indexOf(G.sqlUri);
        if (sqlIdx == -1)
          type = hash.slice(route + 1);
        else
          type = 'http://' + hash.slice(sqlIdx + G.sqlUri.length + 1);
        
        qIdx = type.indexOf('?');
        if (qIdx != -1)
          type = type.slice(0, qIdx);
      }
      else
        type = hash;

      if (type === 'profile')
        return (G.currentUser.guest ? null : G.currentUser.type._uri);
            
      type = type.startsWith('http://') ? type : G.defaultVocPath + type;
      Voc.currentModel = type;
    },
    
    loadEnums: function() {
      var enums = Voc.getEnumsFromLS();
      if (!enums)
        return;
      
      enums = JSON.parse(enums);
      for (var type in enums) {
        Voc.initModel(Backbone.Model.extend({}, enums[type]));
      }
    },
    
    loadStoredModels: function(options) {
      Voc.detectCurrentModel();
      G.storedModelTypes = _.size(G.storedModelTypes) ? G.storedModelTypes : _.map(_.filter(_.keys(localStorage), function(m) {return m.startsWith('model:')}), function(m) {return m.slice(6)});
      if (G.userChanged) {
        if (options && options.models)
          Voc.changedModels = U.getObjectType(options.models) === '[object String]' ? [options.models] : options.models;
        if (Voc.currentModel)
          U.pushUniq(Voc.changedModels, Voc.currentModel);
        return;
      }

      // for easy lookup by type
      if (!_.size(G.modelsMetadataMap)) {
        G.modelsMetadataMap = {};
        for (var i = 0; i < G.modelsMetadata.length; i++) {
          var m = G.modelsMetadata[i];
          G.modelsMetadataMap[m.type] = m;
        }
      }
      
      var r = {models: _.clone(options && options.models || G.modelsMetadata)};
      for (var i = 0; i < G.linkedModelsMetadata.length; i++) {
        var m = G.linkedModelsMetadata[i];
        if (G.modelsMetadataMap[m.type])
          continue;
        
        G.modelsMetadataMap[m.type] = m;
        m.type = U.getLongUri1(m.type);
        U.pushUniq(G.modelsMetadata, m);
      }
      
      var models = r.models;
      var added = Voc.currentModel;
      if (added && !G.typeToModel[added] && !_.filter(models, function(m) {return (m.type || m).endsWith(added)}).length) {
        models.push(added);
//        U.pushUniq(Voc.newModels, added); // We can't know whether it's been changed on the server or not, so we have to call to find out
        U.pushUniq(Voc.changedModels, added);
      }

      if (!G.hasLocalStorage) {
        if (r) {
          _.forEach(models, function(model) {
            G.log(Voc.TAG, 'db', "1. newModel: " + model);
//            U.pushUniq(Voc.newModels, model);
            U.pushUniq(Voc.changedModels, model);
          });
        }
        
        return; // TODO: use indexedDB
      }
      
      if (!_.size(G.shortNameToEnum))
        Voc.loadEnums();
      
      var modelsMap = {};
      for (var i = 0; i < models.length; i++) {
        var m = models[i];
        if (typeof m === 'string')
          modelsMap[m] = models[i] = {type: U.getLongUri1(m)};
        else {
          var type = m.type = U.getLongUri1(m.type);
          modelsMap[type] = models[i] = m;
        }
      }

      var extraModels;
      var typeToJSON = {};
      var expanded = [];
      for (var i = models.length - 1; i > -1; i--) {
        var model = models[i];
        var uri = model.type;
        if (typeToJSON[uri] || G.typeToModel[uri])
          continue;
        
        var jm;
        if (model._dateStored)
          jm = model;
        else {
          jm = Voc.getModelFromLS(uri);
          if (!jm) {
//            U.pushUniq(Voc.newModels, uri);
            U.pushUniq(Voc.changedModels, uri);
            continue;
          }
        
          var meta = G.modelsMetadataMap[uri];
          if (meta)
            meta.stored = true;
          
          jm = JSON.parse(jm);
        }
        
        if (jm) {
          var chain = Voc.getModelChain(jm, typeToJSON);
          if (chain) {
            for (var j = 0; j < chain.length; j++) {
              var m = chain[j];
              var info = G.modelsMetadataMap[m.type];
              if (!info) {
                G.oldModelsMetadataMap[m.type] = {lastModified: m.lastModified, superName: m.superName, type: m.type};
                delete m.lastModified; // can't trust this date, as it's not up to date
                continue;
              }
              
              info && _.extend(m, info);
            }
            
            expanded = expanded.concat(chain);
          }
          else {
//            Voc.newModels.push(jm.type);
            U.pushUniq(Voc.changedModels, jm.type);
          }
        }
      }
      
      delete typeToJSON;
      
      var stale = []
      var fresh = [];
      Voc.filterExpired(expanded, fresh, stale);
      _.each(stale, function(s) {
        U.pushUniq(Voc.changedModels, s)
      });
      
      if (fresh.length) {
        var unloaded = Voc.initStoredModels(fresh);
        _.each(unloaded, function (m) {
          debugger;
          U.pushUniq(Voc.changedModels, m.type);
        });
      }
    },
    
    filterExpired: function(models, fresh, stale) {
      var baseDate = G.lastModified;
      _.each(models, function(model) {
        var date = typeof model.lastModified === 'undefined' ? model.lastModified : Math.max(baseDate, model.lastModified);
        var storedDate = model._dateStored;
        if (date && storedDate && storedDate >= date) {
          fresh.push(model);
          return;
        }
        
        U.pushUniq(stale, model.type);
        return;
      });
    }
  };
  
  Voc.snm = G.shortNameToModel;
  return (G.Voc = Voc);
});