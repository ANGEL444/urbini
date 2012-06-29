/**********************************
 * Adaptor to platform services
 **********************************/
var Boost = {
  majorVersion : 1,
  minorVersion : 0,

  /* platform services */
  eventManager        : null,
  user                : null,
  xmpp                : null,
  notifier            : null,
  cache               : null,
  geoLocation         : null,
  camera              : null,
  logger              : null,
  phone               : null,
  keyboard            : null,
  view                : null, // window or view of this browser
  browserHistory      : null,
  zoom                : null,


  eventHandlers       : new Array(),
  eventObjects        : new Array(),

  /* initialize platform-specific services */
  init:  function() {
    var $t = Boost;
    var needHandler;
    
    if (typeof jsiEventManager != 'undefined') {
      $t.eventManager         = jsiEventManager;
    }
    else if (typeof document.BhoostApplet != 'undefined' &&
        typeof document.BhoostApplet.getEventManager != 'undefined') {
      $t.eventManager = document.BhoostApplet.getEventManager();
      Boost.log('adding jsi from Applet: ' + $t.eventManager);
    }
    else {
      // default implementation
      $t.eventManager = {
         hasEvent :         function () { return false; }
        ,readyForEvents:    function () {  }
        ,readyForNextEvent: function () {  }
        ,isEventsViaTimer:  function () { return false; }
        ,getEventInstance:  function () { return null; }
        ,subscribe:         function () {  }
        ,unsubscribe:       function () {  }
      };
      Boost.log('no eventManager');
    }
    if (typeof jsiUser != 'undefined') {
      $t.user                 = jsiUser;
      needHandler = true;
    }
    if (typeof jsiNotification != 'undefined') {
      $t.notifier             = jsiNotification;
      needHandler = true;
    }
    if (typeof jsiXmpp != 'undefined') {
      $t.xmpp                 = jsiXmpp;
      $t.eventObjects['xmpp'] = jsiXmppEvent;
      needHandler = true;
    }
    else if (typeof document.BhoostApplet != 'undefined' &&
        typeof document.BhoostApplet.getXmppInstance != 'undefined') {
      $t.xmpp = document.BhoostApplet.getXmppInstance();
      $t.eventObjects['xmpp'] = $t.eventManager.getEventInstance('xmpp');
      needHandler = true;
      Boost.log('adding xmpp jsi from Applet: ' + $t.xmpp);
    }
    if (typeof jsiBrowserHistory != 'undefined') {
      $t.browserHistory                 = jsiBrowserHistory;
      $t.eventObjects['browserHistory'] = jsiBrowserHistoryEvent;
      needHandler = true;
    }
    if (typeof jsiZoom != 'undefined') {
      $t.zoom                           = jsiZoom;
      needHandler = true;
    }
    if (typeof jsiGeoLocation != 'undefined') {
      $t.geoLocation                    = jsiGeoLocation;
      $t.geoLocation.setMinDistance(1000);
      $t.geoLocation.setMinTime(300000);
      $t.eventObjects['geoLocation']    = jsiGeoLocationEvent;
      needHandler = true;
    }
    if (typeof jsiCamera != 'undefined') {
      $t.camera                         = jsiCamera;
      $t.eventObjects['camera']         = jsiCameraEvent;
      needHandler = true;
    }
    if (typeof jsiLog != 'undefined') {
      $t.logger                         = jsiLog;
      needHandler = true;
    }
    if (typeof jsiCall != 'undefined') {
      $t.phone                          = jsiCall;
      needHandler = true;
    }
    if (typeof jsiKeyboard != 'undefined') {
      $t.keyboard                       = jsiKeyboard;
      $t.eventObjects['key']            = jsiKeyEvent;
      needHandler = true;
    }
    if (typeof jsiCache != 'undefined') {
      $t.cache                          = jsiCache;
    }
    if (needHandler) {
      if ($t.eventManager.isEventsViaTimer()) {
        Boost.log("unqueuing events via timer");
        setInterval($t.eventArrived, 1000);
      }
      else {
        if (Browser.android) {
        Boost.log('adding native keydown event handler');
        addEvent(document, 'keypress', $t.eventArrived, false); // this fake key event is programatically injected by android LablZ adapter
        addEvent(document, 'keydown', $t.eventArrived, false); // this fake key event is programatically injected by android LablZ adapter
        addEvent(document, 'keyup', $t.eventArrived, false); // this fake key event is programatically injected by android LablZ adapter
        }
      }
    }

    if (typeof jsiView != 'undefined')
      $t.view = jsiView;
    else {
      // default implementation
      $t.view = {
        setProgressIndeterminate: function(b) {
          $t.log('setting progress indeterminate');
          if (b)
            document.body.style.cursor = "wait";
          else
            document.body.style.cursor = "default";
        },
        setProgress : function(progressPercent) {
          if (progressPercent != 100)
            document.body.style.cursor = "wait";
          else
            document.body.style.cursor = "default";
        },
        setTitle: function (text) {
          document.title = text;
        }
      };
    }

    for (var h in Boost.eventHandlers) {
      Boost.log('handlers: ' + h);
    }
    for (var h in Boost.eventObjects) {
      Boost.log('eventObjects: ' + h);
    }

  },

  log: function(text) {
    var $t = Boost;
    if ($t.logger) {
      $t.logger.log("Boost: " + text);
    }
    else if (!Browser.ie && typeof console != 'undefined') {
      console.log("Boost: " + text);
    }
//    else {
//      alert("Boost: " + text);
//    }
  },

  logDB: function() {
    var $t = Boost;
    if ($t.logger)
      $t.logger.logDB();
  },

  /**
   * Register a handler for a specific platform event.
   * Allows to add multiple handlers. Handlers are called in FIFO order.
   */
  addEventHandler:  function(eventType, handler) {
    var $t = Boost;
    var handlers = $t.eventHandlers[eventType];
    if (handlers == null) {
      handlers = new Array();
      $t.eventHandlers[eventType] = handlers;
    }
    Boost.log('adding handler for type: ' + eventType);
    if (typeof $t.eventManager.subscribe == 'function') {
      $t.eventManager.subscribe(eventType);
    }
    handlers[handlers.length] = handler;
    //Boost.log('added handler: ' + handlers[handlers.length - 1]);
  },

  /******* private members ********/

  /**
   * Dispatches events from the underlying platform to the proper event handler
   */
  eventArrived:  function(e) {
//    Boost.log('eventArrived()');
    var $t = Boost;
    if (e) {
      var code;
      if (typeof (e.getKeyCode) != 'undefined')
        code = e.getKeyCode(); // on android forced to use function, not keyCode property
      else
        codee = getKeyCode(e);
      //var code = e.keyCode;
      Boost.log('got native key event: ' + e + ', code=' + code);
      if (code != 39) // process only fake key event
        return true;
    }
    var hasEvent = $t.eventManager.hasEvent();
//    Boost.log('$t.eventManager.hasEvent(): ' + hasEvent);
    var propagate = true;
    if (hasEvent) {
      $t.eventManager.popEvent();
      Boost.log('after $t.eventManager.popEvent()');
      var eventType = $t.eventManager.getEventType();
      Boost.log('eventType: ' + eventType);
      var handlers = $t.eventHandlers[eventType];
      var eventObject = $t.eventObjects[eventType];
      Boost.log('eventObject: ' + eventObject);
      if (handlers) {
        for (var i=0; i<handlers.length; i++) {

          var handler = handlers[i];
          if (handler == null)
            continue;
          Boost.log('calling handler for event \'' + eventType + '\' with event object: ' + eventObject);
//          try {
            propagate = handler(eventObject);
            if (!propagate)
              break;
//          } catch(e) {
//            Boost.log('failed on handler for event \'' + eventType + '\' with event object: ' + eventObject + ':  ' + e);
//          }
        }
      }
//      $t.eventManager.popEvent();
    }
//    Boost.log('readyForNextEvent()');
    var em = $t.eventManager;
    if (typeof em.readyForNextEvent != 'undefined')
      $t.eventManager.readyForNextEvent();
    if (propagate)
      return true;
    else
      return stopEventPropagation(e);
  }
}


