define([
  'globals',
  'cache!underscore',
  'cache!backbone',
  'cache!templates'
], function(G, _, Backbone, Templates) {
  var ArrayProto = Array.prototype;
  var slice = ArrayProto.slice;

  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
  
  String.prototype.repeat = function(num) {
    return new Array(num + 1).join(this);
  }

  String.prototype.trim = function(){
    return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, ""));
  };
  
  String.prototype.startsWith = function(str) {
    return (this.match("^"+str)==str);
  };
  
  String.prototype.camelize = function(capitalFirst) {
    return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return capitalFirst || index != 0 ? letter.toUpperCase() : letter.toLowerCase();
    }).replace(/\s+/g, '');
  };

  String.prototype.uncamelize = function(capitalFirst) {
    var str = this.replace(/[A-Z]/g, ' $&').toLowerCase();
    return capitalFirst ? str.slice(0, 1).toUpperCase() + str.slice(1) : str; 
  };

  String.prototype.endsWith = function(str) {
    return (this.match(str+"$")==str);
  };
  // extends jQuery to check if selected collection is empty or not
  $.fn.exist = function(){
    return this.length > 0 ? this : false;
  };

  var U = {
    TAG: 'Utils',    
    isPropVisible: function(res, prop, userRole) {
      if (prop.avoidDisplaying || prop.avoidDisplayingInControlPanel || prop.virtual || prop.propertyGroupList)
        return false;
      
      userRole = userRole || U.getUserRole();
      if (userRole == 'admin')
        return true;
      
      var ar = prop.allowRoles;
      return ar ? U.isUserInRole(userRole, ar, res) : true;
    },

    getUserRole: function() {
      return G.currentUser.guest ? 'guest' : G.currentUser.role || 'contact';
    },
    
    isUserInRole: function(userRole, ar, res) {
      if (userRole == 'guest')
        return false;
      
      var vocModel = res && res.constructor;
      var me = G.currentUser._uri;
      var resUri = res.get('_uri');
      var iAmRes = me === resUri;
      var roles = typeof ar === 'array' ? ar : ar.split(",");
      for (var i = 0; i < roles.length; i++) {
        var r = roles[i].trim();
        if (_.contains(['admin', 'siteOwner'], r)) {
          if (userRole == r) return true;
        }
        else if (r === 'owner') {
          continue; // TODO: implement this
        }
        else {
          if (r === 'self') { 
            if (iAmRes) return true;
          }
          else if (r.endsWith('self')){
            r = r.split('==');
            var pName = r[0];
            var selfUser = res.get(pName);
            if (me == selfUser) 
              return true;
//            if (!resUri) { // is MKRESOURCE
              var cloneOf = vocModel.properties[pName].cloneOf;
              if (cloneOf) {
                cloneOf = cloneOf.split(',');
                for (var i = 0; i < cloneOf.length; i++) {
                  if (cloneOf[i] === 'Submission.submittedBy')
                    return true;
                }
              }
//            }
          }
          
          // TODO: implement this          
        }
      }
      
      return false;
    },
    
    isPropEditable: function(res, prop, userRole) {
      if (prop.avoidDisplaying || prop.avoidDisplayingInControlPanel || prop.readOnly || prop.virtual || prop.propertyGroupList)
        return false;
      
      var resExists = !!res.get('_uri');
      if (resExists) { 
        if (prop.primary || prop.avoidDisplayingInEdit || prop.immutable)
          return false;
      }
      else {
        if (prop.avoidDisplayingOnCreate)
          return false;
      }

      userRole = userRole || U.getUserRole();
      if (userRole == 'admin')
        return true;
      
      var ar = prop.allowRolesToEdit;
      return ar ? U.isUserInRole(userRole, ar, res) : true;
    },
    
//    getSortProps: function(model) {
//      var meta = this.model.__proto__.constructor.properties;
//      meta = meta || this.model.properties;
//      if (!meta)
//        return null;
//      
//      var list = _.toArray(meta);
//      return U.getPropertiesWith(list, "sortAscending");
//    },
//
    getFirstUppercaseCharIdx: function(str) {
    	for (var i = 0; i < str.length; i++) {
    		var c = str.charAt(i);
    		if (c.search(/^[a-z]+$/i) == 0 && c == c.toUpperCase())
    			return i;
    	}
    	
    	return -1;
    },
    
    getPrimaryKeys: function(model) {
      var keys = [];
      for (var p in model.myProperties) {
        if (_.has(model.myProperties[p], 'primary'))
          keys.push(p);
      }
      
      return keys;
    },
    
    getCloneOf: function(meta, cloneOf) {
      var keys = [];
      for (var p in meta) {
        if (_.has(meta[p], "cloneOf")) {
          var clones = meta[p].cloneOf.split(",");
          for (var i=0; i<clones.length; i++) {
            if (clones[i].replace(' ', '') == cloneOf) { 
              keys.push(p);
              break;
            }
          }
        }
      }
      
      return keys;
    },
    
    getLongUri: function(uri, hint) {
      var type, pk, snm;
      if (hint) {
        type = hint.type;
        pk = hint.primaryKeys;
        snm = hint.shortNameToModel;
      }
      
//      var pattern1 = \Qhttp:\/\/\E?(.*)\Q\/sql\/\E?();
//      uri.match(\Qhttp:\/\/\E?([^/]+))
      
      var serverName = G.serverName;
      var sqlUri = G.sqlUri;
      if (uri.indexOf('http') == 0) {
        // uri is either already of the right form: http://urbien.com/sql/www.hudsonfog.com/voc/commerce/trees/Tree?id=32000 or of form http://www.hudsonfog.com/voc/commerce/trees/Tree?id=32000
        if (uri.indexOf('?') == -1) // type uri
          return uri;
        
        if (uri.indexOf(serverName + "/" + sqlUri) == 0)
          return uri;
        
        type = typeof type == 'undefined' ? U.getTypeUri(uri, hint) : type;
        return uri.indexOf("http://www.hudsonfog.com") == -1 ? uri : serverName + "/" + sqlUri + "/" + type.slice(7) + uri.slice(uri.indexOf("?"));
      }
      
      var sIdx = uri.indexOf('/');
      var qIdx = uri.indexOf('?');
      if (sIdx === -1) {
        // uri is of form Tree?id=32000 or just Tree
        type = !type || type.indexOf('/') == -1 ? U.getTypeUri(uri, hint) : type;
        if (!type)
          return null;
        
        return U.getLongUri(type + (qIdx == -1 ? '' : uri.slice(qIdx)), {type: type});
      }
      
      if (uri.indexOf('sql') == 0) {
        // uri is of form sql/www.hudsonfog.com/voc/commerce/trees/Tree?id=32000
        return serverName + "/" + uri;
      }
      else if (uri.charAt(0).toUpperCase() == uri.charAt(0)) {
        // uri is of form Tree/32000
        var typeName = U.getClassName(uri);
        type = U.getTypeUri(typeName, hint);
        if (!type || type == typeName)
          return null;
        
        var sIdx = uri.indexOf("/");
        var longUri = uri.slice(0, sIdx) + "?";
        var primaryKeys = hint.primaryKeys || (snm && snm[typeName] && U.getPrimaryKeys([typeName]));
//        var model = snm[typeName];
//        if (!model)
//          return uri;
//        
//        var primaryKeys = U.getPrimaryKeys(model);
        if (!primaryKeys  ||  primaryKeys.length == 0)
          longUri += "id=" + U.encode(uri.slice(sIdx + 1));
        else {
          var vals = uri.slice(sIdx + 1).split('/');
          if (vals.length != primaryKeys.length)
            throw new Error('bad uri "' + uri + '" for type "' + type + '"');
          
          for (var i = 0; i < primaryKeys.length; i++) {
            longUri += primaryKeys[i] + "=" + vals[i]; // shortUri primary keys are already encoded
          }      
        }
        
        return U.getLongUri(longUri, {type: type});
      }
      else {
        // uri is of form commerce/urbien/Tree or commerce/urbien/Tree?...
        return qIdx === -1 ? G.defaultVocPath + uri : G.sqlUrl + '/www.hudsonfog.com/voc/' + uri;
      }
    },

    phoneRegex: /^(\+?\d{0,3})\s*((\(\d{3}\)|\d{3})\s*)?\d{3}(-{0,1}|\s{0,1})\d{2}(-{0,1}|\s{0,1})\d{2}$/,
    validatePhone: function(phone) {
      return U.phoneRegex.test(phone);
    },
    
    validateZip: function(zip) {
      return /^\d{5}|\d{5}-\d{4}$/.test(zip);
    },
    
    validateEmail: function(email) { 
      return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test( email );
    },
    
    getTypeUri: function(typeName, hint) {
      if (typeName.indexOf('/') != -1) {
        var type = typeName.startsWith('http://') ? typeName : G.defaultVocPath + typeName;
        if (type.startsWith(G.sqlUrl))
          type = 'http://' + type.slice(G.sqlUrl.length + 1);
        
        var qIdx = type.indexOf('?');
        return qIdx == -1 ? type : type.slice(0, qIdx);
      }
      else
        return hint.type || hint.shortNameToModel[typeName] && hint.shortNameToModel[typeName].type;
    },
    
    getClassName: function(uri) {
      if (uri.startsWith(G.apiUrl))
        uri = decodeURIComponent(uri.slice(G.apiUrl.length));
      var qIdx = uri.indexOf("?");
      if (qIdx != -1) {
        if (uri.indexOf('http://') == 0)
          return uri.slice(uri.lastIndexOf("/", qIdx) + 1, qIdx);
        else
          return uri.slice(0, qIdx);
      }
      var slashIdx = uri.lastIndexOf("/");
      if (slashIdx != -1)
        return uri.slice(slashIdx + 1);
      var idx = U.getFirstUppercaseCharIdx(uri);
      if (idx == -1)
        return null;
        
      var end = uri.slice(idx).search(/[^a-zA-Z]/);
      return end == -1 ? uri.slice(idx) : uri.slice(idx, idx + end);
    },
    
//    getClassName: function(type) {
//      var sIdx = type.lastIndexOf("/");
//      return sIdx == -1 ? type : type.slice(sIdx + 1);
//    },
    
    getShortUri: function(uri, model) {
      if (model.myProperties._shortUri == 'unsupported')
        return uri;
        
      var regex = /www\.hudsonfog\.com\/[a-zA-Z\/]*\/([a-zA-Z]*)\?id=([0-9]*)/;
      var nameAndId = uri.match(regex);
      return nameAndId && nameAndId.length == 3 ? nameAndId[1] + '/' + nameAndId[2] : uri;
    },
    
    isA: function(model, interfaceName) {
      return _.contains(model.interfaces, interfaceName);
    },
    
    getPackagePath: function(type) {
      if (type == 'Resource' || type.endsWith('#Resource'))
        return 'packages';
      
      var start = "http://www.";
      var path = type.startsWith(start) ? type.slice(start.length, type.lastIndexOf("/")) : !type.startsWith('hudsonfog') ? 'hudsonfog/voc/' + type : type;
      path = path.replace(".com", "");
      path = path.replace(/\//g, '.');
      var lastDIdx = path.lastIndexOf('.');
      var c = path.charAt(lastDIdx + 1);
      if (c == c.toUpperCase())
        path = path.slice(0, lastDIdx);
        
      return 'packages.' + path;
    },
    
    addPackage: function(packages, path) {
      path = path.split(/\./);
      var current = packages;
      path = path[0] == 'packages' ? path.slice(1) : path;
      for (var i = 0; i < path.length; i++) {
        if (!_.has(current, path[i])) {
          var pkg = {};
          current[path[i]] = pkg;
          current = pkg;
        }
        else
          current = current[path[i]];
      }
      
      return current;
    },
    
    getObjectType: function(o) {
      return Object.prototype.toString.call(o);
    },
    
    getColorCoding: function(cc, val) {
    //  getting the color for value. Sample colorCoding annotation: @colorCoding("0-2000 #FF0054; 2000-6000 #c8fd6a; 6001-1000000 #00cc64")
      val = val.replace(',', '');
      var v = parseFloat(val);
      cc = cc.split(';');
      for (var i = 0; i < cc.length; i++) {
        var r2c = cc[i].trim();
        r2c = r2c.split(/[ ]/);
        var r = r2c[0].split(/[-]/);
        r[1] = parseFloat(r[1]);
        if (v > r[1])
          continue;
        
        if (v > parseFloat(r[0]))
          return r2c[1];
      }
      
      return null;
    },
    
    
    getGridCols: function(model, typeOfCols) {
      var m = model;
      var mConstructor = m.constructor;
      var cols = typeOfCols ? mConstructor[typeOfCols] : mConstructor.gridCols;
      cols = cols && cols.split(',');
      var resourceLink;
      var rows = {};
      var i = 0;
      if (cols) {
        _.each(cols, function (col) {
          col = col.trim();
          var prop = mConstructor.properties[col];
          if (!prop)
            return;
          var val = m.get(col);
          if (!val) {
            var pGr = prop.propertyGroupList;
            if (pGr) {
              var s = prop.label || prop.displayName;
              var nameVal = {name: s, value: pGr};
              rows[nameVal.name] = {value : nameVal.value};  
              rows[nameVal.name].propertyName = col;  
              rows[nameVal.name].idx = i++;
            }
            return;
          }
          var nameVal = U.makeProp(prop, val);
          rows[nameVal.name] = {value: nameVal.value};
          rows[nameVal.name].idx = i++;
          rows[nameVal.name].propertyName = col;
          if (prop.resourceLink)
            rows[nameVal.name].resourceLink = true;
    //        resourceLink = nameVal.value;
    //      else
        });
      }  
      
      return i == 0 ? null : rows;
    },
    
    isMasonry: function(vocModel) {
      var meta = vocModel.properties;
      var isMasonry = U.isA(vocModel, 'ImageResource')  &&  (U.getCloneOf(meta, 'ImageResource.mediumImage').length > 0 || U.getCloneOf(meta, 'ImageResource.bigMediumImage').length > 0  ||  U.getCloneOf(meta, 'ImageResource.bigImage').length > 0);
      if (!isMasonry  &&  U.isA(vocModel, 'Reference') &&  U.isA(vocModel, 'ImageResource'))
        return true;
      if (!U.isA(vocModel, 'Intersection')) 
        return isMasonry;
      var href = window.location.href;
      var qidx = href.indexOf('?');
      var a = U.getCloneOf(meta, 'Intersection.a')[0];
      if (qidx == -1) {
        isMasonry = (U.getCloneOf(meta, 'Intersection.aThumb')[0]  ||  U.getCloneOf(meta, 'Intersection.aFeatured')[0]) != null;
      }
      else {
        var b = U.getCloneOf(meta, 'Intersection.b')[0];
        var p = href.substring(qidx + 1).split('=')[0];
        var delegateTo = (p == a) ? b : a;
        isMasonry = (U.getCloneOf(meta, 'Intersection.bThumb')[0]  ||  U.getCloneOf(meta, 'Intersection.bFeatured')[0]) != null;
      }
      return isMasonry;
    },
    /**
     * to be used for model constructors, not instances
     */
    
    defaultModelProps: ['__super__', 'prototype', 'extend'],
    toJSON: function(obj) {
      var staticProps = {};
      for (var prop in obj) {
        if (typeof obj[prop] != 'function' && _.has(obj, prop) && !_.contains(U.defaultModelProps, prop)) {
          var o = obj[prop];
          staticProps[prop] = typeof o == 'object' ? U.toJSON(o) : o;
        }
      }
      
      return staticProps;
    },
    
//    wrap: function(object, method, wrapper) {
//      var fn = object[method];
//      return object[method] = function() {
//        return wrapper.apply(this, [ fn.bind(this) ].concat(slice.call(arguments)));
//      };
//    },
    
    /**
     * Array that stores only unique elements
     */
//    UArray: function() {
//    //  this.handlers = {};
//    //  this.on = function(method, handler) {
//    //    this.handlers[method] = this.handlers[method] || [];
//    //    this.handlers[method].push(handler);
//    //  };
//    //  this.removeHandler = function(method, handler) {
//    //    return this.handlers[method] && this.handlers[method].remove(handler);
//    //  };
//    //  this.handler = function(method) { 
//    //    if (this.handlers[method] && this.handlers[method].length) {
//    //      _.each(this.handlers[method], function(m) {m()});
//    //    }
//    //  };
//    },
//    
//    union: function(o1) {
//      var type1 = U.getObjectType(o1);
//      var args = slice.call(arguments, 1);
//      for (var i = 0; i < args.length; i++) {
//        var o2 = args[i];
//        var type2 = U.getObjectType(o2);
//          
//        var c = type1.indexOf('Array') == -1 && !(o1 instanceof U.UArray) ? [c] : o1.slice();    
//        if (type2.indexOf('Array') == -1 && !(o2 instanceof U.UArray))
//          return c.push(o2);
//        
//        var self = this;
//        _.each(o2, function(i) {c.push(i);});
//      }
//      return c;
//    },   

    endsWith: function(string, pattern) {
      var d = string.length - pattern.length;
      return d >= 0 && string.indexOf(pattern, d) === d;
    },
    
    //U.toQueryString: function(queryMap) {
    //  var qStr = '';
    //  _.forEach(queryMap, function(val, key) { // yes, it's backwards, not function(key, val), underscore does it like this for some reason
    //    qStr += key + '=' + U.encode(val) + '&';
    //  });
    //  
    //  return qStr.slice(0, qStr.length - 1);
    //};
    
    replaceParam: function(url, name, value, sort) {
      if (!url)
        return name + '=' + U.encode(value);
      
      url = url.split('?');
      var qs = url.length > 1 ? url[1] : url[0];
      var q = U.getQueryParams(qs);
      q[name] = value;
      q = sort ? U.getQueryString(q, sort) : $.param(q);
      return url.length == 1 ? q : [url[0], q].join('?');
    },
    
    /**
     * @return if getQueryParams(url), return map of query params, 
     *         if getQueryParams(url, model), return map of query params that are model properties
     *         if getQueryParams(queryMap, model), return filtered map of query params that are model properties
     *         if getQueryParams(collection), return map of query params from collection.queryMap that correspond to collection's model's properties
     */
    getQueryParams: function() {
      var args = arguments;
      var model = collection = qMap = url = args.length && args[0];
      if (!url || typeof url === 'string') {
        qMap = U.getParamMap(url || window.location.href);
        return args.length > 1 ? U.getQueryParams(qMap, slice.call(args, 1)) : qMap;
      }

      if (model instanceof Backbone.Collection) { // if it's a collection
        qMap = collection.queryMap;
        model = collection.model;
      }
      else if (model instanceof Backbone.Model) {
        return {};
      }
      else {
        if (args.length > 1)
          model = typeof args[1] === 'function' ? args[1] : args[1].constructor;
        else {
          return U.filterObj(qMap, function(name, val) {
            return name.match(/^[a-zA-Z]+/);
          });
//          throw new Error('missing parameter "model"');
        }
      }
      
      var filtered = {};
      for (var p in qMap) {
        if (model.properties[p])
          filtered[p] = qMap[p];
      }
  
      return filtered;
    },
    
    getHashParams: function() {
      var h = window.location.href;
      var hashIdx = h.indexOf('#');
      if (hashIdx === -1) 
        return {};
      
      var chopIdx = h.indexOf('?', hashIdx);
      if (chopIdx == -1)
        return {};
        
      return h ? U.getParamMap(h.slice(chopIdx + 1)) : {};
    },
    
    getParamMap: function(str, delimiter) {
      var qIdx = str.indexOf('?');
      if (qIdx != -1)
        str = str.slice(qIdx + 1);
        
      var map = {};
      _.each(str.split(delimiter || "&"), function(nv) {
        nv = nv.split("=");
        map[U.decode(nv[0])] = U.decode(nv[1]);
      });
      
      return map;
    },
    
//    getPropertiesWith: function(list, annotation) {
//      return _.filter(list, function(item) {
//        return item[annotation] ? item : null;
//      });
//    },
    
    getPropertiesWith: function(props, annotation, returnArray) {
      var filtered = U.filterObj(props, function(name, value) {
        return props[name][annotation];
      });
      
      return returnArray ? _.toArray(filtered) : filtered;
    },
    
    getDisplayNameProps: function(meta) {
      var keys = [];
      for (var p in meta) {
        if (_.has(meta[p], "displayNameElm")) 
          keys.push(p);
      }
      return keys;
    },
    
    getDisplayName: function(resource, meta) {
      var vocModel = resource.vocModel;
      if (!meta) 
        meta = vocModel.properties;
      
      var dnProps = U.getDisplayNameProps(meta);
      var dn = '';
      if (!dnProps  ||  dnProps.length == 0) {
        var uri = resource.get('_uri');
        if (!uri)
          return vocModel.displayName;
        var s = uri.split('?');
        s = decodeURIComponent(s[1]).split('&');
        for (var i=0; i<s.length; i++) {
          if (i)
            dn += ' ';
          dn += s[i].split('=')[1]; 
        }
        return dn;
      }
      var first = true;
      for (var i=0; i<dnProps.length; i++) {
        var value = resource.get(dnProps[i]);
        if (value  &&  typeof value != 'undefined') {
          if (first)
            first = false;
          else
            dn += ' ';
          dn += (value.displayName) ? value.displayName : value;
        }
      }
      
      return dn || vocModel.displayName;
    },

    getTypeTemplate: function(id, resource) {
      var t = G.template;
      if (!t) 
        return null;
      
      var vocModel = resource.vocModel;
      var dataType = vocModel.shortName; 
      
      var appTemplates = Templates.get(G.appName);
      if (!appTemplates) {
        var elts = $('script[type="text/template"]', $(t));
        appTemplates = {};
        for (var i = 0; i < elts.length; i++) 
          appTemplates[$(elts[i]).attr('data-type') + '-' + elts[i].id] = elts[i].innerHTML;

        Templates.templates[G.appName] = appTemplates;
      } 
      
      var key = dataType + '-' + id;
      var tmpl = appTemplates[key];
      return (tmpl) ? _.template(tmpl) : null;
    },
    /// String prototype extensions
    
    getQueryString: function(paramMap, sort) {
      if (!sort)
        return $.param(paramMap);
      
      var keys = [];
      for (var p in paramMap) {
        if (typeof paramMap[p] !== 'undefined') {
          keys.push(p);
        }
      }
      
      var qs = '';
      keys.sort();
      for (i = 0; i < keys.length; i++) {
        keys[i] = keys[i] + '=' + U.encode(paramMap[keys[i]]);
      }
      
      return keys.join('&');
    },
    
    getFormattedDate: function(time) {
//      var date = new Date(parseFloat(time));
      //(time || "").replace(/-/g,"/").replace(/[TZ]/g," "));
      var now = G.currentServerTime();
      var diff = ((now - parseFloat(time)) / 1000);
      var day_diff = Math.floor(diff / 86400);
          
      if (isNaN(day_diff) || day_diff < 0) // || day_diff >= 31)
        return null;
          
      if (day_diff == 0) {
        return (diff < 60 && "just now" ||
                diff < 120 && "a minute ago" ||
                diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
                diff < 7200 && "an hour ago" ||
                diff < 86400 && Math.floor( diff / 3600 ) + " hours ago");
      }
      else if (day_diff == 1)
        return "Yesterday";
      else  if (day_diff < 7) 
        return (day_diff == 1) ? "a day ago" : day_diff + " days ago"; 
      else if (day_diff < 365) {
        var w = Math.round( day_diff / 7 );
        return (w == 1) ? "a week ago" : w + " weeks ago";
      }
      else {
        var years = Math.round( day_diff / 365 );
        var rest = (day_diff % 365);
        var date = '';
        if (years == 1)
          date += 'a year';
        else
          date += years + " years";
        return (rest == 0) ? date + ' ago' : date + ' and ' + U.getFormattedDate(now - (rest * 86400 * 1000));  
      }
//      var years;
//      return day_diff == 0 && (
//        diff < 60 && "just now" ||
//        diff < 120 && "a minute ago" ||
//        diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
//        diff < 7200 && "an hour ago" ||
//        diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
//        day_diff == 1 && "Yesterday" ||
//        day_diff < 7 && day_diff + " days ago" ||
//        day_diff < 365 && Math.round( day_diff / 7 ) + " weeks ago" || 
//        day_diff > 365 && (years = Math.round( day_diff / 365 )) + " years and " + U.getFormattedDate(now + (day_diff % 365));  
    },
    
    toHTMLElement: function(html) {
      return $(html)[0];
    },
    
    getShortName: function(uri) {
      return uri.slice(uri.lastIndexOf('/') + 1); // if lastIndexOf is -1, return original string
    },
    
    addToFrag: function(frag, html) {
      frag.appendChild(U.toHTMLElement(html));
    },
    
    getUris: function(data) {
      return _.map(data instanceof Backbone.Collection ? data.models : [data], function(m) {return m.get('_uri')});
    },
    
    isCollection: function(resOrCol) {
      return resOrCol instanceof Backbone.Collection;
    },
    
    getModel: function(resOrCol) {
      return U.isCollection(resOrCol) ? resOrCol.model : resOrCol.constructor;
    },
    
    hasImages: function(resOrCol) {
      var isCol = U.isCollection(resOrCol);
      var models = isCol ? resOrCol.models : [resOrCol];
      if (!models.length)
        return false;
      
      var vocModel = U.getModel(resOrCol);
      var meta = vocModel.properties;
      var cloneOf;
      var hasImgs = this.isA(vocModel, 'ImageResource')  &&  meta != null  &&  (cloneOf = U.getCloneOf(meta, 'ImageResource.mediumImage')).length != 0;
      if (!hasImgs)
        return false;
      
      hasImgs = false;
      for (var i = 0; !hasImgs  &&  i < models.length; i++) {
        var m = models[i];
        if (m.get(cloneOf))
          hasImgs = true;
      }
      
      return hasImgs;
    },
    
    deepExtend: function(obj) {
      _.each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          if (obj[prop])
            U.deepExtend(obj[prop], source[prop]);
          else
            obj[prop] = source[prop] || obj[prop];
        }
      });
    },
    /**
     * given obj and path x.y.z, will return obj.x.y.z; 
     */
    leaf: function(obj, path, separator) {
      if (typeof obj == 'undefined' || !obj)
        return null; 
     
      separator = separator || '.';
      var dIdx = path.indexOf(separator);
      return dIdx == -1 ? obj[path] : U.leaf(obj[path.slice(0, dIdx)], path.slice(dIdx + separator.length), separator);
    },
    
    getPropDisplayName: function(prop) {
      return prop.displayName || prop.label || prop.shortName.uncamelize(true);
    },
    
    isAssignableFrom: function(model, className, type2Model) {
      if (U.isA(model, className))
        return true;
//      var type2Model = G.typeToModel;
      var m = model;
      while (true) {
        var subClassOf = m.subClassOf;
        if (!subClassOf.startsWith(G.DEFAULT_VOC_BASE))
          subClassOf = G.DEFAULT_VOC_BASE + subClassOf;
        
        if (m.shortName == className  ||  m.type == className)
          return true;
        if (m.subClassOf == 'Resource')
          return false;
        m = type2Model[subClassOf];
      }
      return false;
    },

    makeProp: function(prop, val) {
      var cc = prop.colorCoding;
      if (cc) {
        cc = U.getColorCoding(cc, val);
        if (cc) {
          if (cc.startsWith("icons"))
            val = "<img src=\"" + cc + "\" border=0>&#160;" + val;
          else
            val = "<span style='color:" + cc + "'>" + val + "</span>";
        }
      }
      
      var propTemplate = Templates.getPropTemplate(prop);
      val = typeof val === 'undefined' || val == null ? '' : val.displayName ? val : {value: val}; 
      return {name: U.getPropDisplayName(prop), value: _.template(Templates.get(propTemplate))(val)};
    },
    
    makeEditProp: function(prop, val, formId) {
      var propTemplate = Templates.getPropTemplate(prop, true);
      val = typeof val === 'undefined' ? {} : val.displayName ? val : {value: val};
      if (propTemplate === 'enumPET') {
        var facet = prop.facet;
        facet = facet.slice(facet.lastIndexOf('/') + 1);
        val.options = G.Voc.shortNameToEnum[facet].values;
      }
      
      val.value = val.value || null;
      val.name = U.getPropDisplayName(prop);
      val.shortName = prop.shortName;
      val.id = (formId || G.nextId()) + '.' + prop.shortName;
      val.prop = prop;
//      val.comment = prop.comment;
      var facet = prop.facet;
      if (facet) {
        if (facet.endsWith('emailAddress'))
          val.type = 'email';
        else if (facet.toLowerCase().endsWith('phone'))
          val.type = 'tel';
      }
      
      var classes = [];
      var rules = {};
      if (prop.required) {
        classes.push('required');
        rules.required = 'required';
      }
      if (prop.maxSize)
        rules.maxlength = prop.maxSize;
      
      val.classes = classes.join(' ');
      val.rules = U.reduceObj(rules, function(memo, name, val) {return memo + ' {0}="{1}"'.format(name, val)}, '');
      
      return {value: _.template(Templates.get(propTemplate))(val), comment: prop.comment};
    },
    
    reduceObj: function(obj, func, memo, context) {
      var initial = arguments.length > 2;
      _.each(_.keys(obj), function(name, index, list) {
        if (!initial) {
          memo = func(name, obj[name]);
          initial = true;
        } else {
          memo = func.call(context, memo, name, obj[name], index, list);
        }
      });
      
      return memo;
    },
    