/**********************************
 * Mobile
 **********************************/
 var Mobile = {
  currentUrl:  null,
  urlToDivs:   null,
  chatRooms:   null,
  browsingHistory:       null,
  browsingHistoryTitles: null,
  browsingHistoryPos: 0,
 _preventingDoubleClick: false,
  myName: null,
  XMPPHost: null,
  XMPPChatService: null,
  myBuddy: null,
  privateRooms: null,
  isHistoryView : false,
  curHash : "", // helps to chatch back (forward) button
  $t: null,

  log: function(text) {
    Boost.log(text);
  },

  init: function(event) {
    var $t = Mobile;
    if (!Browser.mobile)
      return;
    Boost.view.setProgressIndeterminate(false);
    
    // process redirect ourselves so that page is loaded into cache, added to history, etc.
    var redirect = document.getElementById('$redirect');
    var location;
    if (redirect)
      location = redirect.getAttribute('href');
    if (location) {
      Boost.log('redirecting to page: ' + location)
      var link = {href: location, id: null}
      $t.getPage(event, link);
      return;
    }

    Boost.addEventHandler('xmpp', $t.onChatMessage);
    Boost.addEventHandler('key',  $t.onKey);
    Boost.addEventHandler('camera', $t.onCameraEvent);
    Boost.addEventHandler('geoLocation',  $t.onGeoLocation);
    
    addEvent(document.body, 'click',  $t.onClick, false);
    
    Boost.view.setProgressIndeterminate(false);
    if (Boost.cache)
      Boost.cache.cookieSync();

    var u = new Array();
    $t.urlToDivs = u;
    u = new Array();
    $t.chatRooms = u;

    $t.onPageLoad();
    var myDiv = document.getElementById('myScreenName');
    if (myDiv)
      $t.myName = myDiv.innerHTML;

    myDiv = document.getElementById('XMPPHost');
    if (myDiv)
      $t.XMPPHost = myDiv.innerHTML;
    myDiv = document.getElementById('XMPPChatService');
//    if (myDiv)
//      $t.XMPPChatService = myDiv.innerHTML;
    Boost.log('myName: ' + $t.myName + "; XMPPHost: " + $t.XMPPHost);
    if (Boost.xmpp) {
      if (typeof Boost.xmpp.setHost != 'undefined')
      Boost.xmpp.setHost($t.XMPPHost);
//      if (typeof Boost.xmpp.setChatService != 'undefined')
//      Boost.xmpp.setChatService($t.XMPPChatService);
      Boost.log('xmpp.login: ' + $t.myName);
      if ($t.myName != null && $t.myName.length != 0)
        Boost.xmpp.login($t.myName, $t.myName);
    }
    var pr = new Array();
    $t.privateRooms = pr;

    $t.checkLocation();

    Boost.log("$t.eventManager.readyForEvents();");
    Boost.eventManager.readyForEvents();
  },

  onPageLoad: function(newUrl, div) {
    var $t = Mobile;
    Boost.log("webview.db");
//    Boost.logDB();

    if (!Boost.xmpp)
      return;

    $t.enterChatRoom(newUrl, div);
  },

  enterChatRoom: function(chatRoomUrl, div) {
    var $t = Mobile;
    if (!div)
      return;
    if (!Boost.xmpp)
      return;
/*
    // time of the last message
    var d = document.getElementById('lastIMtime');
    if (!d)
      return;
    var time = d.innerHTML;
    Boost.log('lastIMtime: ' + time);
    //Boost.xmpp.init(time);
*/
    var chatRoomId = $t._getChatRoomId(div);
    if (chatRoomId) {
      chatRoomId = chatRoomId.toLowerCase();
      if (Boost.xmpp) {
//        var chatRoomId = "marco@conference.conference.lablz.com";  // hack
        Boost.log('chatRoom: ' + chatRoomId);
        $t.chatRooms[chatRoomId] = chatRoomUrl;
        Boost.log('chatRoomUrl: ' + $t.chatRooms[chatRoomId]);
        Boost.xmpp.setChatRoom(chatRoomId);
      }
    }
  },

  _getChatRoomId: function (div) {
    var chatRoomId = null;
    var divs = div.getElementsByTagName('div');
    var chatRoomDiv;
    for (var i=0; i<divs.length  &&  chatRoomDiv == null; i++) {
      var tDiv = divs[i];
      if (tDiv.id  &&  tDiv.id == '-chatRoom')
        chatRoomDiv = tDiv;
    }
    if (chatRoomDiv)
      chatRoomId = chatRoomDiv.innerHTML;
    if (chatRoomId)
      chatRoomId.toLowerCase();
    return chatRoomId;
  },

  autoLogin: function(url) {
    var $t = Mobile;
    if (!url)
      url = document.location.href;
    if (url.indexOf('user-login.html') == -1)
      return;
    Boost.log('autoLogin: ' + url);
    var loginform = document.forms['loginform'];
    var jstest = loginform.elements['.jstest'];
    jstest.value = "ok"; // server will know that JavaScript worked
    var username = loginform.elements['j_username'];
    pw.value = 'mark';
    var pw = loginform.elements['j_password'];
    username.value = 'mark';
    //if (Boost.xmpp) {
      //Boost.xmpp.login(username.value, pw.value);
    //}
    /*
    if (typeof hash == 'undefined') {
      var script = '<script src="register/hashScript.js" type="text/javascript" language="JavaScript"></script>';
      div = document.createElement("DIV");
      document.body.appendChild(div);
      div.innerHTML = script;
    }
    */
    hash(loginform, 'j_security_check');

    var params = getFormFilters(loginform, true, new Array());
    //var urlFields = document.location.split('?');
    var url = loginform.action;
    //postRequest(event, url, params, null, null, function() {}, true);
  },

  onKey: function(e) {
    var $t = Mobile;
    var k = e.getKeyCode();
    Boost.log('got key event: ' + k);

    if (k == 4) { //back
      // if history view is opened then just close it.
      if ($t.isHistoryView) {
        $t.hideHistoryView($t.getCurrentPageDiv());
        return stopEventPropagation(e);
      }
      $t.oneStep(null, -1);
      return stopEventPropagation(e);
    }
    else if (k == 1) { // menu button
      $t.showOptionsMenu();
      return stopEventPropagation(e);
    }
    return true;
  },

  getCurrentUrl: function() {
    if (!this.currentUrl)
      return window.location.href;
    return this.currentUrl;
  },

  getCurrentPageDiv: function() {
    var $t = Mobile;
    if (!$t.urlToDivs || !$t.currentUrl || !$t.urlToDivs[$t.currentUrl]) {
      return document.getElementById('mainDiv');
    }
    return $t.urlToDivs[$t.currentUrl];
  },
  showActionMenu : function(event, link) {
		var urlLink = getChildById(this.getCurrentPageDiv(), "action_menu_url_link");
		if (!urlLink)
		  return; // ?
    PlainDlg.show(event, urlLink.href, link);
	},
  showOptionsMenu: function() {
    var $t = Mobile;
    if ($t.isHistoryView) {
      $t.hideHistoryView($t.getCurrentPageDiv());
      return false;
    }

    var optionsDiv = document.getElementById('menu_Options');
    if (!$t.urlToDivs) {
      var u = new Array();
      $t.urlToDivs = u;
    }
    var currentDiv = $t.getCurrentPageDiv();
    $t.displayActionsAndViewsFor(currentDiv, optionsDiv);
    MobileMenuAnimation.show(currentDiv, optionsDiv);
    return true;
  },

  onChatMessage: function(e) {
    Boost.log('onChatMessage(): ' + e);
    var $t = Mobile;
    var text = e.getBody();
    if (!text)
      return;
    text += '';
    if (text == "This room is not anonymous.")
      return;
    var sender = e.getSender();
    if (sender)
      sender += '';
    var messageType  = e.getMessageType();
    if (messageType)
      messageType += '';
    var room = e.getChatRoom();
    if (room)
      room += '';
    Boost.log('sender: ' + sender + '; message: ' + text + "; messageType: " + messageType + '; chatRoom: ' + room);
/*
    if (messageType == null) {
      if (text == 'available' || text == 'unavailable')
        messageType = 'presence';
      else
        messageType = 'normal';
    }
*/
    var currentDiv = $t.urlToDivs[$t.currentUrl];
    if (!currentDiv) {
      currentDiv = document.getElementById('mainDiv');
      $t.urlToDivs[0] = currentDiv;
    }

    Boost.log('onChatMessage: getChatRoom(): ' + room);
    var roomUrl = null;
    var imDiv = null
    if (room == null) { // private msg
      if (messageType != 'normal'  &&  messageType != 'chat')
        return;
      imDiv = $t.insertPrivateMessage(e, sender);
    }
    else {
      room = room.toLowerCase();
      roomUrl = $t.chatRooms[room];
      if (roomUrl == null) {
        Boost.log("no chat room found for " + room + ", message: " + text);
        return;
      }
      Boost.log("room url: " + roomUrl);
      var roomDiv = $t.urlToDivs[roomUrl];
      Boost.log("room div: " + roomDiv + ', room div id: ' + roomDiv.id);
      $t.insertChatMessage(e, roomDiv);
    }

    var currentRoom;
    if (!currentDiv) {
      Boost.log("no current div - can't detect chat room");
    }
    else {
      /*
       *  put message into current chatRoom div
       */
      currentRoom = $t._getChatRoomId(currentDiv);
      Boost.log("current chat room : " + currentRoom);
      if (!currentRoom) {
        Boost.log("no chat room in current div, sending a proper notification");
        // notify using sound/lights
        if (Boost.notifier) {
          Boost.log("sending notification");
          var ringerMode = Boost.notifier.getRingerMode();
          Boost.notifier.createNotification();
          Boost.notifier.setRing();
          var vibArray = [1000,1000,1000,4];
          Boost.notifier.setVibrate(vibArray);
          Boost.notifier.setInsistent(false);
          Boost.notifier.sendNotification();
        }
        return;
      }
      currentRoom = currentRoom.toLowerCase();
      roomUrl = $t.chatRooms[currentRoom];
      if (roomUrl == null) {
        Boost.log("no current chat room found for " + currentRoom);
        return;
      }
      Boost.log("current room url: " + roomUrl);
      var roomDiv = $t.urlToDivs[roomUrl];
      if (imDiv  &&  currentDiv != imDiv) {
        Boost.log("current room div: " + roomDiv + ', room div id: ' + roomDiv.id);
        $t.insertChatMessage(e, roomDiv);
      }
    }



/*
    if (roomUrl == $t.currentUrl) {
      // notify(true);
    }
    else {
      // notify(false);
    }

    var tbodies = roomDiv.getElementsByTagName('tbody');
    var ctbody;
    for (var i=0; i<tbodies.length  &&  !ctbody; i++) {
      if (tbodies[i]  &&  tbodies[i].id  &&  tbodies[i].id == 't_chat')
        ctbody = tbodies[i];
    }

    var curTr;
    var trs = ctbody.getElementsByTagName('tr');
    Boost.log("room trs: " + trs);
    for (var i=0; i<trs.length  &&  !curTr; i++)
      if (trs[i]  &&  trs[i].id  &&  trs[i].id == 'tr_empty')
        curTr = trs[i];
    if (curTr == null)
      return;

    var newTr = copyTableRow(ctbody, 1, curTr);
    newTr.className = '';
    var elms = newTr.getElementsByTagName('td');
    elms[0].innerHTML = text;
    var date = new Date(e.getTime());
    var mins = date.getMinutes();
    Boost.log("room 1: ");
    if (mins < 10)
      mins = '0' + mins;
    var hours = date.getHours();
    if (hours < 10)
      hours = '0' + hours;
    elms[1].innerHTML = '<tt>' + hours + ':' + mins + '</tt>';
    Boost.log("room elms: " + elms[1].innerHTML);
    var sender = e.getSender();
    Boost.log("sender: " + sender);
    Boost.log("slashindex: " + sender.indexOf('/'));
    if (sender && sender.indexOf('/') != -1) {
      var s = sender.split('/');
      Boost.log("part1: " + s[0]);
      if (s && s.length > 0) {
        Boost.log("part2: " + s[1]);
        sender = s[s.length - 1];
      }
    }

    var imgTable = newTr.getElementsByTagName('table');
    var imgTds = imgTable[0].getElementsByTagName('td');
    var img = imgTds[0].getElementsByTagName('img');
    var anchor = imgTds[0].getElementsByTagName('a');

    var href = 'contactInfo?name=' + sender;
    anchor[0].href = href;
    img[0].src = 'contactInfo?name=' +  sender + '&thumb=y';

    var anchor1 = imgTds[1].getElementsByTagName('a');
    anchor1[0].href = href;
    anchor1[0].innerHTML = sender;

    ctbody.appendChild(newTr);
    window.scrollTo(0, 3000);
//    android.scroll();
//    d.innerHTML = d.innerHTML + text + "</br>";
 *
 */
  },

  insertPrivateMessage: function(e, sender) {
    var $t = Mobile;

    var divId = sender;
    var idx = sender.indexOf('/');
    if (idx != -1)
      divId = sender.substring(0, idx);
    var div = $t.urlToDivs[divId];
    Boost.log('insertPrivateMessage(): sender: ' + sender + '; div: '+ div);
    if (div == null) {
      var div_empty = document.getElementById('im_empty');
      Boost.log('empty div:' + div_empty);
      div = document.createElement('DIV');
      var currentDiv = $t.urlToDivs[$t.currentUrl];
      insertAfter(currentDiv.parentNode, div, currentDiv);
      $t.privateRooms[divId] = sender;
      setInnerHtml(div, div_empty.innerHTML);
      div.id = divId.toLowerCase();
      div.style.display = 'none';
      div.style.visibility = "hidden";
      $t.urlToDivs[divId] = div;
      $t.activatePrivateChat(div, sender);
    }
//    div.style.display = 'inline';
//    div.style.visibility = "visible";

    Mobile.insertChatMessage(e, div);
    return div;
  },

  activatePrivateChat : function(div, roomUrl) {
    var forms = div.getElementsByTagName('form');
    var form = forms[0];
//    form = document.forms[form.name];
    var idx = roomUrl.indexOf('@');
    var roomName = roomUrl.substring(0, idx);
    form.name = roomName;
    form.id = roomName;
    addEvent(form, 'submit', addWithoutProcessing, false);
  },

  insertChatMessage: function(e, roomDiv) {
    var tbodies = roomDiv.getElementsByTagName('tbody');
    var ctbody;
    for (var i=0; i<tbodies.length  &&  !ctbody; i++) {
      if (tbodies[i]  &&  tbodies[i].id  &&  tbodies[i].id == 't_chat')
        ctbody = tbodies[i];
    }
    var curTr;
    var trs = ctbody.getElementsByTagName('tr');
    for (var i=0; i<trs.length  &&  !curTr; i++)
      if (trs[i]  &&  trs[i].id  &&  trs[i].id == 'tr_empty')
        curTr = trs[i];
    if (curTr == null)
      return;

    var newTr = copyTableRow(ctbody, 1, curTr);
    newTr.id = '';
    newTr.className = '';
    var elms = newTr.getElementsByTagName('td');
    elms[0].innerHTML = e.getBody();
    var date = new Date(e.getTime());
    var mins = date.getMinutes();
    if (mins < 10)
      mins = '0' + mins;
    var hours = date.getHours();
    if (hours < 10)
      hours = '0' + hours;
    elms[1].innerHTML = '<tt>' + hours + ':' + mins + '</tt>';
    var sender = e.getSender();
    sender = sender + "";
    var idx = sender.lastIndexOf('@');
    var addHref = true;
    if (idx == -1) {
      var lablzStr = 'lablz.com/';
      var cutoffIndex = sender.lastIndexOf('lablz.com') + lablzStr.length;
      Boost.log("cutoffindex: " + cutoffIndex);
      Boost.log("new name:" + " " + sender.substring(cutoffIndex));
      if (sender && sender.lastIndexOf('lablz.com') != -1)
        sender = sender.substring(cutoffIndex);
    }
    else {
      if (sender.indexOf('showtime') == 0) {
        addHref = false;
        var idx1 = sender.lastIndexOf('/');
        if (idx1 == -1)
          sender = sender.substring(0, idx);
        else
          sender = sender.substring(idx1 + 1);
      }
      else
        sender = sender.substring(0, idx);
    }
    var imgTable = newTr.getElementsByTagName('table');
    var imgTds = imgTable[0].getElementsByTagName('td');
    var img = imgTds[0].getElementsByTagName('img');
    var anchor = imgTds[0].getElementsByTagName('a');
    var anchor1 = imgTds[1].getElementsByTagName('a');
    if (addHref) {
      var href = 'contactInfo?name=' + sender;
      anchor[0].href = href;
      img[0].src = 'contactInfo?name=' +  sender + '&thumb=y';
      anchor1[0].href = href;
      anchor1[0].innerHTML = sender;
    }
    else
      imgTds[1].innerHTML = sender;

    ctbody.appendChild(newTr);
    window.scrollTo(0, 3000);
    if (typeof Boost.view.refocus != 'undefined')
      Boost.view.refocus();
//    setTimeout("Mobile.doSelection()", 50);
  },

  doSelection: function() {
    $t = Mobile;
    //Boost.log('doSelection() currentUrl:' +  $t.currentUrl);
    if (!$t.currentUrl) {
      $t.currentUrl = document.location.href;
    }
    var currentDiv = $t.getCurrentPageDiv();
    //Boost.log('doSelection() currentDiv:' +  currentDiv.id);
    var forms = currentDiv.getElementsByTagName('FORM');
    if (!forms || forms.length == 0)
      return;
    //Boost.log('doSelection() forms:' +  forms.length);
    var form = forms[0];
    var inputField = form.elements['.title'];
    //Boost.log('doSelection() inputField:' +  inputField.name);
    if (inputField)
      inputField.focus();
  },

  onGeoLocation: function(e) {
    var $t = Mobile;
    var callback = function() { Boost.log("finished posting geolocation event") };
    var a = document.getElementsByTagName('A');
    var params = 'latitude=' + e.getLatitude() + '&longitude=' + e.getLongitude()
    Boost.log('onGeoLocation: ' + params);
    postRequest(e, 'location', params, null, a[0], callback);
  },

  onCameraEvent: function(e) {
    var $t = Mobile;
    var url = e.getUrl();
    var privateIm = $t.myBuddy + '@' + $t.XMPPHost;
    Boost.log(privateIm);
    var img = "";

///////////
    if ($t.privateRooms)
      privateRoomId = $t.privateRooms[privateIm];
    var div;
    if (privateRoomId)
      div = $t.urlToDivs[privateIm];
    else
      privateRoomId = privateIm;
    var currentDiv = $t.urlToDivs[$t.currentUrl];

    if (!currentDiv) {
      currentDiv = document.getElementById('mainDiv');
      $t.urlToDivs[$t.currentUrl] = currentDiv;
      $t.browsingHistory[$t.browsingHistoryPos] = $t.currentUrl;
    }
    var img = "<img src=\"" + url + "\" width='" + ($t.getScreenWidth() / 2) + "'/>";
    privateIm = privateIm.toLowerCase();
    if (!div) {
      $t.privateRooms[privateRoomId] = privateIm;
      var div_empty = document.getElementById('im_empty');
      Boost.log("cloneDiv: im_empty");
      var div = document.createElement('DIV');
//      var div = cloneNode(div_empty);
      insertAfter(currentDiv.parentNode, div, currentDiv);
      setInnerHtml(div, div_empty.innerHTML);
      $t.activatePrivateChat(div, privateIm);

      // newUrl is sender in this case
      div.id = privateIm;
      div.className = '';
      Boost.log("Sending Photo to: " + privateIm);
      $t.urlToDivs[privateIm] = div;
    }
    var e = {
        getBody:   function() {return img},
        getSender: function() {return $t.myName + '@' + $t.XMPPHost},
        getTime:   function() {return new Date().getTime()}
      };
    $t.currentUrl = privateIm;
    Mobile.insertChatMessage(e, div);
    MobilePageAnimation.showPage(currentDiv, div);
    $t.setLocationHash(url);
///////////
    Boost.xmpp.sendMessage("<a href='" + url + "'>" + img + "</a>", privateIm + "/marco-android");
    Boost.log('Photo url for Avatar: ' + url);
  },

  mobileMenu: function(e, link) {
    var $t = Mobile;

    var id = link.id;
    var newUrl = link.href;
    var optionsDiv = document.getElementById('menu_Options');
    if (!id) {
      if (optionsDiv) {
        optionsDiv.style.visibility = "hidden";
        optionsDiv.style.display = "none";
      }

      return newUrl;
    }
    if (id == 'optionsMenu') {
      $t.changePresentationItemsState();
      if($t.showOptionsMenu() == false)
        stopEventPropagation(e);
      return null;
    }
    
    if (id == 'menu_Add') {
      var a = $t.getElementById('add_url_hdn');
      DataEntry.show(e, a.href);
      newUrl = null;
    }
    if (id == 'menu_Edit') {
      var a = $t.getElementById('edit_url_hdn');
      if (a == null)
        return stopEventPropagation(e);
      DataEntry.show(e, a.href);
      newUrl = null;
    }
    if (id == 'menu_Delete') {
      var a = $t.getElementById('delete_url_hdn');
      if (a.href.indexOf("l.html") != -1) 
        newUrl = a.href;
      else {
        doConfirm("&[Do you realy want to delete this resource];?");
        newUrl = null;
      }
    }
    
    if (id == 'menu_Desktop') {
      var uri = $t.currentUrl;
      var idx = uri.indexOf('-mobile=');
      if (idx != -1) {
        var idx1 = uri.indexOf('&', idx);
        if (idx1 == -1)
          uri = uri.substring(0, idx);
        else {
          if (uri.charAt(idx - 1) == '&')
            uri = uri.substring(0, idx - 1) + uri.substring(idx1);
          else
            uri = uri.substring(0, idx) + uri.substring(idx1 + 1);
        }
      }
      var idx2 = uri.indexOf('#');
      if (idx2 == -1)
      uri += '&-desktop=y';
      else
        uri = uri.substring(0, idx2) + '&-desktop=y';   
      Boost.view.setProgressIndeterminate(true);
      document.location.replace(uri);
      return null;
    }
    if (id == 'menu_cancel') {
      MobileMenuAnimation.hide();
      var currentDiv = $t.urlToDivs[$t.currentUrl];
      if (!currentDiv) {
        currentDiv = document.getElementById('mainDiv');
        var u = new Array();
        u[0] = $t.currentDiv;
        $t.urlToDivs = u;
      }
       return null;
    }
    if (id == 'menu_exit') {
    BrowserDialog.confirm("&[Do you really want to exit this application];?", $t.onExisCallback);
      return null;
    }
    if (id == 'menu_Refresh') {
      // Write browsing history to the server and load it when loading new page
      Boost.view.setProgressIndeterminate(true);
      document.location.replace($t.currentUrl);
      return null;
    }
    /*
    if (id == 'menu_logoff') {
      // Write browsing history to the server and load it when loading new page
      var a = $t.getElementById('logoff_url_hdn');
      DataEntry.show(a.href);
      newUrl = null;
    }
    */
    if (id == 'menu_Reload') {
      Boost.view.setProgressIndeterminate(true);
      optionsDiv.style.visibility = "hidden";
      optionsDiv.style.display = "none";
      
      document.location.reload();
      return null;
    }
    if (id == 'menu_History') {
      if (typeof Boost.zoom) {
         // zoom out to appropriate percentage
         // unhide the divs in urlToDivs
        if (typeof Boost.zoom != 'undefined')
         $t.showHistoryView();
      }
      return null;
    }
    if (id == 'menu_List') {
      optionsDiv.style.visibility = "hidden";
      optionsDiv.style.display = "none";
      newUrl = $t.currentUrl;
      var idx = newUrl.indexOf('-featured=');
      if (idx != -1) {
        idx1 = newUrl.indexOf('&', idx);
        if (idx1 == -1) {
          if (newUrl.charAt(idx - 1) == '&')
            idx--;
          newUrl = newUrl.substring(0, idx);
        }
        else
          newUrl = newUrl.substring(0, idx) + newUrl.substring(idx1 + 1);
      }

      var idx = newUrl.indexOf('-grid=');
      if (idx != -1) {
        var idx1 = newUrl.indexOf('&', idx);
        if (idx1 == -1) {
          if (newUrl.charAt(idx - 1) == '&')
            idx--;
          newUrl = newUrl.substring(0, idx);
        }
        else
          newUrl = newUrl.substring(0, idx) + newUrl.substring(idx1 + 1);
        newUrl += '&-list=y';
      }
      else if (newUrl.indexOf('-list=') == -1)
        newUrl = newUrl + '&-list=y';
    }
    else if (id == 'menu_Grid') {
      optionsDiv.style.visibility = "hidden";
      optionsDiv.style.display = "none";
      newUrl = $t.currentUrl;

      var idx = newUrl.indexOf('-featured=');
      if (idx != -1) {
        idx1 = newUrl.indexOf('&', idx);
        if (idx1 == -1) {
          if (newUrl.charAt(idx - 1) == '&')
            idx--;
          newUrl = newUrl.substring(0, idx);
        }
        else
          newUrl = newUrl.substring(0, idx) + newUrl.substring(idx1 + 1);
      }

      idx = newUrl.indexOf('-list=');
      if (idx != -1) {
        var idx1 = newUrl.indexOf('&', idx);
        if (idx1 == -1) {
          if (newUrl.charAt(idx - 1) == '&')
            idx--;
          newUrl = newUrl.substring(0, idx);
        }
        else
          newUrl = newUrl.substring(0, idx) + newUrl.substring(idx1 + 1);
        newUrl += '&-grid=y';
      }
      else {
        idx = newUrl.indexOf('-grid=');
        if (idx == -1)
          newUrl += '&-grid=y';
      }
    }
    else if (id == 'menu_LargeGrid') {
      optionsDiv.style.visibility = "hidden";
      optionsDiv.style.display = "none";
      newUrl = $t.currentUrl;

      var idx = newUrl.indexOf('-featured=');
      if (idx == -1)
        newUrl += '&-featured=y';

      idx = newUrl.indexOf('-list=');
      if (idx != -1) {
        var idx1 = newUrl.indexOf('&', idx);
        if (idx1 == -1) {
          if (newUrl.charAt(idx - 1) == '&')
            idx--;
          newUrl = newUrl.substring(0, idx);
        }
        else
          newUrl = newUrl.substring(0, idx) + newUrl.substring(idx1 + 1);
        newUrl += '&-grid=y';
      }
      else {
        idx = newUrl.indexOf('-grid=');
        if (idx == -1)
          newUrl += '&-grid=y';
      }
    }
    else if (id.indexOf('actions_Photo_') != -1) {
      if (!Boost.camera)
        return null;
      $t.myBuddy = id.substring(14);
      Boost.camera.takePicture(newUrl);
      Boost.log('picture was taken');
      return null;
    }
    else if (id == 'actions_IM') {
      var privateRoomId;
      var idx0 = newUrl.indexOf('@');
      var s = newUrl.substring(0, idx0);
      var idx01 = s.lastIndexOf('/');
      if (idx01 != -1)
        newUrl = s.substring(idx01 + 1) + newUrl.substring(idx0);

//      newUrl = newUrl.substring(idx + 1) + partUrl;
      Boost.log("privateIM: " + newUrl);
      if ($t.privateRooms)
        privateRoomId = $t.privateRooms[newUrl];
      var div;
      if (privateRoomId)
        div = $t.urlToDivs[newUrl];
      else
        privateRoomId = newUrl;
      var currentDiv = $t.urlToDivs[$t.currentUrl];
      if (!currentDiv) {
        currentDiv = document.getElementById('mainDiv');
        $t.urlToDivs[$t.currentUrl] = currentDiv;
        $t.browsingHistory[$t.browsingHistoryPos] = $t.currentUrl;
      }
      if (!div) {
        $t.privateRooms[privateRoomId] = newUrl;
        var div_empty = document.getElementById('im_empty');
        Boost.log("cloneDiv: im_empty");
        var div = document.createElement('DIV');
//        var div = cloneNode(div_empty);
        insertAfter(currentDiv.parentNode, div, currentDiv);
        setInnerHtml(div, div_empty.innerHTML);
        $t.activatePrivateChat(div, newUrl);

        // newUrl is sender in this case
        newUrl = newUrl.toLowerCase();
        div.id = newUrl;
        div.className = '';
        Boost.log("'IM me' clicked on: " + div.id);
        $t.urlToDivs[newUrl] = div;
        var e = {
          getBody:   function() {return "Please 'IM' me"},
          getSender: function() {return $t.myName + '@' + $t.XMPPHost},
          getTime:   function() {return new Date().getTime()}
        };
        Mobile.insertChatMessage(e, div);
      }
      else
        Boost.log("found div: " + newUrl);
/*
      var currentDiv = $t.urlToDivs[$t.currentUrl];

      if (!currentDiv) {
        currentDiv = document.getElementById('mainDiv');
        $t.urlToDivs[$t.currentUrl] = currentDiv;
        $t.browsingHistory[$t.browsingHistoryPos] = $t.currentUrl;
      }
*/
/*
      currentDiv.style.display = 'none';
      currentDiv.style.visibility = "hidden";
      div.style.display = 'inline';
      div.classname = '';
      div.style.visibility = "visible";
*/
      MobilePageAnimation.showPage(currentDiv, div);
      $t.setLocationHash(newUrl);

      Boost.log('currentDiv.parentNode:' + currentDiv.parentNode.id);
//      insertAfter(currentDiv.parentNode, div, currentDiv);

      $t.browsingHistoryPos++;
      $t.browsingHistory[$t.browsingHistoryPos] = newUrl;
      $t.currentUrl = newUrl;
      if (Boost.xmpp)
        Boost.xmpp.sendMessage("Please 'IM' me", newUrl + "/marco-android");
      return null;
    }

  // hide menu
   optionsDiv.style.visibility = "hidden";
   MobileMenuAnimation.hide();

    return newUrl;
  },
  
  onExisCallback : function(toExit) {
    if (toExit)
      Boost.view.exit();
  },
  
  changePresentationItemsState: function() {
      var item, level;
      var optionsDiv = document.getElementById('menu_Options');

      var selectedItemId = 'menu_Grid';
      var url = Mobile.currentUrl || window.location.href;
      if (url.indexOf('-list=') != -1)
        selectedItemId = 'menu_List';
      else if (url.indexOf('-featured=') != -1)
        selectedItemId = 'menu_LargeGrid';

      item = getChildById(optionsDiv, 'menu_List');
      level = (selectedItemId == 'menu_List') ? 0.5 : 1;
      changeOpacity(item, level);

      item = getChildById(optionsDiv, 'menu_Grid');
      level = (selectedItemId == 'menu_Grid') ? 0.5 : 1;
      changeOpacity(item, level);

      item = getChildById(optionsDiv, 'menu_LargeGrid');
      level = (selectedItemId == 'menu_LargeGrid') ? 0.5 : 1;
      changeOpacity(item, level);
  },

  writeBrowsingHistoryOnServer: function(e, link) {
    if ($t.browsingHistory <= 1)
      return;
    var params = '';
    for (var i=0; i<$t.browsingHistory.length; i++) {
      if (i != 0)
        params += ';';
      var pageUrl = $t.browsingHistory[i];
      params += ';pageUrl=' + encodeURIComponent(pageUrl) + '&title=';
      var div = $t.urlToDivs[pageUrl];
      var divs = div.getElementsByTagName('div');
      var titleDiv;
      for (var i=0; i<divs.length  &&  titleDiv == null; i++) {
        var tDiv = divs[i];
        if (tDiv.id  &&  tDiv.id == 'title')
          params += encodeURIComponent(tDiv.innerHTML);
      }
    }
  },

  /***** solves problem of Back button and history for Ajax *****/
  setLocationHash: function(newUrl) {

    this.curHash = newUrl;
    location.hash = encodeURIComponent(newUrl);

    /*
    if (location.hash != "")
      return;
    */
  },
  checkLocation: function() {
    var $t = Mobile;
    var hashVal;
    if (Browser.gecko)
      hashVal = location.hash.substr(1);
    else
      hashVal = decodeURIComponent(location.hash).substr(1);

    if (hashVal.length == 0) {
      hashVal = location.href;
      if (!$t.curHash)
        $t.curHash = hashVal;
    }

    if ($t.curHash && hashVal != $t.curHash) {
      // check back or forward
      if ($t.browsingHistory &&
            $t.browsingHistory[$t.browsingHistoryPos - 1] == hashVal) {
        $t.oneStep(null, -1, false);
      }
      else if ($t.browsingHistory &&
            $t.browsingHistory[$t.browsingHistoryPos + 1] == hashVal) {
        $t.oneStep(null, 1, false);
      }
      else {
        $t.getPage(null, hashVal);
      }
      $t.curHash = hashVal;
      Mobile.changePresentationItemsState();
    }
    setTimeout($t.checkLocation, 100);
  },

  showHistoryView : function() {
    var TOP_OFFSET = 100; // for "big" topBar
    var SPACE = 30;
    this.isHistoryView = true;

    MobileMenuAnimation.hide();
    var scrWidth = this.getScreenWidth();
    if (Boost.zoom)
      Boost.zoom.setZoomWidth(scrWidth * 2 + SPACE * 3);

    var idx = 0;
    var fstColBottom = TOP_OFFSET;
    var sndColBottom = TOP_OFFSET;

    for (var url in this.urlToDivs) {
      var div = this.urlToDivs[url]
      var divStl = div.style;
      if (!divStl)
        continue;

      // show BIG topBar
      if (idx == 0) {
        var parent = div.parentNode;
        var bigTopBar = getChildByAttribute(parent, "className", "topBar_big");
        if (!bigTopBar) {
          bigTopBar = document.createElement('div');
          bigTopBar.className = "topBar_big";
          var htmlTmp = "<a onclick=\"Mobile.onHistoryList();\" class='button'>List</a>";
          htmlTmp += "<a onclick=\"Mobile.hideHistoryView(Mobile.getCurrentPageDiv());\" class='button_left'>Back</a>";
          bigTopBar.innerHTML = htmlTmp;
          parent.appendChild(bigTopBar);
        }
        bigTopBar.style.display = "";
      }
      var isFirstCol = (idx % 2 == 0) ? true : false;

      if(isFirstCol) {
        divStl.left = SPACE;
        divStl.top = SPACE + fstColBottom;
      }
      else {
        divStl.left = scrWidth + SPACE * 2;
        divStl.top = SPACE + sndColBottom;
      }

      divStl.width = scrWidth;
      divStl.position = "absolute";
      divStl.border = "solid 1px #000";

      divStl.visibility = "visible";
      divStl.display = "";

      if (isFirstCol)
        fstColBottom += SPACE + div.clientHeight;
      else
        sndColBottom += SPACE + div.clientHeight;

      // show title text instead the topBar minified pages.
      var topBar = getChildByAttribute(div, "className", "topBar");
      if (topBar) {
        topBar.className = "topBar_history";
        // page title can require text.
        var title = getChildByAttribute(div, "className", "title");
        if (title.innerHTML.length == 0) {
          var titleText = this.getPageTitle(div);
          title.innerHTML = titleText;
        }
      }
      if (!this.urlToDivs[url].onclick) {
        this.urlToDivs[url].onclick = this.onPageSelectFromHistoryView;
        this.urlToDivs[url].ondblclick = this.onPageSelectFromHistoryView;
      }
      //addEvent(this.urlToDivs[url], "click",  this.onPageSelectFromHistoryView, true);
      this.setTitleText("History View - Mobile Social Net");
      idx++;
    }
  },
  hideHistoryView: function(targetPage) {
    var $t = Mobile;
    // hide all pages
    for (var url in $t.urlToDivs) {
      var div = $t.urlToDivs[url]
      var divStl = div.style;
      if (!divStl)
        continue;

      divStl.visibility = "hidden";
      divStl.display = "none";
      divStl.border = "";

      var topBar = getChildByAttribute(div, "className", "topBar_history");
      if (topBar)
        topBar.className = "topBar";

      $t.isHistoryView = false;

      $t.urlToDivs[url].onclick = null;
      $t.urlToDivs[url].ondblclick = null;
     // removeEvent($t.urlToDivs[url], "click",  $t.onPageSelectFromHistoryView, true);
    }
    // show target page
    var targetPageStl = targetPage.style;
    targetPageStl.border  = "";
    targetPageStl.left = 0;
    targetPageStl.top = MobilePageAnimation.getPageTopOffset();
    targetPageStl.visibility = "visible";
    targetPageStl.display = "";

    // hide the bigTopBar
    var parent = targetPage.parentNode;
    var bigTopBar = getChildByAttribute(parent, "className", "topBar_big");
    if (bigTopBar)
      bigTopBar.style.display = "none";

    window.scrollTo(0, 0);
    // return to normal scale
    if (Boost.zoom) {
      Boost.zoom.setZoomWidth($t.getScreenWidth());
    }
    $t.setTitle(targetPage);
  },
  onPageSelectFromHistoryView: function(e) {
    var $t = Mobile;

    if (!$t.isHistoryView)
      return;

    e = getDocumentEvent(e);
    var target = getEventTarget(e);
    var targetPage = getAncestorById(target, "mainDiv");
    if (!targetPage)
      targetPage = getAncestorByAttribute(target, "className", "mobile_page");

    if (!targetPage)
      return;

    $t.hideHistoryView(targetPage);
    return stopEventPropagation(e);
  },

  onHistoryList: function() {
    // need to implement
  },

  onClick: function(e) {
    var $t = Mobile;
    e = getDocumentEvent(e);

    var l = getEventTarget(e);
//    if (!Popup.android  &&  l.tagName.toUpperCase() != 'A'  &&  l.tagName.toUpperCase() != 'IMG')
//      return;

    var link = getAncestorByTagName(l, "a"); //getAnchorForEventTarget1(l);
    if (!link || !link.href || link.href == null)
      return true;
    
    if (link.className == "external") // go to other web site
      return true;
      
    var ln = link.href;
    if ($t._preventingDoubleClick)
      return stopEventPropagation(e);

    if (ln.startsWith('tel:')) {
      if (Boost.phone) {
        Boost.phone.dial(ln.substring(4));
        return stopEventPropagation(e);
      }
      else
        return true;
    }
    var idx = ln.indexOf(':');
    // take precautions to load only normal urls via ajax
    if (idx != -1) {
      var ln1 = ln.substring(0, idx);
      if (idx + 1 == ln.length)
        return true;
      var c = ln.charAt(idx + 1);
      if (ln1.match(/^[a-zA-Z]+$/) && // schema is letters only
         !(c >= '0' && c <= '9')) { // if no number after colon (e.g. :8080) - then it must be a schema
        // we plan to handle these URL schemas soon
        //if (ln.startsWith('sms:') || ln.startsWith('mailto:') || ln.startsWith('wtai:'))
        if (ln1 != 'http' && ln1 != 'https' && ln1 != 'about' && ln1 != 'javascript')
          return true;
      }
    }

    if (ln.endsWith('.gif') || ln.endsWith('.png') || ln.endsWith('.jpg') || ln.endsWith('.jpeg') || ln.endsWith('.svg')
         || (ln.startsWith('javascript') && link.id.length == 0))
      return true;
    // social nets buttons: should be directed to social nets web-sites 
    if (getAncestorByTagName(link, "div").id.indexOf("LoginDiv") != -1)  
      return true;
    if (link.className  &&  link.className == "external")
      return true; 
      
    return $t.getPage(e, link);
  },

  // intoCurrentPage in case of data entry
  getPage: function(e, link, intoCurrentPage) {
    var $t = Mobile;
    if (!$t.currentUrl) {
      $t.currentUrl = document.location.href;
      var s = new Array();
      s[0] = $t.currentUrl;
      $t.browsingHistory = s;
    }

    var newUrl;
    if (typeof link == 'string')
      newUrl = link;
    else {
      // mobileMenu returns link.href or url based on
      // menu item ID.
      newUrl = $t.mobileMenu(e, link);
    }
    if (!newUrl) {
      return stopEventPropagation(e);
    }

    var isMore;
    var isRemoteLink;
    
    if (link.id == "-inner")
      return; // dialog processed in onClickDisplayInner
    
    if (link.target) {
      // Remote link like 'Locate <avatar>'
      if (link.target == '_self') {
        Boost.view.setProgressIndeterminate(true);
        document.location.replace(newUrl);
        return;
      }
      isMore = link.target == '_replace';
      if (isMore) {
        var id = link.id;
        if (id  &&  id.startsWith('recNmb_')) {
//          var recNmb = parseInt(id.substring(7));
          var newRecNmb = parseInt(id.substring(7));// + 10;
          link.id = 'recNmb_' + newRecNmb;
          var idx = $t.currentUrl.indexOf('recNmb=');
          if (idx == -1)
            newUrl = $t.currentUrl + '&recNmb=' + newRecNmb;
          else {
            var idx1 = $t.currentUrl.indexOf('&', idx);
            if (idx1 == -1)
              newUrl = $t.currentUrl.substring(0, idx) + '&recNmb=' + newRecNmb;
            else
              newUrl = $t.currentUrl.substring(0, idx) + $t.currentUrl.substring(idx1) + '&recNmb=' + newRecNmb;
          }
        }
      }
    }
    if (!newUrl  ||  newUrl == 'about:blank' && !isMore)
      return stopEventPropagation(e);
    var isRefresh = newUrl == 'refresh';
    if (!isRefresh && !isMore && !intoCurrentPage)
      $t.browsingHistoryPos++;

    var currentDiv;
    if ($t.urlToDivs)
       currentDiv = $t.urlToDivs[$t.currentUrl];
    if (!currentDiv) {
      currentDiv = document.getElementById('mainDiv');
      var s = new Array();
      s[$t.currentUrl] = currentDiv;
      $t.urlToDivs = s;
      //$t.urlToDivs[$t.currentUrl] = currentDiv;
    }
    if ($t.currentUrl == newUrl) {
      currentDiv.style.visibility = "visible";
      currentDiv.style.display = "inline";
      return stopEventPropagation(e);
    }
    if (isRefresh)
      newUrl = $t.currentUrl;
    else if (!isMore) {
      $t.browsingHistory[$t.browsingHistoryPos] = newUrl;

      // clear forward history
      for (var i=$t.browsingHistoryPos + 1; i<$t.browsingHistory.length; i++) {
        if (!$t.browsingHistory[i])
          break;
        $t.browsingHistory[i] = null;
      }
    }

    var div;
    if (isMore) {
      if (intoCurrentPage) 
        div = currentDiv;
      else {
        div = document.createElement("DIV");
        // class "mobile_page" to distinguish it as a page.
        div.className = "mobile_page";
        div.style.visibility = "hidden";
        div.style.display = "none";
      }
    }
    else {
     // page is in history
      div = $t.urlToDivs[newUrl];
      $t.currentUrl = newUrl;
      if (div  &&  !isRefresh) {
        $t.setTitle(div);
        MobilePageAnimation.showPage(currentDiv, div);
        $t.setLocationHash(newUrl);
        return stopEventPropagation(e);
      }
      
      // new mobile page
      if (intoCurrentPage) 
        div = currentDiv;
      else {
        div = document.createElement("DIV");
        div.className = "mobile_page";
      }
      $t.urlToDivs[newUrl] = div;
    }
    var urlParts = newUrl.split('?');
    var url = urlParts[0];
    var idx = url.lastIndexOf('/');
    if (url.indexOf('.html') != -1)
      url = url.substring(0, idx + 1) + 'm' + url.substring(idx);
    var loadedFromCache = false;
    if (Boost.cache) {
      var id = link.id;
      if (id  &&  (id == 'menu_Reload' || id == 'menu_Refresh'))
        loadedFromCache = false;

      /*
      else {
        var content = Boost.cache.get(newUrl);
        if (content) {
          Boost.log("getting content from cache for url " + newUrl);
          loadedFromCache = true;
          loadPage(e, div, link, content, div);
        }
      }
      */
    }
    if (isMore)
      loadFromCache = false;
    if (loadedFromCache == true)
      return stopEventPropagation(e);

    $t._preventingDoubleClick = true;
    if (isMore) 
      postRequest(e, url, urlParts[1], div, null, $t._loadMoreItems);
    else
      postRequest(e, url, urlParts[1], div, null, loadPage);

    // loadPage
    function loadPage(event, div, hotspot, content, url) {
      $t._preventingDoubleClick = false;

      // if server returned HTML containing "panel_block"
      // then it is data entry dialog with error message.
      if (content.indexOf("panel_block") != -1) {
        // "roll back" appending of new div
				if (div.parentNode) {
					div.parentNode.removeChild(div);
					delete $t.urlToDivs[$t.currentUrl];
					$t.browsingHistoryPos--;
					$t.currentUrl = $t.browsingHistory[$t.browsingHistoryPos];
				}
        DataEntry.onDataEntryLoaded(event, div, hotspot, content, url, true);
        // hides the location bar
        scrollTo(0, 1);
        return;
      }

  
	    // login page: it contains register/hashScript.js
	    // remove register if it was previously created
	    var regDiv = document.getElementById("register");
	    if (regDiv)
	      regDiv.parentNode.removeChild(regDiv);
	    // create register dialog an initialize it
	    if (content.indexOf("register/hashScript") != -1) {
	      var regDiv = getDomObjectFromHtml(content, "id", "register");
	      if (regDiv) {
	        regDiv.className = "mobile_dlg";
	        document.body.appendChild(regDiv);
	        scrollTo(0, 1);
	        setDivVisible(event, regDiv, hotspot);
	        // execute inner script for social nets
	        ExecJS.runDivCode(regDiv);
	        // download hashScript.js on demand with timestamp suffix
	        LoadOnDemand.includeJS("register/hashScript_" + g_onDemandFiles['register/hashScript.js'] + ".js");
	        // set flag '.jstest' that JS is enabled (note: use 'DOM' instead of 'form')
	        var jstest = getChildByAttribute(regDiv, "name", '.jstest');
	        jstest.value = "ok";
	        return;
	      }
	    }
    
		  // update mobile menu after log in
      if (content.indexOf("menu_Options") != -1) {
        var newOptDiv = getDomObjectFromHtml(content, "id", "menu_Options");
        var oldOptDiv = document.getElementById("menu_Options");
        var parent = oldOptDiv.parentNode;
        parent.removeChild(oldOptDiv);
        parent.appendChild(newOptDiv);
      }
			
			// finally, set NEW PAGE content
      // hack: in case if serever returns full html page instead
      //(page with error message, for example; generated from widget/page.jsp)
      // mobile_page div content then retrieve mobile_page content only
      var page = getDomObjectFromHtml(content, "className", "mobile_page");
      if (page != null) {
        page.id = "";
	  		content = page.innerHTML;
      }
 			setInnerHtml(div, content);
			$t.setTitle(div);
			
      // init for each new 'mobile' page
      FormProcessor.initForms();
              
      // in case of data entry put content in current div, so no sliding effect
      if (intoCurrentPage)
        return;

      $t.onPageLoad(newUrl, div);
      if (Boost.cache && loadedFromCache == false) {
        Boost.log("putting content into cache from " + newUrl);
        Boost.cache.put(newUrl, content);
      }
      if (currentDiv != null)
        MobilePageAnimation.showPage(currentDiv, div);
      else {
        div.style.visibility = "visible";
        div.style.display = "inline";
        Boost.view.setProgressIndeterminate(false);
      }
//      var offset = getElementCoords(div);
//      window.scroll(offset.left, offset.top);
      $t.setLocationHash(newUrl);
    }
    
    return stopEventPropagation(e);
  },
  
  _loadMoreItems: function(event, div, hotspot, content) {
    var $t = Mobile;

   // setInnerHtml(div, content);
    div.innerHTML = content;

    var elms = div.getElementsByTagName('table');
    var table;
    
    for (var i=0; i<elms.length; i++) {
      var tt = elms[i];
      
      if (tt.id && tt.id.startsWith('siteRL_')) {
        table = tt;
        break;
      }
    }
    $t._preventingDoubleClick = false;
    
    if (!table)
      return;
      
    var tbody = table.getElementsByTagName('tbody')[0];

    var currentDiv = $t.urlToDivs[$t.currentUrl];
    elms = currentDiv.getElementsByTagName('tr');
    var tr;
    var totalsTR;
    var headerTR;

    for (var i=0; i<elms.length; i++) {
      var tt = elms[i];
      if (tt.id) {
        if (!tr  &&  tt.id == '_replace')
        tr = tt;
        else if (totalsTR  &&  tt.id == 'totals')
          totalsTR = tt;
        else if (tt.className == 'header')
          headerTR = tt;
      }
    }
    
    if (!tr)
      return;

    var curTbody = tr.parentNode;
    // insert new records
    curTbody.parentNode.appendChild(tbody);
    // "Get 10 More" / "_replace" can be out of new tbody - insert it additionaly
    if (getChildById(tbody, "_replace") == null)
      curTbody.parentNode.appendChild(getChildById(table, "_replace"));
    
    var coords = getElementCoords(tr);
    tr.className = "hdn";
    tr.id = '';
    if (totalsTR) {
      totalsTR.className = 'hdn';
      totalsTR.id = '';
    }
    Boost.view.setProgressIndeterminate(false);
    Boost.log('left = ' + coords.left + '; top = ' + coords.top);
  
    window.scrollTo(coords.left, coords.top);
  },

  // browsing history forward and backward
  // softKeyPressed: default = true
  oneStep: function(e, step, softKeyPressed) {
    if (typeof softKeyPressed == 'undefined')
      softKeyPressed = true;

    Filter.hide();
    DataEntry.hide();
    
    // optionsDiv is common for all mobile pages
    var optionsDiv = document.getElementById('menu_Options');
    // options menu opened no passes in history
    if (optionsDiv && optionsDiv.style.visibility == "visible")
      return;

    var $t = Mobile;
    $t.browsingHistoryPos += step;

    var l = $t.browsingHistory ? $t.browsingHistory.length : 0;

    if ($t.browsingHistoryPos < 0  || $t.browsingHistoryPos >= l) {
      $t.browsingHistoryPos -= step;
      if (e)
        return stopEventPropagation(e);
      else
        return;
    }

    var url = $t.browsingHistory[$t.browsingHistoryPos];
    if (!url) {
      $t.browsingHistoryPos -= step;
      if (e)
        return stopEventPropagation(e);
      else
        return;
    }
    var div = $t.urlToDivs[url];

    if (!$t.currentUrl)
      $t.currentUrl = document.location.href;
    var currentDiv = $t.urlToDivs[$t.currentUrl];
    $t.currentUrl = url;

    if (div) {
      var title = $t.setTitle(div);
//      if (Popup.android)
//        Boost.browserHistory.writeHistory(url, title);
      Boost.log("starting sliding");
      
      if (softKeyPressed) {
        $t.curHash = null;
        history.go(step);
        
        var hashVal;
        if (Browser.gecko)
          hashVal = location.hash.substr(1);
        else
          hashVal = decodeURIComponent(location.hash).substr(1);
        if (hashVal.length == 0) {
          hashVal = location.href;
        }
          $t.curHash = hashVal;
      }
      
      MobilePageAnimation.showPage(currentDiv, div, step < 0);
    }
    if (e)
      return stopEventPropagation(e);
    else
      return;
  },

  isBackAvailable : function() {
    if (!this.browsingHistory)
      return false;
    return this.browsingHistoryPos > 0;
  },
  
  isForwardAvailable : function() {
    if (!this.browsingHistory)
      return false;
    return this.browsingHistoryPos < this.browsingHistory.length - 1;
  },

  displayActionsAndViewsFor: function(div, optionsDiv) {
    var $t = Mobile;
    var isAdd = $t.getElementById('add_url_hdn') != null;
    var isEdit = $t.getElementById('edit_url_hdn') != null;
    var isDelete = $t.getElementById('delete_url_hdn') != null;

    var addA = document.getElementById('menu_Add');
    var addTd = addA.parentNode;
    if (isAdd)
      addTd.className = '';
    else
      addTd.className = 'hdn';
    var editA = document.getElementById('menu_Edit');
    var editTd = editA.parentNode;
    if (isEdit)
      editTd.className = '';
    else
      editTd.className = 'hdn';
    var delA = document.getElementById('menu_Delete');
    var delTd = delA.parentNode;
    if (isDelete)
      delTd.className = '';
    else
      delTd.className = 'hdn';

    var divs = div.getElementsByTagName('div');
    var viewsDiv;
    for (var i=0; i<divs.length  &&  viewsDiv == null; i++) {
      var tDiv = divs[i];
      if (tDiv.id  &&  tDiv.id == 'options_Views')
        viewsDiv = tDiv;
    }
    var views;
    if (viewsDiv) {
      views = viewsDiv.innerHTML;
      if (!views  ||  trim(views).length == 0)
        views = null;
      else
        views = views.split(',');
    }
    var trs = optionsDiv.getElementsByTagName('table');
    var viewsTr;
    for (var i=0; i<trs.length  &&  !viewsTr; i++) {
      var tr = trs[i];
      if (!tr.id  ||  tr.id != 'menu_Views')
        continue;
      viewsTr = tr;
    }
    if (!viewsTr)
      return;
    if (views) {
      viewsTr.style.visibility = "";
      viewsTr.style.display = "inline";
    }
    else {
      viewsTr.style.visibility = "hidden";
      viewsTr.style.display = "none";
      return;
    }

    var tds = viewsTr.getElementsByTagName('td');
    var found;
    for (var i=0; i<tds.length; i++) {
      var td = tds[i];
      var id = td.id;
      if (!id)
        continue;
      found = false;
      for (var j=0; j<views.length  &&  !found; j++) {
        if (views[j] == id) {
          td.style.visibility = "";
          found = true;
        }
      }
      if (!found)
        td.style.visibility = "hidden";
    }

  },
  getPageTitle: function(pageDiv) {
    var divs = pageDiv.getElementsByTagName('div');
    var titleDiv;
    for (var i=0; i<divs.length  &&  titleDiv == null; i++) {
      var tDiv = divs[i];
      if (tDiv.id  &&  tDiv.id == 'title') {
        titleDiv = tDiv;
        break;
      }
    }
    var t = null;
    if (titleDiv)
      t = titleDiv.innerHTML;

    return t;
  },
  setTitle: function(pageDiv) {
    var title = this.getPageTitle(pageDiv);
    if (!title)
      return null;
    this.setTitleText(title);
    return title;
  },
  setTitleText: function(title) {
    if (Boost.view && typeof Boost.view.setTitle != 'undefined') {
      Boost.log("setting title to: " + title);
      Boost.view.setTitle(title);
    }
    else
      document.title = title;
  },
  refresh: function(e) {
    $t = Mobile;
    if ($t.currentUrl) {
      document.location.href = $t.currentUrl;
      return stopEventPropagation(e);
    }
  },

  getScreenWidth : function() {
    if (Boost.zoom)
      return Boost.zoom.getScreenWidth();
    else
      return getWindowSize()[0];
  },
  // currently all mobile pages in a document, so return element from the current page
  getElementById : function(id) {
   return getChildById(this.getCurrentPageDiv(), id);
  }
}


/**********************************************
 * MobilePageAnimation
 * + checks orientation and fit page width
 **********************************************/
var MobilePageAnimation = {
  dlgDiv : null,
	dlgDivToHide : null,
  isInitialized : false,

  init : function() {
    this.isInitialized = true;
    var div = document.getElementById('mainDiv');
    if (div) {
      div.position = "absolute";
      this.curDiv = div;
      this.pageTopOffset = getTop(div);
    }
  },
  
  showPage : function(curDiv, newDiv, isBack) {
    if (!this.isInitialized)
      return; // expected not loaded DOM

    if(!curDiv || !curDiv.parentNode || !newDiv)
      return;

    if (typeof isBack == 'undefined')
      isBack = false;
    
    setTransformProperty(curDiv, "translate(0%, 0%)");
    setTransformProperty(newDiv, "translate(" + (isBack ? -1 : 1) * 100 + "%, 0%)");
    
    setTransitionProperty(curDiv, "transform 0.5s ease-in-out", MobilePageAnimation._onPageSlidingEnd);
    setTransitionProperty(newDiv, "transform 0.5s ease-in-out");

    scrollTo(0, 1);
    curDiv.parentNode.insertBefore(newDiv, null); 
 
    setTimeout(function f() { setTransformProperty(curDiv, "translate(" + (isBack ? 1 : -1) * 100 + "%, 0%)"); }, 150)
    setTimeout(function f() { setTransformProperty(newDiv, "translate(0%, 0%)") }, 150)
  },
  
  _onPageSlidingEnd : function(event) {
    var hiddenPage = getEventTarget(event);
    removeTransitionCallback(hiddenPage, MobilePageAnimation._onPageSlidingEnd);
    // remove hidden page to avoid several elements with the same ID, for example
    hiddenPage.parentNode.removeChild(hiddenPage);
    // here possible to call some other new page initializations
  },
  showDialog : function(div) {
    this.dlgDiv = div;
    div.style.top = getScrollXY()[1] + 'px';
    div.style.minHeight = getWindowSize()[1] + 'px';
    setTransformProperty(div, "scale(0.1)");
		if (div.id != "browser_dlg") // browser_dlg is our alert dialog
		  appendClassName(div, "mobile_dlg");
    div.style.visibility = "visible";
    if (!isDialogOnPage(div))
      setTransitionCallback(div, MobilePageAnimation._onZoomInDialogEnd); 
    // on fast animation a dialog can disapeared for a moment
    // so 0.8 sec was changed on 1.2 sec (as minimum)
    setTimeout(function f() { setTransitionProperty(div, "all 1.2s ease-in-out"); setTransformProperty(div, "scale(1.0)"); div.style.opacity = "1.0"} , 150);
  },
   _onZoomInDialogEnd : function(event) {
    var $t = MobilePageAnimation;
			
    Mobile.getCurrentPageDiv().style.opacity = 0;
    removeTransitionCallback($t.dlgDiv, MobilePageAnimation._onZoomInDialogEnd); 
  },
  
  hideDialog : function(div) {
    if (!isVisible(div))
		  return;
    this.dlgDivToHide = div;
    setTransitionCallback(div, MobilePageAnimation._onZoomOutDialogEnd); 
    Mobile.getCurrentPageDiv().style.opacity = 1
    setTransformProperty(div, "scale(0.1)");
    div.style.opacity = "0.1";
  },
  
  _onZoomOutDialogEnd : function() {
    var $t = MobilePageAnimation;
    // remove dialog from document to avoid interference with other dialogs
 		$t.dlgDivToHide.parentNode.removeChild($t.dlgDivToHide);
    removeTransitionCallback($t.dlgDivToHide, MobilePageAnimation._onZoomOutDialogEnd); 
  },

  getPageTopOffset : function() {
    return this.pageTopOffset;
  }
}