//    /**
//     * build view/list/etc. hash for model, defaults to homePage if model is null
//     */
//    buildHash: function(model) {
//      return model instanceof Backbone.Model ? 'view/' + U.encode(model.get('_uri')) : model instanceof Backbone.Collection ? model.model.shortName : G.homePage;
//    },
    
    apiParamMap: {'-asc': '$asc', '$order': '$orderBy', '-limit': '$limit', 'recNmb': '$offset'},
    paramsToSkip: ['hideFltr'],
    getMobileUrl: function(url) {
      var orgParams = U.getQueryParams(url);
      if (url.startsWith('v.html'))
        return 'view/' + U.encode(U.getLongUri(orgParams.uri));
      
      // sample: l.html?-asc=-1&-limit=1000&%24order=regular&-layer=regular&-file=/l.html&-map=y&type=http://www.hudsonfog.com/voc/commerce/urbien/GasStation&-%24action=searchLocal&.regular=&.regular=%3e2000
      var type = orgParams.type;
//      type = type.startsWith(G.defaultVocPath) ? type.slice(G.defaultVocPath.length) : type;
      delete orgParams.type;
      var ignoredParams = '';
      var params = {};
      _.forEach(_.keys(orgParams), function(p) {
        if (_.contains(U.paramsToSkip, p))
          return;
        
        var apiParam = U.apiParamMap[p];
        if (typeof apiParam !== 'undefined') {
          var val = orgParams[p];
          if (apiParam == '$limit')
            val = Math.max(parseInt(val, 10), 50);
          
          params[apiParam] = val;
          return;
        }
        
        if (p.startsWith('-')) {
          ignoredParams += p + ',';
          return;
        }
        
        var val = orgParams[p];
        if (typeof val === 'undefined' || val === '')
          return;
        
        var matches = p.match(/^\.?([a-zA-Z_]+)(_select|_To|_From)$/);
        if (matches && matches.length > 1) {
          var pType = matches.length >=3 ? matches[2] : null;
          if (pType) {
            if (pType == '_From')
              val = '>=' + val; // to make the query string look like "start=>=today", with <=today encoded of course            
            else if (pType == '_To')
              val = '<=' + val; // to make the query string look like "end=<=today", with <=today encoded of course
          }
          
          params[matches[1]] = val;
        }
        else {
          if (!p.match(/^[a-zA-Z]/) || p.endsWith('_verified')) // starts with a letter
            return;
          
          params[p] = val;
        }
      });
      
      if (ignoredParams)
        console.log('ignoring url parameters during regular to mobile url conversion: ' + ignoredParams);
      
      return encodeURIComponent(type) + (_.size(params) ? '?' + $.param(params) : '');
    },
    
    pushUniq: function(arr, obj) {
      if (!_.contains(arr, obj))
        arr.push(obj);
    },
    
    encode: function(str) {
      return encodeURIComponent(str);
    },
    
    decode: function(str) {
      return decodeURIComponent(str).replace(/\+/g, ' ');
    },
    
    primitiveTypes: {uri: 'system/primitiveTypes', floats: ['float', 'double', 'Percent', 'm', 'm2', 'km', 'km2'], ints: ['int', 'long', 'Duration']},
    getTypedValue: function(model, prop, value) {
      if (model.collection)
        model = model.constructor;
      else if (model.models)
        model = model.model;
      
      var p = U.primitiveTypes;
      var prop = model.properties[prop];
      var range = prop.range || prop.facet;
      if (p.floats.indexOf('range') != -1)
        return parseFloat(value);
      else if (p.ints.indexOf('range') != -1)
        return parseInt(value);
      else if (range.startsWith(p.uri)) {
        range = range.slice(pt.length + 1);
        if (p.floats.indexOf(range) != -1)
          return parseFloat(value);
        else if (p.ints.indexOf(range) != -1)
          return parseInt(value);
        else
          return value;        
      }
      
      if (range == 'ComplexDate' || range ==  'dateTime') {
        try {
          var i = parseInt(value);
          if (isNaN(i))
            return value;
          else
            return i;
        } catch (err) {
          // TODO: check if it's valid, like 'today', etc.
          return value; 
        }
      }
      else if (range == 'Money')
        return parseFloat(value);

//    var hIdx = range.indexOf('#');
//    if (hIdx != -1) {
//      range = range.slice(hIdx + 1);
//      switch (range) {
//      case 'string':
//        return value;
//      case 'int':
//      case 'long':
//      case 'date':
//        return parseInt(value);
//      case 'float':
//      case 'double':
//        return parseFloat(value);
//      case 'boolean':
//        return ['true', '1', 'yes'].indexOf(value.toLowerCase()) != -1;
//      default:
//        throw new Error('unsupported property range: ' + range);  
//      }
//    }

      return value;
    },
    
    isTrue: function(val) {
      if (_.isUndefined(val) || val == null)
        return false;
      
      if (typeof val === 'string')
        return ['1', 'true', 'yes'].indexOf(val.toLowerCase()) != -1;
      else
        return !!val;
    },
    
    isArray: function(obj) {
      return U.getObjectType(obj) === '[object Array]';
    },

    isObject: function(obj) {
      return U.getObjectType(obj) === '[object Object]';
    },
    
    /**
     * like _.filter, but func takes in both key and value 
     * @return obj with keys and values such that for each [key, val] pair, func(key, val) is truthy;
     */
    filterObj: function(obj, func) {
      var filtered = {};
      for (var key in obj) {
        var val = obj[key];
        if (func(key, val))
          filtered[key] = val;
      }
      
      return filtered;
    },
    
    copyFrom: function(from, to, props) {
      _.each(props || from, function(p) {
        to[p] = from[p];
      });
    },
    
    /**
     * @return obj with keys and values remapped by func. 
     * @param func: takes in key, value, returns [newKey, newValue] or null if you want to remove it from the map 
     */
    mapObj: function(obj, func) {
      var mapped = {};
      for (var key in obj) {
        var val = obj[key];
        var pair = func(key, val);
        if (pair)
          mapped[pair[0]] = pair[1];
      }
      
      return mapped;
    },
    
    getFirstProperty: function(obj) {
      for (var name in obj) {
        return name;
      }
    },
    
    getPlural: function(res) {
      var p = res.vocModel.pluralName;
      if (p)
        return p;
      
      p = res.displayName;
      return p.endsWith('y') ? p.slice(0, p.length - 1) + 'ies' : p + 's';
    },
    
    slice: slice
  };
  
  
  return (Lablz.U = U);
});