/**********************************
 * MobileMenuAnimation
 **********************************/
var MobileMenuAnimation = {
  optionsDiv : null,
  editItem : null,

  show : function(curPageDiv, optionsDiv) {
    this.optionsDiv = optionsDiv;
    setTransitionProperty(this.optionsDiv, "opacity 0.5s ease-in-out");
    this.editItem = getChildById(this.optionsDiv, 'menu_Edit');
    
    // hide menu if it is already opened
    if(isVisible(this.optionsDiv)) {
      this.hide();
      return;
    }
    this.setEditItemState();
    
    var optDivStl = this.optionsDiv.style;
    // set menu position in accordance to current "scrolled" position
    optDivStl.top = window.pageYOffset; 
    optDivStl.zIndex = curPageDiv.style.zIndex + 1;
    optDivStl.display = "block";
    optDivStl.visibility = "visible";
    optDivStl.opacity = 1.0;
  },
  
  setEditItemState : function() {
    var page = Mobile.getCurrentPageDiv();
    var a = getChildById(page, 'edit_url_hdn');
    if (a == null) 
      changeOpacity(this.editItem, 0.3);
    else
      changeOpacity(this.editItem, 1.0);
  },
  
  hide : function() {
		if (!this.optionsDiv)
		  return;
    setTransitionCallback(this.optionsDiv, this._finishHide);
    this.optionsDiv.style.opacity = "0.1";
  },
  _finishHide: function(){
    var $t = MobileMenuAnimation;
    MobileMenuAnimation.optionsDiv.style.visibility = "hidden";
    removeTransitionCallback($t.optionsDiv, $t._finishHide);
  }
}

/** Set password and deviceId for mobile registration */
function setHiddenFields() {
//  Boost.log("setHiddenFields()");
  var f = document.forms['loginform'];
  var wasSubmitted = f.getAttribute("wasSubmitted");
  if (wasSubmitted) {
//    Boost.log("Can not submit the same form twice");
    return false;
  }
  f.setAttribute("wasSubmitted", "true");
  var userId = f.elements['j_username'];
  Boost.user.setUserId(userId.value);
  var avatarName = f.elements['name'];
  avatarName.value = userId.value;

  var pwd = f.elements['j_password'];
  pwd.value = Boost.user.getPassword();

  var deviceId = f.elements['j_deviceId'];
  deviceId.value = Boost.user.getDeviceId();
}

function addWithoutProcessing(event) {
  var $t = Mobile;
  var chatRoom = $t.currentUrl;
  var idx = chatRoom.indexOf('@');
  var elms = this.getElementsByTagName('INPUT');
  for (var i=0; i<elms.length; i++) {
    var elm = elms[i];
    if (elm.name == '.title')
      subject = elm;
  }
  var contactName = $t.myScreenName;
  var tbodyId = 't_chat';
  return addBeforeProcessing(chatRoom, tbodyId, subject, event);
}
// adds comment/resource before server confirms that resource was successfully created
function addBeforeProcessing(chatRoom, tbodyId, subject, event) {
  chatRoom = chatRoom.toLowerCase();
  var retCode = stopEventPropagation(event);
  var $t = Mobile;
  var msg;
  msg = subject.value;
  subject.value = '';
  if (Browser.mobile) {
    window.scrollTo(0, 3000);
//    subject.focus();
//    android.scroll();
//    Boost.log('sending message: ' + msg);
//    chatRoom = "neoyou@conference.sage";  // hack
    var roomUrl = $t.chatRooms[chatRoom];
    if (!roomUrl  &&  chatRoom.indexOf('@') != -1) {
      roomUrl = chatRoom;
//      Boost.xmpp.sendMessage(msg, roomUrl + "/marco-android");
    }
//    else
//      Boost.xmpp.sendMessage(msg, null);
    var roomDiv = $t.urlToDivs[roomUrl];
//    Boost.log('roomUrl: ' + roomUrl + '; roomDiv: ' + roomDiv);
    var chatIdDiv = document.getElementById('-chat')
    var e = {
      getBody:   function() {return msg},
      getSender: function() {return $t.myName + '@' + $t.XMPPHost},
      getTime:   function() {return new Date().getTime()}
    };
    $t.insertChatMessage(e, roomDiv);
  }
  /*
  else {
    var form = document.forms['tablePropertyList'];
    var params = getFormFilters(form, true) + "&-noRedirect=y";
    postRequest(event, 'mkresource', params, div, newTr, updateTR);
  }
  */
  return retCode;

  function updateTR(event, body, hotspot, content)  {
  }
}

/*******************************************************************
* SpriteAnimation - use it instead animated GIF on iPhone
* if parent is "undefined"  then place it in right top corner of screen
*******************************************************************/
/* NOT used currently
function spriteAnimation(src, parent) {
  var $t = this;
  
  this.RIGHT_OFFSET = "7px";
  this.TOP_OFFSET = "50px";
  this.zIndex = "100";

  this.stl = null;

  this.parent = parent;
  
  this.frameWidth; 
  this.frameHeight;
  this.framesAmt;
  this.frameTimeout;
  
  this.step = 0;
  
  this._init = function(src) {
    var div = document.createElement("div");
    this.stl = div.style;
    this.stl.display = "none";
    this.stl.zIndex = this.zIndex;
    
    this.stl.background = "url(" + src + ") 0px 0px";
    
    if (this.parent)
      this.parent.appendChild(div);
    else {
      this.stl.position = "absolute";
      this.stl.right = this.RIGHT_OFFSET;
      this.stl.top = this.TOP_OFFSET;
      document.body.appendChild(div);
    }
  }
  
  this.show = function(frameWidth, frameHeight, framesAmt, frameTimeout) {
    this.frameWidth = frameWidth; 
    this.frameHeight = frameHeight;

    this.framesAmt = framesAmt;
    this.frameTimeout = frameTimeout;
    
    this.stl.width = this.frameWidth + "px";
    this.stl.height = this.frameHeight + "px";
    
    this.stl.display = "";
    setTimeout(this._showFrame, this.frameTimeout);
  }
  
  this.hide = function() {
    this.stl.display = "none";
  }
  
  this._showFrame = function() {
    if ($t.stl.display.toLowerCase() == 'none')
      return;
      
    $t.stl.backgroundPosition = -$t.step * $t.frameWidth + "px " +
        $t.frameHeight + "px";
    
    $t.step++;
    $t.step = $t.step % $t.framesAmt;
    setTimeout($t._showFrame, $t.frameTimeout);
  }
  
  // call initialization function
  this._init(src);
}
*/
  
/*
// window.orientation returns a value that indicates whether iPhone is in portrait mode, landscape mode with the screen turned to the
// left, or landscape mode with the screen turned to the right.
window.onorientationchange = function() {
  var orientation = window.orientation;
  switch(orientation) {
    // portrait mode
    case 0:
    break; 
      
    // landscape mode with the screen turned to the left
    case 90:
      fitGridOnOrientation(false);
    break;

    // landscape mode with the screen turned to the right
    case -90: 
    break;
  }
}
*/
/*
function errorHandler(msg, url, linenumber) {
  Boost.log(msg);
  return true; 
}
window.onerror = errorHandler;
*/