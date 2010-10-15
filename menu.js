/**************** addEvent *****************/
function addEvent(obj, evType, fn, useCapture) {
  if (obj.getAttribute) {
	  var handler = obj.getAttribute('handler_' + evType);
	  if (handler && handler == fn) {
	    //alert("Error: duplicate " + evType + " event handler " + fn + " for " + obj.tagName + " with id " + obj.id);
	    return;
	  }
	  obj.setAttribute('handler_' + evType, fn);
	}
  if (obj.addEventListener) { // NS
    obj.addEventListener(evType, fn, useCapture);
    return true;
  }
  else if (obj.attachEvent) { // IE
    var r = obj.attachEvent("on" + evType, fn);
    return r;
  }
  else {
    alert("You need to upgrade to a newer browser. Error: 'event handler could not be be added'");
  }
}

/**
 * Popup system. Supports menu, dynamicaly generated listboxes, tooltips.
 * Supports row selection (one or many) in menu, listbox. Support stacking up
 * one popup on top of another (e.g.
 */

var keyPressedImgId;
var keyPressedElement;
var autoCompleteTimeoutId;
var keyPressedTime;

Popup.currentDivs          = new Array(); // distinct divs that can be open at
                                          // the same time (since they have
                                          // different canvases)
Popup.popups               = new Array(); // pool of all popups with different
                                          // divId(s)
Popup.openTimeoutId        = null; // timeout after which we need to open the
                                    // delayed popup
Popup.delayedPopup         = null; // the delayed popup
Popup.lastClickTime        = null; // last time user clicked on anything
Popup.lastOpenTime         = null; // moment when last popup was opened
Popup.delayedPopupOpenTime = null; // moment when delayed popup was requested
Popup.tooltipPopup         = null;
Popup.DarkMenuItem  = '#AABFCD'; // '#95B0C3'; //'#dee6e6';
Popup.LightMenuItem = '';
Popup.autoCompleteDefaultTimeout = 200;

Popup.HIDDEN  =  'hidden';
Popup.VISIBLE =  'visible';
if (document.layers) {
  Popup.HIDDEN  = 'hide';
  Popup.VISIBLE = 'show';
}


// for forced position of popup
Popup.POS_LEFT_TOP = 'left_top';

/**
 * returns iframe that serves as a canvas for this popup (overlaying the
 * underlying form fields)
 */
Popup.getCanvas = function (frameRef) {
  var defaultCanvas = 'popupIframe';
  var iframe;
  if (frameRef)
    iframe         = frameRef;
  else {
    iframe         = document.getElementById(defaultCanvas);
    //if (!iframe) // No popupIframe on Mobile
    //  throw new Error("document structure invalid: iframe '" + defaultCanvas + "' is missing");
  }
  return iframe;
};

Popup.allowTooltip = function (target) {
  if (Browser.mobile)
    return false;
    
  var noOpenPopups = true;
  for (var i=0; i<Popup.popups.length; i++) {
    var popup = Popup.popups[i];
    if (typeof popup == 'undefined')
      continue;
    if (popup.isOpen() &&         // if popup is already open then we need only
                                  // tooltips in it (and not the tooltips on
                                  // areas outside popup)
        !popup.isTooltip()) {     // but if open popup is a tooltip - ignore it
      noOpenPopups = false;
      if (popup.contains(target))
        return true;
      else
        continue;
    }
  }
  if (noOpenPopups) // if no open popups - allow tooltip
    return true;
  else
    return false;
};

/**
 * Static function. returns a Popup by divId if exists, otherwise - null
 * mobile: 
 * 1. returns popups currently embeded into a document.
 * 2. popups cancontain single popups or set of popups with the same id;
 *    only one popup with particular id should be in document at a moment.
 */
Popup.getPopup = function (divId) {
  var popup = Popup.popups[divId];
  if (!popup)
    return null;
    
  // popup object
  if (typeof popup.length == 'undefined') {
    if (getAncestorByTagName(popup.div, "body")) 
      return popup;
    else 
      return null;
  }
  // array of popup objects
   else {
    var popupArr = popup;
    for (var i = 0; i < popupArr.length; i++) {
      popup = popupArr[i];
      if (getAncestorByTagName(popup.div, "body") != null)
        return popup;
    }
    return null;
  }
};

/**
 * Open popup after delay
 */
Popup.openAfterDelay = function (event, divId, offsetX, offsetY) {
  // alert('event.clientX: ' + event.clientX + ', offsetX: ' + offsetX + ',
  // divId: ' + divId);

  if ( (Popup.lastOpenTime   && (Popup.lastOpenTime  > Popup.delayedPopupOpenTime)) ||
       (Popup.lastClickTime  && (Popup.lastClickTime > Popup.delayedPopupOpenTime)) ||
       (keyPressedTime       && (keyPressedTime      > Popup.delayedPopupOpenTime))
      ) {
    return; // do not open delayed popup if other popup was already opened
            // during the timeout
  }
	
	
	
  Popup.delayedPopup = null;
  var popup = Popup.getPopup(divId);
  if (popup) {
    popup.open1(event, offsetX, offsetY);
  }
};

/**
 * Static function. Opens a menu with a specified DIV and places it on the
 * screen relative to hotspot (IMG, link, etc). Note: uses frameRef to draw this
 * DIV on top of the iframe in order to block underlying form fields (which
 * otherwise would show through).
 */
Popup.open = function (event, divId, hotspotRef, frameRef, offsetX, offsetY, delay, contents) {
	var divRef = document.getElementById(divId);
  var popup = Popup.getPopup(divId);
  if (popup == null)
    popup = new Popup(divRef, hotspotRef, frameRef, contents);
  else
    popup.reset(hotspotRef, frameRef, contents);

  if (delay) {
    popup.openDelayed(event, offsetX, offsetY, delay);
    return;
  }
  return popup.open1(event, offsetX, offsetY);
};

Popup.delayedClose0 = function (divId) {
  var popup = Popup.getPopup(divId);
  if (!popup)
    return;
  popup.delayedClose();
};

// part of delayed close after the timeout
Popup.delayedClose1 = function (divId) {
  var popup = Popup.getPopup(divId);
  if (!popup)
    return;

  if (!popup.delayedCloseIssued) // delayed close canceled
    return;
  popup.close();
};

Popup.close0 = function (divId) {
  var popup = Popup.getPopup(divId);
  if (!popup)
    return;
  popup.close();
};

/**
 * Loads the ajax popup into the div
 */
Popup.load = function (event, div, hotspot, content) {
  var popup = Popup.getPopup(div.id);
  popup.setInnerHtml(content);
  var div = popup.div;
  
  var tables = div.getElementsByTagName('table');
  /*
  if (popup.firstRow() == null) {
    alert("Warning: server did not return listbox data - check connection to server");
    return;
  }
  */

  // /
  var idx = propName.indexOf(".", 1);
  var shortPropName = propName;
  if (idx != -1)
    shortPropName = propName.substring(0, idx);

  var addToTableName = "";
  if (originalProp.indexOf("_class") != -1) {
    var field = propName + "_class";
    if (document.forms[currentFormName].elements[field].value == "")
      addToTableName = "_class";
  }

//  hideResetRow(div, currentFormName, originalProp);

  popup.open1(event, 0, 16);
  loadedPopups[div.id] = div;
  
};

/**
 * Close popup if mouse cursor is out
 */
Popup.closeIfOut0 = function (divId) {
  var popup = Popup.getPopup(divId);
  if (!popup)
    return;
  popup.closeIfOut();
};

function Popup(divRef, hotspotRef, frameRef, contents) {
  if (!divRef)
    throw new Error("divRef parameter is null");
  if (typeof difRef == 'string')
    throw new Error("div parameter must be an object, not a string");
  if (!divRef.id)
    throw new Error("divRef parameter has no id: " + difRef);
  if (!hotspotRef)
    throw new Error("hotspotRef parameter is null");
  if (typeof hotspotRef == 'string')
    throw new Error("hotspot parameter must be an object, not a string");

  this.div            = divRef;     // div for this popup
  this.iframe         = Popup.getCanvas(frameRef); // iframe beneath this popup
                                                    // (to cover input elements
                                                    // on the page below popup)
  this.hotspot        = hotspotRef; // hotspot that triggered this popup
  this.contents       = contents;
  this.isTooltipFlag  = contents ? true : false;

  this.resourceUri    = null;       // popup was activated for one of the
                                    // properties of the Resource in resource
                                    // list (RL). resourceUri is this resource's
                                    // URI.

  // this.originalProp = null; // Resource property for which popup was
  // activated
  // this.propName = null; // same, but encoded - has extra info such as HTML
  // form name, interface name, etc.
  // this.formName = null; // name of the HTML form which element generated last
  // event in the popup
  this.closeTimeoutId = null;       // timeout after which we need to close this popup
  this.offsetX        = null;       // position at which we have opened last time
  this.offsetY        = null;       // ...
  this.popupClosed    = true;
  this.items          = new Array(); // items of this popup (i.e. menu rows)
  this.currentRow     = null;       // currently selected row in this popup
  this.delayedCloseIssued = false;
  this.initialized    = false;      // it is not yet initialized - event handlers not added
  var self = this;

  // add to the list of popups
  if (typeof Popup.popups[divRef.id] == 'undefined') 
    Popup.popups[divRef.id] = this;
  else {
    if (typeof Popup.popups[divRef.id].length == 'undefined') {
      var tmp = Popup.popups[divRef.id];
      Popup.popups[divRef.id] = new Array();
      Popup.popups[divRef.id].push(tmp);
    }
    Popup.popups[divRef.id].push(this); 
  }
      
  
  //Popup.register(divRef.id, this);

//  this.register = function(id, obj) {
//    Popup.popups[id] = obj;
//  }

  this.reset = function (hotspotRef, frameRef, contents) {
    this.hotspot        = hotspotRef;
    this.iframe         = Popup.getCanvas(frameRef); // iframe beneath this popup (to cover input elements on the page below popup)
    this.contents       = contents;
    this.isTooltipFlag  = contents ? true : false;
  }

  /**
   * Get current div. One div per canvas since a canvas may hold only one div.
   */
  this.getCurrentDiv = function (iframe) {
    var iframeId;
    if (iframe)
      iframeId = iframe.id;
    else if (self.iframe)
      iframeId = self.iframe.id;
    else
      return null;

    return Popup.currentDivs[iframeId];
  }

  this.setCurrentDiv = function () {
    if (self.iframe)
      Popup.currentDivs[self.iframe.id] = self.div;
  }

  this.unsetCurrentDiv = function () {
		if (self.iframe)
    	Popup.currentDivs[self.iframe.id] = null;
  }

  this.contains = function (target) {
    var nodes = self.div.childNodes;
    for (var i=0; i<nodes.length; i++) {
      if (nodes[i] == target)
        return true;
    }
  }

  this.isTooltip = function () {
    return self.isTooltipFlag;
  }

  this.open1 = function (event, offsetX, offsetY) {
    var hotspot = getEventTarget(event);
    var hotspotDim = getElementCoords(hotspot, event);
    if (Popup.tooltipPopup) {
      Popup.tooltipPopup.close();
      Popup.tooltipPopup = null;
    }
    var currentDiv = self.getCurrentDiv();
    if (currentDiv) {
      var curDivId = currentDiv.id;
      var currentPopup = Popup.getPopup(curDivId);

      if (currentPopup) {
        var offsetX1 = currentPopup.offsetX;
        var offsetY1 = currentPopup.offsetY;
        currentPopup.close();
// opening the same popup at the same place? - just quit
        if (self.div.id == curDivId &&
            self.hotspotDim.equals(hotspotDim) &&
            (offsetX1 == offsetX && offsetY1 == offsetY) &&
             self.div.style == 'visible') {
          return;
        }
      }
    }
    self.hotspotDim = hotspotDim;
    self.offsetX = offsetX; // save position at which we have opened last time
    self.offsetY = offsetY;
    Popup.lastOpenTime = new Date().getTime();  // mark when we opened this popup
    
	if (Popup.openTimeoutId) {                  // clear any delayed popup open
      clearTimeout(Popup.openTimeoutId);
      Popup.openTimeoutId = null;
    }
		
    if (self.isTooltip()) {
      self.setInnerHtml(self.contents);
    }
    // alert('visible');
    self.setVisible(event, offsetX, offsetY, hotspotDim);
    self.popupClosed = false;

    self.deselectRow();
    self.setCurrentDiv();
    self.setFocus();
    
    if (!self.initialized) {
			TouchDlgUtil.init(self.div);
      FormProcessor.initForms(self.div);
      self.initilized = true;
    }
    if (self.isTooltip()) {
      Popup.tooltipPopup = self;
      // fit tooltip height
      makeDivAutosize(self.div, true);
      // call "delayedClose" onmouseout
    }
    else
      Popup.tooltipPopup = null;
    return self;
  }

  this.isOpen = function() {
    if (typeof self.popupClosed == 'undefined')
      return false;
    return !(self.popupClosed);
  }

  this.setInnerHtml = function (text) {
    setInnerHtml(self.div, text);
  }

  /**
   * Open delayed popup: initialize a delayed popup and quit
   */
  this.openDelayed = function (event, offsetX, offsetY, delay) {
    Popup.lastOpenTime         = new Date().getTime();
    Popup.delayedPopupOpenTime = new Date().getTime();

    // detected re-entering into the popup - thus clear a delayed close
    self.delayedCloseIssued = false;
	var clonedEvent = cloneEvent(event);

    if (Popup.openTimeoutId) {                  // clear any prior delayed popup open
      clearTimeout(Popup.openTimeoutId);
      Popup.openTimeoutId = null;
    }
    
    Popup.openTimeoutId = setTimeout(function () {Popup.openAfterDelay(clonedEvent, self.div.id, offsetX, offsetY)}, delay);
    Popup.delayedPopup = self;
  }

  /**
   * Show popup
   */
  this.setVisible = function (event, offsetX, offsetY, hotspotDim) {
    return setDivVisible(event, self.div, self.iframe, self.hotspot, offsetX, offsetY, hotspotDim);
  }

  /**
   * Hide popup
   */
  this.setInvisible = function () {
    return setDivInvisible(self.div, self.iframe);
  }

  /**
   * close popup uncoditionally and immediately with no regard to mouse position
   */
  this.close = function () {
    self.popupClosed = true;
    var div      = self.div;
    var divStyle = div.style;
    
    if (divStyle.display == "inline") {
      self.setInvisible();
    }
    self.unsetCurrentDiv();
  }

  /**
   * [Delayed] Close popup
   */
  this.delayedClose = function (timeout) {
    var div   = self.div;
    if (div.style.position.toLowerCase() == "static")
      return;

    var divId = div.id;
    if (timeout == null)
      timeout = 600;
    self.delayedCloseIssued = true;

		if (self.closeTimeoutId != null)
			clearTimeout(self.closeTimeoutId);

    self.closeTimeoutId = setTimeout(function() {Popup.delayedClose1(divId)}, timeout);
	}

  /**
   * Intercept events generated within the popup
   */
  this.interceptEvents = function () {
    var div     = self.div;
    var hotspot = self.hotspot;
   
	  if (!Browser.penBased && !Browser.joystickBased) {
      addEvent(div,     'mouseover', self.popupOnMouseOver, false);
      addEvent(div,     'mouseout',  self.popupOnMouseOut,  false);
      addEvent(hotspot, 'mouseout',  self.popupOnMouseOut,  false);
    }
    
    var firstRow = self.firstRow();
    if (firstRow == null)
      return; // popup structure without rows

    var tables = div.getElementsByTagName('table');
   
    // popup contains rows that can be selected
    if (Browser.ie) { // IE - some keys (like backspace) work only on keydown
      addEvent(div,  'keydown',   self.popupRowOnKeyPress,  false);
    }
    else {          // Mozilla - only keypress allows to call e.preventDefault() to prevent default browser action, like scrolling the page
      addEvent(div,  'keypress',  self.popupRowOnKeyPress,  false);
    }

    var elems = tables[0].getElementsByTagName("tr");
    var n = elems.length;
    
    for (var i = 0; i < n; i++) {
      var elem = elems[i];
      var popupItem = new PopupItem(elem, i);
      self.items[popupItem.id];
      // avoid per-row onClick handler if table has its own
      if (!tables[1] || !tables[1].onclick /*!table.onclick*/) {
        addEvent(elem, 'click',     self.popupRowOnClick,     false);
        var anchors = elem.getElementsByTagName('a');
        if (anchors  &&  anchors.length != 0) {
          var anchor = anchors[0];
          if (anchor.onclick) {
            anchor.onclick1 = anchor.onclick;
            anchor.onclick = '';
          }
          addCurrentDashboardAndCurrentTab(anchor);
          var href = anchor.href;

          // anchors[0].href = 'javascript:;';
          elem.setAttribute('href', href);
          // anchors[0].disabled = true;
        }
      }
			
      addEvent(elem, 'mouseover', self.popupRowOnMouseOver, false);
      addEvent(elem, 'mousedown', self.popupRowOnMouseDown, false);
      addEvent(elem, 'mouseout',  self.popupRowOnMouseOut,  false);
    }
    // reset
    self.currentRow = null;
  }

  /*
   * set keyboard focus on this popup
   */
  this.setFocus = function () {
    // make popup active for key input
    var as = self.div.getElementsByTagName('a');
    if (!as)
      return;
    var a = as[0];
    if(!a)
      return;

    if (a.href == 'about:blank') { // special dummy A tag just to be able to set focus (if does not exist - no need to focus)
      if (document.all) { // simple in IE
        if (self.div.focus)
          try { self.div.focus(); } catch(e) {};
      }
      else {                // hack for Netscape (using an empty anchor element to focus on)
        if (a.focus) {
          try { a.focus(); } catch(e) {};
        }
      }
    }
  }
  /**
   * Popup's on mouseover handler
   */
  this.popupOnMouseOver = function (e) {
    if (typeof getDocumentEvent == 'undefined') return; // js is not yet fully interpreted by the browser
    e = getDocumentEvent(e); if (!e) return;
    var target = getTargetElement(e);
    if (!target)
      return;

    // detected re-entering into the popup - thus clear a timeout
    self.delayedCloseIssued = false;
    if (self.closeTimeoutId != null) {
      clearTimeout(self.closeTimeoutId);
      self.closeTimeoutId = null;
    }
    return true;
  }

  /**
   * Popup's and hotspot's on mouseout handler
   */
  this.popupOnMouseOut = function (e) {
    if (typeof getDocumentEvent == 'undefined') return;
    e = getDocumentEvent(e); if (!e) return;

    var target1 = getEventTarget(e);
    if (target1.tagName.toLowerCase() == 'input')
      return true;

    var target = getMouseOutTarget(e);
    if (!target)
      return true;
    self.delayedClose(600);
    return true;
  }

  // ***************************************** row functions
  // ****************************
  /**
   * This handler allows to use arrow keys to move through the menu and Enter to
   * choose the menu element.
   */
  this.popupRowOnKeyPress = function(e) {
    e = getDocumentEvent(e); if (!e) return;

    var currentDiv = self.getCurrentDiv();
    var characterCode = getKeyCode(e); // code typed by the user

    // the following is for menu of a tab that allows tab name changing.
    var target = getEventTarget(e);
    if (target.tagName.toLowerCase() == 'input')
      return;

    var tr = self.currentRow;
    if (!tr)
      tr = self.firstRow();

    switch (characterCode) {
      case 38:  // up arrow
      case 40:  // down arrow
        break;
      case 9:   // tab
        if (currentDiv) {
          var form = document.forms[currentFormName];
          if (form) {
            var inputField = getOriginalPropField(form, originalProp); //form.elements[originalProp];
            try {
            inputField.focus(); } catch(e) {};
          }
          Popup.close0(currentDiv.id);
        }
        return stopEventPropagation(e);
      case 27:  // esc
        if (currentDiv)
          Popup.close0(currentDiv.id);
        return stopEventPropagation(e);
      case 13:  // enter
        self.popupRowOnClick1(e, tr, target);
        return stopEventPropagation(e);
      case 8:   // backspace or "C" in S60
        if(Browser.s60Browser) {
           if (currentDiv)
              Popup.close0(currentDiv.id);
            return stopEventPropagation(e);
        }
        else {
          if (currentDiv) {
            // var form = getFormNode(self.currentRow);
            var form = document.forms[currentFormName];
            if (form) {
              var inputField = getOriginalPropField(form, originalProp); //form.elements[originalProp];
              setKeyboardFocus(inputField);
              autoComplete1(e, inputField);
              if (characterCode == 8) {
                // problem with IE - move line below to another place
                inputField.value = inputField.value.substring(0, inputField.value.length - 1);
              }
            }
          }
          return stopEventPropagation(e);
        }
    }
    if (characterCode == 40) {       // down arrow
      self.deselectRow();
      self.nextRow();
      self.selectRow();
    }
    else if (characterCode == 38) {  // up arrow
      self.deselectRow();
      self.prevRow();
      self.selectRow();
    }

    return stopEventPropagation(e);
  }

  /**
   * Reacts to clicks inside the popup
   */
  this.popupRowOnClick = function (e) {
		var $t = ListBoxesHandler;
		e = getDocumentEvent(e); if (!e) return;
    var target = getTargetElement(e);
    var tr = getTrNode(target);
    if (!tr)
      return stopEventPropagation(e);
    
 		if (getAncestorByClassName(tr, "classifier_panel") != null) {
			$t.onClassifierItemClick(e, tr);
			return;
		}
 
    var listsContainer = getAncestorById(tr, "lists_container");
    if (listsContainer != null) {
      var isMultipleSel = $t.onOptionsItemClick(tr);
      if (!isMultipleSel)
        //ListBoxesHandler.onBackBtn();
        $t.onOptionsSelectionFinish(tr);
    }

    var ret = self.popupRowOnClick1(e, tr, target);
		self.selectRow();
    stopEventPropagation(e);
    return ret;
  }

  /*************************************************
  * popupRowOnClick1
  * sets values in hidden inputs
  **************************************************/
  this.popupRowOnClick1 = function (e, tr, target) {
    var $t = ListBoxesHandler;

		Popup.lastClickTime = new Date().getTime();
    var currentDiv = self.getCurrentDiv();
   
    if (!tr)
      tr = self.currentRow;
    if (self.isHeaderRow(tr)) // skip clicks on menu header
      return;

    // 1. if there is a link on this row - follow it
    if (target.tagName.toLowerCase() == 'a')
      return;
    if (tr)
      var anchors = tr.getElementsByTagName('A');
    if (anchors  &&  anchors.length != 0) {
      if (currentDiv) {
        loadedPopups[currentDiv.id] = null;
        Popup.close0(currentDiv.id);
      }
      var anchor = anchors[0];
      var trg = anchor.getAttribute('target');
      if (trg) {
        var url = anchor.getAttribute('href');
        window.open(url, trg, "width=600, height=600, top=20, left=20, menubar=no,"
           + "status=0, location=no, toolbar=no, scrollbars=1 status=no, resizable=yes");
        stopEventPropagation(e);
        return true;
      }

      if (anchor.id.startsWith('-inner'))       // display as on-page dialog
        return LinkProcessor.onClickDisplayInner(e, anchor);
      if (anchor.onclick1) {
        anchor.onclick1(e);
      }
      else {
        var href = tr.getAttribute('href', href);
         if (href) {
           stopEventPropagation(e)
          document.location.href = href;
         }
      }
      return false;
    }

    // 2. tr has no id.
    if (!tr.id)
      return;
    
    // 3. id = '$noValue'  
    if (tr.id && tr.id == '$noValue')
      return;
    
    // 4. calendar
    var isCalendar = tr.id.indexOf("_$calendar") != -1 ? true: false;
    if (isCalendar)
      return true;

    // 5. form
    var form = document.forms[currentFormName];
    if (form == null) {
      throw new Error("not found html form for TR: " + tr.id);
    }
    var table  = tr.parentNode;
    var table1 = table.parentNode;

    var propertyShortName = table1.id.substring("table_".length);
    var idx = propertyShortName.lastIndexOf('_');
    propertyShortName = propertyShortName.substring(0, idx);
    var idx = propertyShortName.indexOf(".", 1);
    var prop = null;
    var pLen = propertyShortName.length;
    if (idx == -1) {
      idx = propertyShortName.indexOf("_class");
      if (idx != -1)
        prop = propertyShortName.substring(0, pLen - 6);
      else
        prop = propertyShortName;
    }
    else {
      if (propertyShortName.indexOf(".type") == idx) {
        if (idx + 5 != pLen)
          prop = propertyShortName.substring(0, idx);
        else
          prop = propertyShortName;
      }
      else
        prop = propertyShortName.substring(0, idx);
    }
    
    var chosenTextField = getOriginalPropField(form, originalProp); //form.elements[originalProp];
    var len = chosenTextField.length;
    var verified = prop + "_verified";
    if (currentResourceUri)
      verified = currentResourceUri + ".$" + verified;
    var fieldLabel = document.getElementById(prop + "_span");

    var iclass = prop + "_class";
    var formFieldClass    = form.elements[iclass];
    var formFieldVerified = form.elements[verified];

    // Note: delayed selection finish is like checkboxClicked = true
    var checkboxClicked = true;
    var deleteCurrentDiv = false;
    if (formFieldVerified) {
      if (formFieldVerified.value == 'n')
        deleteCurrentDiv = true;
      formFieldVerified.value = 'y'; // value was modified and is verified
                                      // since it is not typed but is chosen
                                      // from the list
    }

    // row clicked corresponds to a property with range 'interface', meaning
    // that we need to open a list of classes that implement this interface
    if (originalProp.indexOf('_class') != -1) {
      formFieldClass.value = ($t.curClass != null) ? $t.curClass : "";
    }

    var select;
    var isViewCols = currentFormName.indexOf("viewColsList") == 0  ||
                     currentFormName.indexOf("gridColsList") == 0  ||
                     currentFormName.indexOf("filterColsList") == 0;
    
    if (isViewCols)
      select = prop;
    else
      select = prop + "_select";
    if (currentResourceUri)
      select = currentResourceUri + ".$" + select;
    var formField = form.elements[select];
    
    var selectItems = form.elements[select];
    if (tr.id.indexOf('$clear') == 0) {
      if (isViewCols) {
        // form url based on parameters that were set
        var formAction = form.elements['-$action'].value;
        var allFields = true;
        if (formAction == "showproperties")
          allFields = false;
        var params;
        var arr = new Array(3);
        if (currentFormName.indexOf("viewColsList") == 0) {
          arr["-viewCols"] = "-viewCols";
          arr[".-viewCols"] = ".-viewCols";
          arr["-curViewCols"] = "-curViewCols";
        }
        else if (currentFormName.indexOf("gridColsList") == 0) {
          arr["-gridCols"] = "-gridCols";
          arr[".-gridCols"] = ".-gridCols";
          arr["-curGridCols"] = "-curGridCols";
        }
        else {
          arr["-filterCols"] = "-filterCols";
          arr[".-filterCols"] = ".-filterCols";
          arr["-curFilterCols"] = "-curFilterCols";
        }
        params = FormProcessor.getFormFilters(form, allFields, arr, true);
        var formAction = form.elements['-$action'].value;
        var baseUriO = document.getElementsByTagName('base');
        var baseUri = "";
        if (baseUriO) {
          baseUri = baseUriO[0].href;
          if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
            baseUri += "/";
        }
        var url = baseUri + "l.html?" + params;
        document.location.replace(url);
        return;
      }
      else {
        if (prop.length > 8  &&  prop.indexOf("_groupBy") == prop.length - 8)  { // ComplexDate
                                                                                  // rollup
          chosenTextField.value = '';
          var targetImg = self.hotspot;
          if(targetImg.tagName.toLowerCase() == 'a')
            targetImg = targetImg.getElementsByTagName('img')[0];
          if(typeof targetImg != 'undefined')
            targetImg.src = "icons/checkbox.gif";
          return closePopup(prop, currentDiv, deleteCurrentDiv, checkboxClicked);
        }

        var isTablePropertyList = currentFormName.indexOf("tablePropertyList") == 0;
        if (len > 1) {
          if (!isTablePropertyList)
            chosenTextField[0].value   = tr.id.substring(6);
          else
            chosenTextField[0].value   = '';
        }
        else {
          //if (!isTablePropertyList) chosenTextField.value   = tr.id.substring(6); else
            chosenTextField.value   = '';
        }
        if (chosenTextField.style)
          chosenTextField.style.backgroundColor = '';
      }
      formField.value         = '';
      if (formFieldClass)
        formFieldClass.value  = '';

      // hide property label that is displayed on top of the text field
      //if (fieldLabel) fieldLabel.style.display    = "none";
      if (formFieldVerified)
        formFieldVerified.value = 'n';
      if (selectItems) {
        for (var i=0; i<selectItems.length; i++) {
          if (selectItems[i].type.toLowerCase() == "checkbox")
            selectItems[i].checked = false;
          else
            selectItems[i].value = null;
        }
      }
      if (currentDiv)
        loadedPopups[currentDiv.id] = null;
      var imgId  = prop + "_class_img";
      var img = document.getElementById(imgId);
      if (img) {
        document.getElementById(imgId).src = "icons/blank.gif";
        document.getElementById(imgId).title = "";
      }
    }
    else  {
      var val = getChildByClassName(tr, 'menuItem').innerHTML;
      var idx = val.lastIndexOf(">");
      if (!isViewCols) {
        if (len > 1) {
  	      chosenTextField[0].value = val.substring(idx + 1);
  	      if (chosenTextField[0].style)
  	        chosenTextField[0].style.backgroundColor = '#ffffff';
  	    }
        
        /* // commented out after Touch UI - need to test it more
  	    else {
          if (prop.length > 8  &&  prop.indexOf("_groupBy") == prop.length - 8)  { // ComplexDate
            chosenTextField.value = tr.id;
            //var dateImg = tr.getElementsByTagName('img');
            var targetImg = this.hotspot;
            if(targetImg.tagName.toLowerCase() == 'a')
              targetImg = targetImg.getElementsByTagName('img')[0];
            if(typeof targetImg != 'undefined')
              //targetImg.src = dateImg[0].src;
              targetImg.src = "icons/cakes.png";
            return closePopup(prop, currentDiv, deleteCurrentDiv, checkboxClicked);
          }
          else {
            chosenTextField.value = val.substring(idx + 1);
            if (tr.style)
              chosenTextField.style.backgroundColor = tr.style.backgroundColor;
            else
              chosenTextField.style.backgroundColor = '#ffffff';
          }
        }
        */
        var fr = form.elements[originalProp + "_From"];
        var to = form.elements[originalProp + "_To"];
        if (fr)
          fr.value = '';
        else if (to)
          to.value = '';
      }
      
      // show property label since label inside input field is now overwritten
      /*
      if (currentFormName.indexOf('rightPanelPropertySheet') == 0) {
        if (fieldLabel)
          fieldLabel.style.display = '';
      }
      */
      
      var nmbChecked = 0;
      var selectedItem;
      var selectedIdx = 0;

      if (!selectItems) // happens in Touch UI
        return;

      if (!selectItems.length) {
        var t = selectItems.type.toLowerCase();
       
        if (t == "hidden") { // used for data entry
          selectItems.value = tr.id; // property value corresponding to a listitem
        }
      }
      else {
        selectItems.value = '';
        // go over selected items and count all checked
        var hiddenSelectedItem;
        for (var i=0; i<selectItems.length; i++) {
          if (selectItems[i].type.toLowerCase() == "hidden") {
            hiddenSelectedItem = selectItems[i];
            selectItems[i].value = '';
            continue;
          }
          if (!selectItems[i].checked) {
            var sValue = selectItems[i].value;
            var sidx = sValue.indexOf("displayname__");
            if (sidx != -1) {
              sidx = sValue.indexOf("=");
              var s = "";
              var first = true;
              while (true) {
                var sidx1 = sValue.indexOf("&amp;", sidx);
                if (!first)
                  s += ' ';
                else
                  first = false;
                if (sidx1 == -1) {
                  s += sValue.substring(sidx + 1);
                  break;
                }
                else {
                  s += sValue.substring(sidx + 1, sidx1);
                  sidx = sValue.indexOf("=", sidx1 + 3);
                  if (sidx == -1)
                    break;
                }
              }
              sValue = s;
            }
            if (sValue == tr.id) { // check that item was selected by clicking
                                    // on popup row not explicitely on checkbox
              if (!checkboxClicked)              // mark row's checkbox
                selectItems[i].checked = true;
            }
          }
          if (selectItems[i].checked == true) {
            selectedItem = selectItems[i];
            selectedIdx = i;
            nmbChecked++;
          }
        }
				
/*			// not needed with TouchUI (?)	
        if (!isViewCols) {
          if (nmbChecked == 0) {
            if (fieldLabel) {
              //fieldLabel.style.display    = "none";
              var textContent = getTextContent(fieldLabel);
              if (textContent) {
                var idx = textContent.indexOf("\r");
                if (idx != -1)
                  textContent = textContent.substring(0, idx);
                chosenTextField.value = textContent;// + " --";
              }
            }
            else
              chosenTextField.value = "";
          }
          else {
            var checkSubscribe = form.elements[prop + '_subscribe'];
            if (checkSubscribe)
              checkSubscribe.checked = true;
            if (nmbChecked == 1) {
              if (hiddenSelectedItem != null)
                hiddenSelectedItem.value = selectedItem.value;
								
              var trNode = getTrNode(selectedItem);
              var items = trNode.getElementsByTagName('td');
              var val = items[2].innerHTML;
              var idx = val.lastIndexOf(">");

              if (len > 1)
                chosenTextField[0].value = val.substring(idx + 1);
              else
                chosenTextField.value = val.substring(idx + 1);
              trNode.style.cssText = tr.style.cssText;
            }
            else {
              if (hiddenSelectedItem != null)
                hiddenSelectedItem.value = selectedItem.value;
              chosenTextField.value = '<...>';
              chosenTextField.style.backgroundColor = '#ffffff';
            }
          }
        }
*/				
				
      }
    }

    // close popup
    idx = prop.indexOf(".type");

    var divId = (idx != -1  &&  prop.length == idx + 5) ? prop.substring(0, idx) + "_" + currentFormName : prop + "_" + currentFormName;
    if (currentResourceUri != null) {
      if (divId.indexOf(".") == 0)
        divId = currentResourceUri + ".$" + divId;
      else
        divId = currentResourceUri + ".$." + divId;
    }
    var div = document.getElementById(divId);
		if (deleteCurrentDiv && currentDiv)
      loadedPopups[currentDiv.id] = null;
 }
  

  function closePopup(prop, currentDiv, deleteCurrentDiv, checkboxClicked) {
    // close popup
    var divId = prop + "_" + currentFormName;
    if (currentResourceUri != null) {
      if (divId.indexOf(".") == 0)
        divId = currentResourceUri + ".$" + divId;
      else
        divId = currentResourceUri + ".$." + divId;
    }
    var div = document.getElementById(divId);
    if (deleteCurrentDiv && currentDiv)
      loadedPopups[currentDiv.id] = null;
    // if checkbox was clicked, then do not close popup so that user can check
    // checboxes, if needed
    if (!checkboxClicked)
      Popup.close0(div.id);
    clearOtherPopups(div);
    if (checkboxClicked)
      return true;
    else
      return false;
  }

  this.popupRowOnMouseOver = function (e) {
    if (typeof getDocumentEvent == 'undefined') return;
    e = getDocumentEvent(e); if (!e) return;

    var target = getEventTarget(e);
		var tr = getTrNode(target);
		
		if (target.id == "$more")
			return;
    if (!tr)
      return true;

    if (self.isHeaderRow(tr))
      return true;

    self.deselectRow();
    // darken new current row
    self.currentRow = tr;
    self.selectRow();
    
    return true;
  }

  this.popupRowOnMouseOut = function (e) {
    if (typeof getDocumentEvent == 'undefined') return;
    e = getDocumentEvent(e); if (!e) return;
    var target = getMouseOutTarget(e);
    if (!target)
      return true;

	  if (target.tagName.toLowerCase() != 'tr')
			return;

    var tr = getTrNode(target);
    if (!tr)
      return true;

    self.deselectRow();
    self.currentRow = null;
    return true;
  }

  this.popupRowOnMouseDown = function (e) {
    if (typeof getDocumentEvent == 'undefined') return;
    e = getDocumentEvent(e); if (!e) return;
    var target = getMouseOutTarget(e);
    if (!target)
      return true;
		if (target.id == "$more")
			return;
			
    var tr = getTrNode(target);
    if (!tr)
      return true;
    
	tr.className = tr.className + " blue_highlighting";
    return true;
  }

  this.deselectRow = function () {
    if (self.currentRow == null)
      return;

    var trId = self.currentRow.id;
    if (self.currentRow == null)
      return;

    //self.currentRow.style.backgroundColor = Popup.LightMenuItem;
	self.currentRow.className = self.currentRow.className.replace(/grey_highlighting|blue_highlighting/g, "");
  }

	// currently makes row grey
  this.selectRow = function () {
		if (self.currentRow == null)
      return;
    
    var trId = self.currentRow.id;
    if (trId.length == 0)
      return;
    
    if (trId == '$noValue')
      return;

		self.currentRow.className = self.currentRow.className + " grey_highlighting";
  }

  this.nextRow = function () {
    var cur = self.currentRow;
    if (self.currentRow == null) {
      self.currentRow = self.firstRow();
      // if (cur == self.currentRow)
      // a = 1;
      return self.currentRow;
    }

    var table = self.currentRow.parentNode;
    var trs = table.rows;
    var curIdx = self.currentRow.sectionRowIndex;
    var nextIdx = curIdx;

    for (var i = 1; i < trs.length; i++) {
      var idx = (curIdx + i < trs.length) ? curIdx + i : curIdx + i - trs.length;
      if (!self.isHeaderRow(trs[idx]) && trs[idx].style.display != 'none') {
        nextIdx = idx;
        break;
      }
    }
    var next = table.rows[nextIdx];

    // The following is needed to work around FireFox and other Netscape-based
    // browsers. They will return a #text node for nextSibling instead of a TR.
    // However, the next TR sibling is the one we're after.
    var exitIfBusted = 0;
    var nextTr = next;
    while (nextTr.nodeName && nextTr.nodeName.toUpperCase() != 'TR') {
      nextTr = nextTr.nextSibling;
      if (nextTr == null) {
        self.currentRow = self.firstRow();
        // if (cur == nextTr)
        // a = 1;
        return self.currentRow;
      }
      exitIfBusted++;
      if (exitIfBusted > 10) {
        throw new Error('could not locate next row for ' + self.currentRow.id);
        return null;
      }
    }
    next = nextTr;
    if (next.id.indexOf('divider') == -1 && next.id.indexOf("_$calendar") == -1) {
      self.currentRow = next;
      // if (cur == next)
      // a = 1;
      return next;
    }
    else {
      self.currentRow = next;
      next = self.nextRow();
      // if (cur == next)
      // a = 1;
      return next;
    }
  }

  this.prevRow = function () {
    if (self.currentRow == null) {
      self.currentRow = self.firstRow();
      if (self.currentRow == null)
        return null;
      return self.prevRow();
    }

    //var prev = self.currentRow.previousSibling;
    var table = self.currentRow.parentNode;
    var trs = table.rows;
    var curIdx = self.currentRow.sectionRowIndex;
    var prevIdx = curIdx;

    for (var i = 1; i < trs.length; i++) {
      var idx = (curIdx - i >= 0) ? curIdx - i : curIdx + trs.length - i;
      if (!self.isHeaderRow(trs[idx]) && trs[idx].style.display != 'none') {
        prevIdx = idx;
        break;
      }
    }
    var prev = table.rows[prevIdx];

    if (prev == null || self.isHeaderRow(prev)) {
      // self.deselectRow();
      self.currentRow = self.lastRow();
      // self.selectRow();
      return self.currentRow;
    }

    if (prev.tagName && prev.tagName.toUpperCase() == 'TR' && prev.id.indexOf('divider') == -1 && prev.id.indexOf("_$calendar") == -1) {
      // self.deselectRow();
      self.currentRow = prev;
      // self.selectRow();
      return prev;
    }
    else {
      self.currentRow = prev;
      return self.prevRow();
    }
  }

  this.isHeaderRow = function (tr) {
    if (tr && tr.className == 'menuTitle')
      return true;
    else
      return false;
  }

  /**
   * return first row in popup
   */
  this.firstRow = function() {
    var tables = self.div.getElementsByTagName('table');
    
    /*
    if (!tables || !tables[1] || tables[1].id.startsWith('-not-menu') || (tables[2] && tables[2].id.startsWith('-not-menu')) )
      return null;
    
    var trs = tables[1].getElementsByTagName('tr');
    if (trs == null)
      return null;
*/

    if (tables.length == 0)
      return null;
    
    var trs;
    if (tables.lenght == 1)
      trs = tables[0].getElementsByTagName('tr');
    else if(tables.lenght > 1) {
      if (tables[1].id.startsWith('-not-menu') || (tables[2] && tables[2].id.startsWith('-not-menu')) )
        return null;
      trs = tables[1].getElementsByTagName('tr');
    }

    var trs = tables[0].getElementsByTagName('tr');
    
    for (var i=0; i<trs.length; i++) {
      if (!self.isHeaderRow(trs[i]) && trs[i].style.display != 'none')
        break;
    }
    
    return trs[i];
  }

  /**
   * return last row in popup
   */
  this.lastRow = function() {
    var tables = self.div.getElementsByTagName('table');
    if (!tables || !tables[1])
      return null;

    var trs = tables[1].getElementsByTagName('tr');
    if (trs == null)
      return null;

    for (var i = trs.length - 1; i >= 0; i--) {
      if (!self.isHeaderRow(trs[i]) && trs[i].style.display != 'none')
        break;
    }
    return trs[i];
  }

  /**
   * return number of rows in popup
   */
  this.rowCount = function() {
    var tables = self.div.getElementsByTagName('table');
    if (!tables || !tables[1])
      return null;

    var trs = tables[1].getElementsByTagName('tr');
    if (trs == null)
      return null;
    return trs.length;
  }

  /**
   * Returns popup item by its name. Usually popup item corresponds to a row in
   * popup.
   */
  this.getPopupItem = function(itemName) {
    return self.items[itemName];
  }

}

/**
 * Individual element in popup, usually represented by one row.
 */
function PopupItem(element, seq) {
  this.id        = element.id; // item id
  this.seq       = seq;        // sequence number of this item from the top of
                                // popup

  this.checked   = false;      // item may be checked (true) or not (false)
  this.selected  = false;      // item may be currently selected (highlighted)
                                // or not
  this.onChosen  = null;       // event handler that receives control when user
                                // clicked on this popup element or pressed
                                // Enter
  this.onOver    = null;       // event handler that receives control when this
                                // popup element is selected (highlighted)
  this.onOut     = null;       // event handler that receives control when this
                                // popup element is unselected (becomes passive)
  this.onCheck   = null;       // event handler that receives control when item
                                // is checked
  this.onUncheck = null;       // event handler that receives control when item
                                // is unchecked
}

var originalProp = null;
var propName = null;
var loadedPopups = new Array();
var div2frame = new Array();
var currentDiv = null;
var closeTimeoutId;
var currentImgId = null;
var currentFormName = null;
var currentResourceUri = null;
// defined in JAVA because menu.js is loaded at the page bottom
/* var innerUrls = new Array(); */
var innerListUrls = new Array();


// Note: Touch UI uses display names for all selected options in filter and Watch
// As a result it appends additional fields with the same name to [originalProp]
// (it would be better to apply new aprouch to get the field) 
function getOriginalPropField(form, originalPropStr) {
	var field = form.elements[originalPropStr];
	if (field == null)
		return null;
	if (typeof field.length != "undefined")
		return field[0];
	return field;		
}

function reposition(div, x, y) {
  var intLessTop  = 0;
  var intLessLeft = 0;
  var elm = div.offsetParent;

  // absolute elements become relative to a container with position:relative
  // so must decrease top, left
  while (elm && elm.offsetParent != null) {
    intLessTop  += elm.offsetTop;
    intLessLeft += elm.offsetLeft;
    elm = elm.offsetParent;
  }
  // alert(intLessLeft + "," + intLessTop + ", " + x + ", " + y);
  div.style.left = x - intLessLeft + 'px';
  div.style.top  = y - intLessTop  + 'px';
}

// Reference: http://www.webreference.com/js/column33/image.html

function docjslib_getImageWidth(img) {
  return img.offsetWidth;
}
function docjslib_getImageHeight(img) {
  return img.offsetHeight;
}
var NS4 = document.layers;
function docjslib_getImageXfromLeft(img) {
  if (NS4) return img.x;
  else return docjslib_getRealLeft(img);
}
function docjslib_getImageYfromTop(img) {
  if (NS4) return img.y;
  else return docjslib_getRealTop(img);
}
function docjslib_getRealLeft(img) {
  xPos   = img.offsetLeft;
  tempEl = img.offsetParent;
  while (tempEl != null) {
    xPos   += tempEl.offsetLeft;
    tempEl  = tempEl.offsetParent;
  }
  return xPos;
}
function docjslib_getRealTop(img) {
  yPos   = img.offsetTop;
  tempEl = img.offsetParent;
  while (tempEl != null) {
    yPos  += tempEl.offsetTop;
    tempEl = tempEl.offsetParent;
  }
  return yPos;
}

/*
function getFormFiltersForInterface(form, propName) {
  var field = form.elements[propName];
  if (field == null) {
    field = form.elements[propName + "_select"];
    if (field == null)
      return null;
  }
  var trNode = getTrNode(field);
  var elem = trNode.getElementsByTagName("div");
  if (!elem)
    return null;
  var interfaceUri = null;
  if (elem.length) {
    for (var i=0; i<elem.length; i++) {
      if (elem[i].id && elem[i].id.indexOf("http://") == 0) {
        interfaceUri = elem[i].id;
        break;
      }
    }
    if (interfaceUri == null)
      return null;
  }
  else if (!elem.id || elem.id.indexOf("http://") != 0)
    return null;
  else
    interfaceUri = elem.id;

  var p = "";
  var fields = form.elements;
  for (var i=0; i<fields.length; i++) {
    field = fields[i];
    var value = field.value;
    var name  = field.name;
    var type  = field.type;

    if (!type || !name || !value)
      continue;
    if (type.toUpperCase() == "SUBMIT")
      continue;

    var trNode = getTrNode(field);
    elem = trNode.getElementsByTagName("div");
    if (!elem)
      continue;
    if (elem.length) {
      for (var ii=0; ii<elem.length; ii++) {
        if (elem[ii].id && elem[ii].id == interfaceUri) {
          p += "&" + name + "=" + encodeURIComponent(value);
          break;
        }
      }
    }
    else if (elem.id  &&  elem.id == interfaceUri)
      p += "&" + name + "=" + encodeURIComponent(value);
  }
  return p;
}
*/
function removePopupRowEventHandlers(div) {
  var tables = div.getElementsByTagName('table');
  if (!tables || !tables[1])
    return;
  var table = tables[1];
  var trs = table.rows;
  var k=0;
  for (var i=0;i<trs.length; i++) {
    var elem = trs[i];
    removeEvent(elem, 'click',     popupRowOnClick,     false);
    removeEvent(elem, 'mouseover', popupRowOnMouseOver, false);
    removeEvent(elem, 'mousedown', popupRowOnMouseDown, false);
    removeEvent(elem, 'mouseout',  popupRowOnMouseOut,  false);
  }
}

/**
 * Dummy function to help prevent duplicate form submits
 */
function fakeOnSubmit() {
  return false;
}


/***********************************************
* FormProcessor - helps to handle data of a form
************************************************/
var FormProcessor = {
  // variables ----
  formInitialValues : new Array(),

  // methods ----
  // inits DataEntry and ListBoxesHandler!
  initForms : function(div) {
    var forms;
    if (div)
      forms = div.getElementsByTagName('form');
    else
      forms = document.forms;

    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      var initialValues = new Array(form.elements.length);
      //formInitialValues[form.name] = initialValues;

			// process only forms with id = 'filter'
//      if (form.id != 'filter')
//        continue;


			// init Touch UI for all forms
			this.initForTouchUI(form);
      this._storeInitialValues(form);

      ListBoxesHandler.init(form);
      
      addEvent(form, 'submit', this.onSubmit, false);
    }

    // Not set focus in fields of menu. Otherwise arrow keys navigation is broken.
    if (div && div.className != 'popMenu')
      this.uiFocus(div);
  },

  uiFocus : function(div) {
    if (!div)
      div = document;

    var fields = div.getElementsByTagName('input');
    var firstField;

    for (var i=0; i<fields.length; i++) {
      var u = fields[i];
      if (u && u.type && u.type != 'hidden') {
        if (!firstField) {
          firstField = u;
        }
        if (u.id && (u.id == 'uiFocus' || u.id.indexOf('_uiFocus') != -1)) {
          if(ExecJS.isObjectTotallyVisible(u)) {
            try {
              u.focus(); // in IE (at least in IE6) first focus() is lost for some
                        // reason - we are forced to issue another focus()
              u.focus();
							setCaretPosition(u, 0);
            }catch(e){};
          }
          return true;
        }
      }
    }
    if (firstField && div != document) {
      if(ExecJS.isObjectTotallyVisible(firstField)) {
        try {
          firstField.focus();
          firstField.focus(); // second time for IE
          setCaretPosition(firstField, 0);
        }catch(e){};
      }
    }
    return false;
  },

  // submit event handler
  onSubmit : function(e) {
    var $t = FormProcessor;
    e = getDocumentEvent(e);
    if (!e)
      return;
      
    var form = getTargetElement(e);
    $t.onSubmitProcess(e, form);
  },
  
  // prevents submision of not changed data
  onSubmitProcess : function(e, form) {
	  var buttonName = form.getAttribute("buttonClicked");

    var button = form.elements[buttonName];
    var pane2        = PlainDlg.getPane2Dialog();
    var dialogIframe = document.getElementById('dialogIframe');

    var isCancel = button && button.name.toUpperCase() == 'CANCEL';
    if (isCancel) {    // cancel button clicked?
      if (pane2  &&  pane2.contains(form))  {   // inner dialog?
        setDivInvisible(pane2, dialogIframe);
        return stopEventPropagation(e);
      }
    }

    // put rte data in the hidden field(s)
    if(typeof RteEngine != 'undefined')
      RteEngine.putRteDataOfForm(form);

    // desktop - "text search" form is a separated form
    // Add full text search criteria to filter
    var fullTextSearchForm = document.forms['searchForm'];
    if (fullTextSearchForm) {
      if (form.id && form.id == 'filter') {
        // NOTE: in Touch UI options checkboxes are outside to filter form
        // so need to move them into form before submision
        //ListBoxesHandler.insertCheckedOptionsIntoFilterForm(form);
        var criteria = fullTextSearchForm.elements['-q'];
        if (criteria  && !FieldsWithEmptyValue.isEmptyValue(criteria) ) {
          var textSearchForType = fullTextSearchForm.elements['-cat'];
          if (textSearchForType  &&  textSearchForType.value == 'on') {
            var textSearchInFilter = form.elements['-q'];
            if (textSearchInFilter) {
              textSearchInFilter.value = criteria.value;
              var textSearchInFilterForType = form.elements['-cat'];
              if (textSearchInFilterForType)
                textSearchInFilterForType.value = 'on';
            }
          }
        }
      }
    }

		var dialog = getParentDialog(form);
		var isFormInDialog = dialog != null && !isParentDialogOnPage(dialog);
		
		// filter is sent NOT as XHR to get responce into page
		if (dialog && dialog.id == 'common_filter')
			isFormInDialog = false;
    
  // var action = form.attributes['action'];
    var action = form.action;
    // form url based on parameters that were set
    var url;
    if (action) {
      url = action;
    }
    else
      url = "FormRedirect";
		
		// HACK: if form.action is empty
		var formAction = "";
    var formActionElem = form.elements['-$action'];
		if (formActionElem)
			formAction = form.elements['-$action'].value;
		
    var allFields = true;
    if (formAction != "searchText" && formAction != "searchLocal" && formAction != "searchParallel" && formAction != "mkResource")
      allFields = false;
    else if (currentFormName && currentFormName.indexOf("horizontalFilter") == 0)
      allFields = true;

    var params = "submit=y"; // HACK: since target.type return the value of &type
                              // instead of an input field's type property

		var isAjaxReq = isFormInDialog || Browser.mobile;
    var p1 = FormProcessor.getFormFilters(form, allFields, null, isAjaxReq);
    if (p1)
      params += p1;
    var submitButtonName  = null;
    var submitButtonValue;

    params += '&$form=' + form.name;

    // url += '&$selectOnly=y';
    if (allFields == false) {
      var type = form.type;
      if (type)
        params += "&type=" + type.value;

      params += "&-$action=" + formAction;
    }
    if (form.uri)
      params += "&uri=" + encodeURIComponent(form.uri.value);

    if (isCancel)
      params += "&cancel=y";

    for (var j = 0; j < form.elements.length; j++) {
      var elem = form.elements[j];
      var atts = elem.getAttribute('onSubmit');
      if (atts) {
        if (!elem.getAttribute('onSubmitFixed')) {
          var s = atts.replace(/\(this\)/, ''); // e.g. replace setTime(this) into setTime

          if (trim(s).startsWith('function'))
            elem.onsubmit = eval(s);
          else
            elem.onsubmit = eval('function (event) {' + s + '}');
          elem.setAttribute('onSubmitFixed', 'true');
        }
        elem.onsubmit();
      }
    }

		if (!action)
      form.action = "FormRedirect";

    if (pane2  &&  pane2.contains(form))  {   // dialog?
      setDivInvisible(pane2, dialogIframe);
    }

		// 1. mobile: return url for further XHR
		if (Browser.mobile) {
      return url + "?" + params;
    }
 		// 2. form in dialog: send via XHR  ///// action.indexOf("l.html") == -1
		// change view cols dialog sendig as form to get new page
   else if (isFormInDialog && form.id != "viewColsList" && form.id != "uploadProject"
	 			&& form.id != "gridColsList")  {
	 		// -inner=y for dialog on desktop															
			params += "&-inner=y"; // params for XHR means inner/dialog.
	 		var dlg = getParentDialog(form);
			// if "dialog" inside not body then it is "on page"
			if (dlg.parentNode.tagName.toLowerCase() != 'body')
				params += "&on_page=y"
		
			if (dlg.id == 'pane2')	
				postRequest(e, url, params, dlg, getTargetElement(e), PlainDlg.onDialogLoaded); // showDialog
			else
				postRequest(e, url, params, null, getTargetElement(e), DataEntry.onDataEntryRejection);	
      
			return stopEventPropagation(e);
    }
		// 3. send html form
    else {
			/* do not allow to submit form while current submit is still being processed */
	    if (form.name.indexOf("tablePropertyList") != -1) { // is it a data entry
	      var wasSubmitted = form.getAttribute("wasSubmitted");
	      if (wasSubmitted) { //  && !Browser.mobile
	        alert("Can not submit the same form twice");
	        return stopEventPropagation(e);
	      }
	      form.setAttribute("wasSubmitted", "true");
	    }
			
      return true;
    }
  },

  /**
  * Helper function - gathers the parameters (from form elements) to build a URL
  * If allFields is true - we are in a Filter panel - need to take into account
  * all input fields Otherwise - it is a Data Entry mode, i.e. - take only fields
  * that were modified by the user
  */
  
  // handles 2 mechanisms:
  // 1) XHR: as string of params
  // 2) html form: removes not needed fields
	// isXHR default value - false
  getFormFilters : function(form, allFields, exclude, isXHR) {
	  var p = "";
    var fields = form.elements;
    // use idx and len because removeChild reduces fields collection
    var idx = -1;
    var len = fields.length;
    var removedFieldName = "";

		if (typeof isXHR == 'undefined')
			isXHR = false;
		
    for (var i = 0; i < len; i++) {
      idx++;

      var field = fields[idx];
			var name  = field.name;
      var value = field.value;
			
			// reset field with empty value ("full text search", for example)
      var isEmptyValue = field.getAttribute("is_empty_value")
      if (isEmptyValue && isEmptyValue == "y") {
		  	if (!isXHR)
					field.value = "";
				value = "";
		  }	
			
      if (exclude) {
        if (typeof exclude == 'string' && name == exclude) 
          continue;
        else if (exclude[name])
          continue;
      }
      
			var type  = field.type;
      
			// several cases when to skip field even for allFields == true
			if (!type || !name)
        continue;
      
			if (type == "submit")
        continue;

      if (!value)
        continue;
    
      if (value == '')
        continue;
      
      if (type == "checkbox" || type == "radio" ) {
        if (field.checked == false)
          continue;
        }
      if (value.indexOf(" --", value.length - 3) != -1)
        continue;

      // allowed to send not all field ---
      // remove not changed fields (except FrequencyPE case)
      var isFrequencyField = (name.indexOf("frequency_") == 0);
			if (!allFields && !isFrequencyField) {
        if (!this.wasFormFieldModified(field, value)) {
          var doRemove = true;
         // 1. not 'hidden'
         if (field.type != 'hidden') {
           // HACK for data entry shipments/invoices
           if (field.type == 'checkbox') {
             var durl = document.location.href;
             if (durl  &&  (durl.indexOf("createDEResourceList.html") || durl.indexOf("createParallelDEResourceList.html")))
               doRemove = false;
           }

           // check if corresponding <select> (unit) was changed
           if (field.tagName.toLowerCase() == 'input') {
            var parentTr = getAncestorByTagName(field, 'tr');
            var select = getChildByTagName(parentTr, 'select');
            if (select != null) {
              if (this.wasFormFieldModified(select))
                toRemove = false;
             }
           }
           
           if (doRemove && !isXHR) {
             removedFieldName = name;
             field.parentNode.removeChild(field);
             idx--;
           }
         }
         
         // 2. 'hidden' (with suffixes _select, _verified, _class)
         // 2.1. hidden field containing RTE content
         else if (field.id == "rte_data"  && !isXHR) {
           field.parentNode.removeChild(field);
           idx--;
         }

         // 2.1 remove 'hidden' if corresponding <input> was removed
         else {
           if (removedFieldName != ""  &&  name.indexOf(removedFieldName) != -1
					 				 && !isXHR) {
             field.parentNode.removeChild(field);
             idx--;
           }
           else
            doRemove = false;
         }
          
         if (doRemove) // skip parameter in URL
           continue;
        }
      }
			
/*		// moved upper to work for allFields == false as well
      else {
        if (!value)
          continue;
      
        if (value == '')
          continue;
        
        if (type == "checkbox" || type == "radio" ) {
          if (field.checked == false)
            continue;
          }
          if (value.indexOf(" --", value.length - 3) != -1)
            continue;
      }
*/

			// compose resulting URL's parameters ---	
      if (name == "type")
        p += "&" + name + "=" + value;
      else {
        if (name.indexOf("http") == 0)
          name = encodeURIComponent(name);
        p += "&" + name + "=" + encodeURIComponent(value);
      }
    }
		
    return p;
  },

  _storeInitialValues : function(form) {
    var initialValues = new Array();
    for (var j = 0; j < form.elements.length; j++) {
      var elem = form.elements[j];
      
      // field with empty value; "full text search", for example
      var isEmptyValue = elem.getAttribute("is_empty_value")
      if (isEmptyValue && isEmptyValue == "y") {
        initialValues[elem.name] = "";
        continue;
      }
      
      initialValues[elem.name] = elem.value;
    }
    this.formInitialValues[form.name] = initialValues;
  },
  /*
  hasFieldInitialValue : function(field) {
    var form = getAncestorByTagName(field, "form");
    if (form == null)
      return;
    var formValues = this.formInitialValues[form.name];
    if (formValue) {
      if (field.value == formValues[field.name])
        return true;
    }
    return false;
  },
*/

  // returns true if the field was modified since the page load
	// currentValue is not required; used for fields with empty value
  wasFormFieldModified : function(elem, currentValue) {
    var initialValue = this.getFormFieldInitialValue(elem);
    if (typeof currentValue == 'undefined')
			currentValue = elem.value;
			
		if (initialValue == null)
      return true; // assume it was modified if no info exists
    if (currentValue == initialValue) {
       return false;
    }
    else {
       return true;
    }
  },
  // returns value of the field saved right after the page load (does not support multiple selections)
  getFormFieldInitialValue : function(elem, attribute) {
    var formValues = this.formInitialValues[elem.form.name];
    if (formValues) {
      if (attribute)
        return formValues[elem.name + '.attributes.' + attribute];
      else
        return formValues[elem.name];
    }
  },
	
	// Touch UI ---------------
	MIN_INPUT_WIDTH : 30,
  initForTouchUI : function(parent) {
		
		// "rightPanelPropertySheet" is a filter init it as a filter.
		// It happens with on_page filter
		if (parent.name ==	"rightPanelPropertySheet") {
			var panelBlock = getAncestorByClassName(parent, "panel_block");
			Filter.initFilter(panelBlock);
			return;
		}
		// "tablePropertyList" is Data Entry. Init Selector and Text entry fields.
		else if (parent.name.indexOf("tablePropertyList") != -1) {
			var panelBlock = getAncestorByClassName(parent, "panel_block");
			if (panelBlock) {
				var itemSelector = getChildById(panelBlock, "item_selector");
				FieldsWithEmptyValue.initField(itemSelector, 'select');
				var textEntry = getChildById(panelBlock, "text_entry");
				FieldsWithEmptyValue.initField(textEntry, 'select')
			}
		}

		// substitute checkboxes with own drawn ones.
    CheckButtonMgr.substitute(parent);
		this.initFieldsWithEmpltyValues(parent);
  },
	
	initFieldsWithEmpltyValues : function(parent) {
		var inputs = parent.getElementsByTagName("input");

		for (var i = 0; i < inputs.length; i++) {
			if (isElemOfClass(inputs[i], ["input", "isel", "num"] ) == false)
				continue;
			
			var paramTr = getAncestorByClassName(inputs[i], "param_tr");
			if (!paramTr)
				continue;
	
			var labelSpan = getChildByClassName(paramTr, ["label", "propLabel1"]);
			// requred field
			var isFieldRequired = labelSpan && (labelSpan.getAttribute("required") != null);
			if (isFieldRequired && inputs[i].type != "password") {
				FieldsWithEmptyValue.initField(inputs[i], "Required");
			}
			// insert "type" text if paramTr does not contain arrow_td
			else 
				if (getChildByClassName(paramTr, "arrow_td") == null && inputs[i].type != "password")  
					FieldsWithEmptyValue.initField(inputs[i], "type");
		}
	}

}



function setTime() {
  this.value = new Date().getTime();
}

/**
 * *********************************************** Helper functions
 * **************************************
 */
function getKeyCode(e) {
  if( typeof( e.keyCode ) == 'number') {
      // IE, NS 6+, Mozilla 0.9+, Safari 3
      return e.keyCode;
  } else if( typeof( e.charCode ) == 'number') {
      // also NS 6+, Mozilla 0.9+
      return e.charCode;
  } else if( typeof( e.which ) == 'number') {
      // NS 4, NS 6+, Mozilla 0.9+, Opera
      return e.which;
  } else {
      // TOTAL FAILURE, WE HAVE NO WAY OF OBTAINING THE KEY CODE
      throw new Error("can't detect the key pressed");
  }
}

function clearOtherPopups(div) {
// alert("div=" + div.id + ", loadedPopups.length=" + openedPopups.length)
  for (var p in loadedPopups) {
    if (p == null)
      continue;
    if (p != div)
      loadedPopups[p] = null;
  }
}


function getFormNode(elem) { 
  var f = elem.parentNode; 
  if (!f) 
    return null; 
  if (!f.tagName) 
     return null;
  if (f.tagName.toUpperCase() == "FORM") 
    return f;
  else 
    return getFormNode(f); 
}

function getTrNode(elem) {
 // try to get menuItemRow. It helps tp prevent partial item selection in IE.
 // drawback - it works slow especially in IE.
 var tr = getAncestorByClassName(elem, "menuItemRow");
 if (tr)
  return tr;

  // the following old code was left because if "menuItemRow" was not appended in HTML.
  var elem_ = elem;
  // IE workaround for menu item's extra mouseover events coming from FORM elements
  if (elem.length > 1) {
    var elem1;
    while ( (elem1 = elem_.previousSibling) != null) { // OPTIONS elements in TD
      elem_ = elem1;
      if (elem_.tagName.toUpperCase() == 'TD') {
        elem_ = elem_.parentNode;
        break;
      }
    }
    if (elem1 == null) { // SELECT element in TD
      elem_ = elem_.parentNode;
      if (elem_.tagName.toUpperCase() == 'TD')
        elem_ = elem_.parentNode;
      else {
        //alert(elem.tagName + ': ' + elem.id + ', elem_: ' + elem_.tagName + ', elem.parentNode: ' + elem.parentNode.tagName);
        return null;
      }
    }
  }
  // end IE workaround
  if (elem_.tagName.toUpperCase() == 'TR')
    return elem_;
  e = elem_.parentNode;
  if (e) {
    if (e == elem_) // if parent of the array element is self - get parent of array
      e = elem.parentNode;
    return getTrNode(e);
  }
  else
    return null;
}

function getDivNode(elem) {
	return getAncestorByTagName(elem, "div");
}

function getDocumentNode(obj) {
  while (obj.parentNode) {
    obj = obj.parentNode;
    if (obj.location && obj.location.href)
      return obj;
  }
  return null;
}

function chooser(element) {
  var propName = element.name;
  var idx = propName.indexOf(".", 1);
  var shortPropName = propName;
  if (idx != -1)
    shortPropName = propName.substring(0, idx);
  var form       = element.form.elements['$form'].value;
  var editList   = element.form.elements['$wasEditList'];
  var isHrefChange = element.form.id == "tree";
  var value    = element.value;
  var id       = element.id;

  if (!id)
    id = value;

  // need to find the first form with this name in parent window
  var originalForm;
  var l = window.opener.document.forms.length;
  for (var i=0; i<l; i++) {
    var forms = window.opener.document.forms;
    if (forms[i].name.indexOf(form) == 0) {
      originalForm = forms[i];
      break;
    }
  }
  if (!originalForm) {
    throw new Error("form not found: " + form);
    return;
  }

  if (editList) {
    var uri = element.form.elements['$rUri'].value;
    if (propName.indexOf(".") == 0)
      propName = propName.substring(1);
    if (shortPropName.indexOf(".") == 0)
      shortPropName = shortPropName.substring(1);

    originalForm.elements[uri + ".$." + propName].value                    = value;
    originalForm.elements[uri + ".$." + shortPropName + "_select"].value   = id;
    originalForm.elements[uri + ".$." + shortPropName + "_verified"].value = "y";
  }
  else if (currentFormName  &&  (currentFormName.indexOf("viewColsList") == 0  ||  currentFormName.indexOf("gridColsList") == 0  ||  currentFormName.indexOf("filterColsList") == 0)) {
    originalForm.elements[shortPropName].value   = id;
  }
  else {
    if (isHrefChange) {
      var aa = window.opener.document.getElementById("a_" + shortPropName);
      var idx = id.lastIndexOf("/");
      aa.innerHTML = id.substring(idx + 1);
      idx = id.lastIndexOf("=");
      aa.href = id.substring(idx + 1);
    }
    originalForm.elements[propName].value                    = value;
    originalForm.elements[shortPropName + "_select"].value   = id;
    originalForm.elements[shortPropName + "_verified"].value = "y";
  }
}

function chooser1(element) {
  var propName = element.name;
  var idx = propName.indexOf(".", 1);
  var shortPropName = propName;
  if (idx != -1)
    shortPropName = propName.substring(0, idx);
  var form     = element.form.elements['$form'].value;
  var editList = element.form.elements['$wasEditList'];
  var value    = element.value;
  var id       = element.id;

  if (!id)
    id = value;

  // need to find the first form with this name in parent window
  var originalForm;
  var l = window.opener.document.forms.length;
  for (var i=0; i<l; i++) {
    var forms = window.opener.document.forms;
    if (forms[i].name == form) {
      originalForm = forms[i];
      break;
    }
  }
  if (!originalForm) {
    throw new Error("form not found: " + form);
    return;
  }
  if (editList) {
    var uri = element.form.elements['$rUri'].value;
    originalForm.elements[uri + ".$." + propName].value                    = value;
    originalForm.elements[uri + ".$." + shortPropName + "_select"].value   = id;
    originalForm.elements[uri + ".$." + shortPropName + "_verified"].value = "y";
  }
  else {
    var selectItems = originalForm.elements[shortPropName + "_select"];
    var len = selectItems.length;
    var tr = getTrNode(selectItems[len - 1]);
    var table = tr.parentNode;
    var newRow = tr.cloneNode(true);
    newRow.id = id;
    table.appendChild(newRow);
    selectItems[len].value = id;
    selectItems[len].checked = true;
    var nmbOfSelected = 0;
    for (var i=0; i<len; i++) {
      if (selectItems[i].checked) {
        nmbOfSelected++;
        if (nmbOfSelected > 1)
          break;
      }
    }
    if (nmbOfSelected > 1)
      originalForm.elements[propName].value                        = "<...>";
    else
      originalForm.elements[propName].value                        = value;
      
 // originalForm.elements[shortPropName + "_select"][len].value = id;
    originalForm.elements[shortPropName + "_verified"].value     = "y";
 //   if (originalForm.elements[propName].style)
 //     originalForm.elements[propName].style.backgroundColor = '#ffffff';
    if (currentFormName.indexOf('rightPanelPropertySheet') == 0) {
      var filterLabel = window.opener.document.getElementById(shortPropName + "_span");
      if (filterLabel)
        filterLabel.style.display = '';
    }
  }
}

function hideResetRow(div, currentFormName, originalProp) {
  if (originalProp.indexOf("_class") != -1)
    return;
  var trs = div.getElementsByTagName('tr');
  var i;
  var found = false;

  var form = document.forms[currentFormName];
  if (form.elements[originalProp + "_class"])
    return;
  for (var i=0; i<trs.length; i++) {
    if (trs[i].id.indexOf('$clear') == 0) {
      found = true;
      break;
    }
  }

  if (!found)
    return;


  var tr = trs[i];

  var elem = getOriginalPropField(form, originalProp); // form.elements[originalProp];

  var value;
  if (elem.length > 1)
    value = elem[0].value;
  else
    value = elem.value;
  var valueIsSet = true;
  if (!value || value == '')
    valueIsSet = false;
  else if (FormProcessor.wasFormFieldModified(elem)/*value.indexOf(" --", value.length - 3) != -1*/)
    valueIsSet = false;

  if (valueIsSet) {
    tr.style.display    = '';
  }
  else {
    tr.style.display    = "none";
  }
}

/** ********************************* Menu ********************************** */
/* Opens the menu when needed, e.g. on click, on enter
 */
function menuOnClick(e, target) {
  var id = target.id;
  var title;
  if (id.indexOf('menuLink_') == 0)
    title = id.substring('menuLink_'.length);
  else
    title = id.substring('menuicon_'.length);

  addCurrentDashboardAndCurrentTab(target);
  var divId = 'menudiv_' + title;
  var divRef = document.getElementById(divId); // this is a menu item without
                                                // popup, exit
  if (!divRef)
    return true;
  var popup = Popup.open(e, divId, target, null, 0, 19);
  return stopEventPropagation(e);
}

function addCurrentDashboardAndCurrentTab(target) {
  if(target.tagName.toLowerCase() == "img")
    return;
  var a = target.href;
  if (!a || a == 'about:blank')
    return;
  var hasQuestion    = a.indexOf('?') != -1;
  // Fixed for DUDE
  if (!hasQuestion || a.indexOf('/tail?') != -1 || a.indexOf("/createResourceList?") != -1 || a.indexOf("/createParallelResourceList?") != -1)
    return;
  // Check if this is blog entry with contents
  var idx =  a.indexOf('&-ulId=');
  if (idx != -1) {
    var idx0 = a.indexOf('#', idx);
    if (idx0 != -1) {
      var idx1 = a.indexOf('&', idx + 1);
      if (idx1 == -1  ||  idx0 < idx1)
        return;
    }
  }
  var parentDiv = getDivNode(target);
  if (parentDiv  &&  parentDiv.id == 'otherSite')
    return;
  var addDashboardId = a.indexOf('-d=') == -1;
  if (addDashboardId) {
    var div = document.getElementById('dashboardCredentials');
    if (!div)
      return;
    var s = div.innerHTML.split(';');
    if (s  &&  s.length > 0) {
      if (hasQuestion) {
        if (addDashboardId  &&  s[0]) {
          a += '&-d=' + s[0];
          if (s.length > 1)
            a += '&-t=' + s[1];
        }
      }
      else {
        if (addDashboardId && s[0]) {
          a += '?-d=' + s[0];
          if (s.length > 1) {
            a += '&-t=' + s[1];
          }
        }
      }
      target.href = a;
    }
  }
}
function resizeWindow(event) {
//  return true;
  if (!event)
    return;
  var e = getDocumentEvent(event);
  var div = document.getElementsByTagName('body');
//  var div = document.getElementById('mobile');
//  alert('resize: div = ' + div);
//  if (div) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var sw = screen.width;
    var sh = screen.height;

    /*
    alert("w = " + w + "; h = " + h + "; sw = " + sw + "; sh = " + sh);
    if (w > h)  {// landscape
//      body.style.height = sh + 'px';
//      body.style.width  = sw + 'px';
      window.resizeTo(sh, sw);
    }
    else {
//      body.style.height = sw + 'px';
//      body.style.width  = sh + 'px';
      window.resizeTo(sw, sh);
    }
//    window.moveTo(0, 0);
*/

//  }
  return true;
}

/********************************************************
* Tooltip
*********************************************************/
var Tooltip = {
	SHOW_DELAY : 1000,
	HIDE_DELAY : 500,
	TOOLTIP_ID : "system_tooltip",
  TOOLTIP_ATTR : "tooltip",
	
	tooltipDiv : null,
  tooltipFrame : null,
	contentDiv : null,
	
  options : {isShiftRequired : false},
  optBtn : {obj: null, width: 16, height: 16}, // button image object and size
	
	isShown : false,
	isOverTooltip : false,
	timerId : null,
	showArgs : new Object(),
	
	init : function() {
		// no need tooltips on touch devices.
		if (Browser.mobile || Browser.touchDesktop || Browser.penBased)
      return;
		//if (Popup.penBased) // pen-based devices have problem with tooltips
    //  return;
		
		this.tooltipDiv = document.getElementById(this.TOOLTIP_ID);
		this.contentDiv = getChildById(this.tooltipDiv, "content");
		if (Browser.ie) {
			this.tooltipFrame = document.getElementById('tooltipIframe');
			if (!this.tooltipFrame) 
				throw new Error("document must contain iframe '" + iframeId + "' to display enhanced tooltip");
		}
				
		this.optBtn.obj = getChildById(this.tooltipDiv, "opt_btn");
    this.initShiftPref();
		
		addEvent(document.body, "mouseover", this.onMouseOver, false);
		addEvent(document.body, "mouseout", this.onMouseOut, false);
		addEvent(document.body, "click", this.onClick, false);
		addEvent(this.tooltipDiv, "mouseover", this.onMouseOverTooltip, true);
		addEvent(this.tooltipDiv, "mouseout", this.onMouseOutTooltip, true);
  },
	
  onMouseOver : function(e) {
    var $t = Tooltip;
	
		if ($t.isOverTooltip)
			return;

    var target = getEventTarget(e);
    if(!$t.isProcessed(target))
      $t.process(target);

    var tooltipText = target.getAttribute($t.TOOLTIP_ATTR);
    if(!tooltipText) {
			var parentA = target.parentNode;
    	if (parentA && parentA.tagName.toLowerCase() == 'a')
				tooltipText =  parentA.getAttribute($t.TOOLTIP_ATTR);
		}

		if (!tooltipText || tooltipText.plainText().trim().length == 0)
			return;

		$t.showArgs.shiftKey = e.shiftKey;
		$t.showArgs.target = target;
		$t.showArgs.tooltipText = tooltipText;
		
		$t.timerId = setTimeout(Tooltip.show, $t.SHOW_DELAY);
  },

  onMouseOut : function(e) {
		var $t = Tooltip;

		if ($t.isOverTooltip)
			return;
			
		if ($t.isShown)
			$t.timerId = setTimeout(Tooltip.hide, $t.HIDE_DELAY);
		else 
			clearTimeout($t.timerId); // prevent showing
  },

	onMouseOverTooltip : function(e) {
		var $t = Tooltip;
		$t.isOverTooltip = true;
		clearTimeout($t.timerId); // prevent closing if mouse over tooltip
	},

	onMouseOutTooltip : function(e) {
		var $t = Tooltip;
		var target = getEventTarget(e);
		$t.isOverTooltip = false;
		$t.onMouseOut(e);
	},
	
	onClick : function() {
		var $t = Tooltip;
		if ($t.isShown)
			$t.hide();
		else 
			clearTimeout($t.timerId); // prevent showing
	},
	
  show : function() {
		var $t = Tooltip;
		
		if ($t.isOverTooltip)
			return;
		
		var target = $t.showArgs.target;
		var tooltipText = $t.showArgs.tooltipText;

		var toShow = !($t.isShiftRequired() && !$t.showArgs.shiftKey);
    if(!toShow) {
			var plainTooltipText = tooltipText.replace(/<\/?[^>]+(>|$)/g, " ")
    	window.status = plainTooltipText;
			return;
		}
    if (!$t.tooltipDiv)
      return false; 
    
		$t.contentDiv.innerHTML = tooltipText;
		setDivVisible(/*e*/null, $t.tooltipDiv, $t.tooltipFrame, target, 0, 30);
		$t.isShown = true;
  },
	
	hide : function(forcedHide) {
		var $t = Tooltip;
		if ($t.isOverTooltip && !forcedHide)
			return;
   	$t.tooltipDiv.style.display = "none";
		window.status = "";
		$t.isShown = false;
	},
	
	showCueLoading : function(e, hotspot) {
		this.showArgs.e = e;
		this.showArgs.target = hotspot;
		this.showArgs.tooltipText = "<b> loading . . . </b>";
		this.hideOptionsBtn();
		this.show();
	},
	hideCueLoading : function() {
		this.hide();
		this.showOptionsBtn();
	},
	
	process : function(obj) {
    var titleText = obj.title;
		obj.title = "";
		var parentA = obj.parentNode;
    if (parentA && parentA.tagName.toLowerCase() == 'a') {
      if(titleText.length != 0)
        titleText += '<br><i><small>' + parentA.title + '</small></i>';
      else
       titleText = parentA.title;
			parentA.title = ""; 
    }
		
		if(titleText != null && titleText.length != 0)
      obj.setAttribute(this.TOOLTIP_ATTR, titleText);
  },
	
  isProcessed : function(obj) {
		var titleText = obj.title;
		return (titleText == null || titleText.length == 0);
  },
	
	// Options: shift pref ---------------------------
  onOptionsBtn : function(e) {
    if (Browser.mobile)
      return;
		
		stopEventPropagation(e);

		var msg = this.isShiftRequired() ? "show tooltips always" : "show tooltips when shift pressed";
		Tooltip.hide(true);
		BrowserDialog.confirm(msg, this.onShiftPrefChange);
	},

  onShiftPrefChange : function() {
      Tooltip.shiftPrefSwitch();
  },
	
	// show /hide used with Loading cue
  showOptionsBtn : function()  {
    if (Browser.mobile)
      return;

    if(!this.tooltip)
      this.init();
    if(this.optBtn.obj)
      this.optBtn.obj.style.display = "";
  },
  hideOptionsBtn : function()  {
    if (Browser.mobile)
      return;

    if(!this.tooltip)
      this.init();

    if (this.optBtn.obj)
      this.optBtn.obj.style.display = "none";
  },
  isShiftRequired : function() {
    if (Browser.mobile)
      return;

    if(!this.tooltip)
      this.init();
    return this.options.isShiftRequired;
  },
  initShiftPref : function () {
    if (Browser.mobile)
      return;

	  if(Popup.isShiftRequired == null) {
		  var aCookie = document.cookie.split("; ");
		  var bValue = false;
		  for (var i=0; i < aCookie.length; i++) {
			  // a name/value pair (a crumb) is separated by an equal sign
			  var aCrumb = aCookie[i].split("=");
			  if (aCrumb[0] == "shift_pressed") {
				  if(unescape(aCrumb[1]) == "yes")
					  bValue = true;
				  break;
			  }
		  }
		  this.options.isShiftRequired = bValue;
	  }
  },
  shiftPrefSwitch : function () {
    if (Browser.mobile)
      return;

    this.options.isShiftRequired = !this.options.isShiftRequired;
	  // set cookie
	  var sValue = this.options.isShiftRequired ? "yes" : "no";
	  var expiresData = new Date();
    expiresData.setTime(expiresData.getTime() + (1000 * 86400 * 365));
    document.cookie = "shift_pressed=" + escape(sValue)
        + "; expires=" + expiresData.toGMTString();

    var tooltipObj = Popup.getPopup('system_tooltip');
	  if(tooltipObj)
	    tooltipObj.delayedClose();
  }
}


/**************************************
* ListBoxesHandler
***************************************/
var ListBoxesHandler = {
  init : function(form) {
		var tables = form.getElementsByTagName("table");
    for (var i = 0; i < tables.length; i++) 
			if (tables[i].className == "rounded_rect_tbl" ||
					tables[i].id.indexOf("siteRL_") == 0) { // 2nd is RL edit
				addEvent(tables[i], 'click', this.onClickParam, false);
			}
			// TouchDlgUtil.init(form); // move it into DataEntry, Filter, etc.
  },


  // AUTOCOMPLETE ----
  /**
  * Show popup for the text entered in input field (by capturing keyPress
  * events). Show popup only when the person stopped typing (timeout). Special
  * processing for Enter: - in Filter mode - let it submit the form. - in Data
  * Entry mode - on Enter show popup immediately, and close popup if hit Enter
  * twice.
  */
  
  prevSelectorInputValue : "", // helps to detect local autodetect
  
	// onkeyup event in "text_entry"
  autoComplete : function(e) {
    var $t = ListBoxesHandler;
		// no autocomplete for numeric field
		if ($t.curParamRow.getAttribute("is_numeric") != null)
			return;
			
    var e = getDocumentEvent(e);  // if (!e) return;
    var target = getTargetElement(e);
 
		// //$t.localOptionsFilter(target.value)
    return $t.autoComplete1(e, target);
  },

  autoComplete1 : function(e, target) {
    if (!target)
      return;

    keyPressedTime = new Date().getTime();
    
    //var form = target.form;
    var form = document.forms[currentFormName];
    var characterCode = getKeyCode(e); // code typed by the user
	
		if (e.type != 'click' && characterCode <= 40 && characterCode != 8)
			return; // skip not symbol keys except backspace and delete

    var propName  = target.name;
    var formName  = form.name;
    
    var propName1 = propName;
    var idx = propName.indexOf(".", 1);
    if (idx != -1)
      propName1 = propName1.substring(0, idx);

    var fieldVerified = form.elements[propName1 + '_verified'];
    var selectItems   = form.elements[propName1 + '_select'];
    var fieldClass    = form.elements[propName1 + '_class'];
    if (characterCode == 13) { // enter
      if (!fieldVerified) { // show popup on Enter only in data entry mode
                            // (indicated by the presence of _verified field)
        // if (autoCompleteTimeoutId) clearTimeout(autoCompleteTimeoutId);
        return true;
      }
    }
    var divId;
    if (fieldClass)
      divId = propName + "_class_" + formName;
    else
      divId = propName + "_" + formName;

    keyPressedImgId     = divId + "_filter";
    
    var hotspot = document.getElementById(keyPressedImgId);
    hotspot = hotspot || document.body;

    keyPressedElement   = target;
    var currentPopup = Popup.getPopup(divId);

    var isAuto = target.getAttribute("autocomplete");

    // for a stage of openning of a listbox (currentPopup == null)
    // handle arrow down as click on listbox icon.
    if(isAuto != null && isAuto == "off" && currentPopup == null && characterCode != 40)
      return;

  /*
  * !!!!!!!!!!!!! this below did not work to clear the previous popup if
  * (currentDiv) { var p = Popup.getPopup(currentDiv); if (p) p.close(); }
  */

	
/*	// not use with Touch UI (!)
    switch (characterCode) {
    case 38:  // up arrow
      if (currentPopup && currentPopup.isOpen()) {
        currentPopup.deselectRow();
        currentPopup.prevRow();
        currentPopup.selectRow();
      }
      else {
        this.listboxOnClick1(e, keyPressedImgId, keyPressedElement.value);
        // Popup.open(e, divId, hotspot, null, 0, 16);
      }
      return stopEventPropagation(e);
    case 40:  // down arrow
      if (currentPopup && currentPopup.isOpen()) {
        currentPopup.deselectRow();
        currentPopup.nextRow();
        currentPopup.selectRow();
      }
      else {
        this.listboxOnClick1(e, keyPressedImgId, keyPressedElement.value);
        // Popup.open(e, divId, hotspot, null, 0, 16);
      }
      return stopEventPropagation(e);
    case 37:  // left arrow
    case 39:  // right arrow
    case 33:  // page up
    case 34:  // page down
    case 36:  // home
    case 35:  // end
      return true;
    case 27:  // esc
      if (currentPopup && currentPopup.isOpen()) {
        currentPopup.close();
      }
      return stopEventPropagation(e);
    case 16:  // shift
    case 17:  // ctrl
    case 18:  // alt s
    case 20:  // caps lock
      return true;
    case 127: // ctrl-enter
    case 13:  // enter
      if (currentPopup && currentPopup.isOpen()) {
        // listboxOnClick1(keyPressedImgId, keyPressedElement.value);
        currentPopup.popupRowOnClick1(e, null, target);
        return stopEventPropagation(e); // tell browser not to do submit on
                                          // 'enter'
      }
    case 9:   // tab
      if (currentDiv)
        currentPopup.close();
      return true;
    case 8:   // backspace or "C" in S60
      if(Browser.s60Browser) {
        if (currentPopup && currentPopup.isOpen()) {
            currentPopup.close(); // the same like esc
          }
          return stopEventPropagation(e);
      }
    case 46:  // delete
      break;
    }
*/    
    if (currentPopup)
      currentPopup.close();

    // for numeric value - do not perform autocomplete (except arrow down, ESC,
    // etc.)
    var ac = target.getAttribute('autocomplete');
    if (ac && ac == 'off')
      return true;
 		
    if (fieldVerified) fieldVerified.value = 'n'; // value was modified and is not
                                                  // verified yet (i.e. not chose
                                                  // from the list)
    if (selectItems) {
      var len = selectItems.length;
      if (len) {
        for (var i=0; i<selectItems.length; i++) {
          if (selectItems[i].type.toLowerCase() == "checkbox")
            selectItems[i].checked = false;
          else
            selectItems[i].value = '';
        }
      }
      else
        selectItems.value   = '';  // value was modified and is not verified yet
                                    // (i.e. not chose from the list)
    }
    e = cloneEvent(e);

    var checkSubscribe = form.elements[propName + "_subscribe"];
    if (checkSubscribe)
      checkSubscribe.checked = true;
    var f = function() { ListBoxesHandler.autoCompleteTimeout(e, keyPressedTime); };
    autoCompleteTimeoutId = setTimeout(f, Popup.autoCompleteDefaultTimeout);
    // make property label visible since overwritten inside the field
    var filterLabel = document.getElementById(propName1 + "_span");
    if (filterLabel) {
      filterLabel.style.display = '';
    //  filterLabel.className = 'xs';
    }
    if (currentPopup)
      clearOtherPopups(currentPopup.div);
    return true;
  },

  autoCompleteTimeout : function(e, invocationTime) {
		if (keyPressedTime > invocationTime) {
      return;
    }

    var hotspot = document.getElementById(keyPressedImgId);
    hotspot = hotspot || document.body;

    var newValue = FieldsWithEmptyValue.getValue(keyPressedElement); 
    // check if to do local filter only
    var hasMore = getChildById(this.optionsPanel, "$more");
		var isRollup = this.curOptionsListDiv.id.indexOf("_groupBy_") != -1;
		if (isRollup || !hasMore && this.prevSelectorInputValue.length != 0 && newValue.indexOf(this.prevSelectorInputValue) == 0)
      this.localOptionsFilter(newValue);
    else {
        this.listboxOnClick1(e, keyPressedImgId, newValue, null, this.curClass);
    }
		
		this.prevSelectorInputValue = newValue;
  },


  // Opens the popup when needed, e.g. on click, on enter, on autocomplete
  listboxOnClick1 : function(e, imgId, enteredText, enterFlag, classValue, arrowTd) {
		// cut off "_filter"
    var propName1 = imgId.substring(0, imgId.length - "_filter".length);   

    var idx = propName1.lastIndexOf('_');
    if (idx == -1)
      return;
    currentFormName = propName1.substring(idx + 1);
    var form = document.forms[currentFormName];
		propName1 = propName1.substring(0, propName1.length - (currentFormName.length + 1));
    currentImgId  = imgId;

		if (!classValue)
    	originalProp = propName1;
			
    var isGroupBy;
    if (originalProp.length > 8  &&  originalProp.indexOf("_groupBy") == originalProp.length - 8)
      isGroupBy = true;
    /*
    * 'viewColsList' for does not have input fields where to set focus.
    * form.elements[originalProp] returns list of viewCols properties to choose
    * from to display in RL
    */
    if (!isGroupBy  &&  form  &&  currentFormName != "viewColsList"  &&  currentFormName != "gridColsList"  && originalProp.indexOf("_class") == -1) {
      var chosenTextField = getOriginalPropField(form, originalProp); // form.elements[originalProp];
      if (chosenTextField && chosenTextField.parentNode) {
        //try { chosenTextField.focus(); } catch(e){}
        // insertAtCursor(chosenTextField, '');
        // setCaretToEnd(chosenTextField);
      }
    }
    var idx = -1;
    var divId;
    var isInterface;
		var onClassInRL = this.isEditList() && classValue != null;
    if (currentFormName.indexOf("siteResourceList") == 0 && !onClassInRL) {
      idx = propName1.indexOf(".$.");
      var idx1 = propName1.indexOf(".", idx + 3);
      if (idx1 == -1)
        propName = propName1;
      else
        propName = propName1.substring(0, idx1);
      divId = propName + "_" + currentFormName;
      if (idx1 == -1)
        propName = propName.substring(idx + 3);
      else
        propName = propName.substring(idx + 3, idx1);
      currentResourceUri = propName1.substring(0, idx);
    }
    else {
      currentResourceUri = null;
      idx = propName1.indexOf(".", 1);
      if (idx != -1) {
        propName = propName1.substring(0, idx);
        divId = propName + "_" + currentFormName;
      }
      else {
        idx = propName1.indexOf("_class");
        if (idx == -1)  {
          propName = propName1;
          divId = propName + "_" + currentFormName;
        }
        else {
          isInterface = true;
          propName = propName1.substring(0, idx);
          var el = document.forms[currentFormName].elements[propName + "_class"];
          if (!el.value || el.value == "")
            divId = propName + "_class_" + currentFormName;
          else {
            divId = propName + "_" + currentFormName;
			originalProp = propName + propName1.substring(propName.length + "_class".length);
          }
        }
      }
    }

    // close popup if it was already opened
    var popup = Popup.getPopup(divId);
    var div = getChildById(this.optionsPanel, divId);
    
    var hotspot = getTargetElement(e); //document.getElementById(imgId);
    hotspot = arrowTd || hotspot || document.body;
    // Use existing DIV from cache (unless text was Enter-ed - in which case
    // always redraw DIV)
    
    if (false/*enteredText && div != null*/) { // it seems (!) the following made thru localOptionsFilter()
      hideResetRow(div, currentFormName, originalProp);
      this.showOptions(div)
      return;
    }
    else {
      var popup = Popup.getPopup(divId);
      if (popup == null) {
		  	div = document.getElementById(divId);
				if (!div) {
					div = document.createElement("div");
					div.id = divId;  
				}
		  	popup = new Popup(div, hotspot);
		  }
		  else {
				div = popup.div;
		  	popup.reset(hotspot);
		  }
    }

    // form url based on parameters that were set
    var formActionElm = form.elements['-$action'];
    var formAction = formActionElm.value;
    var baseUriO = document.getElementsByTagName('base');
    var baseUri = "";
    if (baseUriO) {
      baseUri = baseUriO[0].href;
      if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
        baseUri += "/";
    }
    var url = baseUri + "smartPopup";
    var params = "prop=" + encodeURIComponent(propName);
    if (currentFormName.indexOf("siteResourceList") == 0) {
      params += "&editList=1&type=" + form.elements['type'].value;
			if (currentResourceUri)
				params += "&uri=" + encodeURIComponent(currentResourceUri);
    }
    else {
  // if (formAction != "showPropertiesForEdit" && formAction != "mkResource") {
        /* Add full text search criteria to filter */
        if (form.id && form.id == 'filter') {
          var fullTextSearchForm = document.forms['searchForm'];
          // there are 2 forms 'searchForm' on desktop
          //if (fullTextSearchForm.length)
          //  fullTextSearchForm = fullTextSearchForm[1];
          if (fullTextSearchForm) {
            var criteria = fullTextSearchForm.elements['-q'];
            if (criteria && !FieldsWithEmptyValue.isEmptyValue(criteria)) {
              var textSearchForType = fullTextSearchForm.elements['-cat'];
              if (textSearchForType  &&  textSearchForType.value == 'on') {
                var textSearchInFilter = form.elements['-q'];
                if (textSearchInFilter) {
                  textSearchInFilter.value = criteria.value;
                  var textSearchInFilterForType = form.elements['-cat'];
                  if (textSearchInFilterForType)
                    textSearchInFilterForType.value = 'on';
                }
              }
            }
          }
        }
        
        var allFields = true;
        if (formAction != "searchLocal" && formAction != "searchParallel") {
          if (enterFlag)
            allFields = false;
        }
 			var exclude = this.textEntry ? this.textEntry.name : null;
      params += FormProcessor.getFormFilters(form, allFields, exclude, true);
    }
    
    params += "&$form=" + currentFormName;
    params += "&" + propName + "_filter=y";
    if (!enterFlag)
      params += "&$selectOnly=y";
    if (enteredText  &&  params.indexOf("&" + propName + "=" + encodeURIComponent(enteredText)) == -1)
      params += "&" + propName + "=" + encodeURIComponent(enteredText);
    if (isInterface) {
      if (classValue)
        params += "&" + propName + "_class=" + classValue;
    }

    // request listbox context from the server via ajax
    postRequest(e, url, params, div, hotspot, this.onListLoaded);
 },
 
  // Touch UI CODE -----------------------------------
  panelBlock : null,
	tray : null, // each tray contains own form, options and (optionaly) calendar panels.
  
	formPanel : null,
	optionsPanel : null,
	classifierPanel : null,
	calendarPanel : null,
  
	curParamRow : null,
  curOptionsListDiv : null, // in Touch UI it is embeded options list
  textEntry : null,
  classifierTextEntry : null,
	
	curClassesPopupDiv : null,
	toPutInClassifier : false,
	curClass : null, // used for "2-steps" resource selection
	
  _isEditList : false,
  skipUserClick : false, // helps to skip "3rd" click in RL editor
  
	clonedEvent : null,
	
  // allows maltiple selection with help of delay.
  timerId : null,
  OPTIONS_DELAY : 1200,
  
	setTray : function(parent) {
		var tray = getChildByClassName(parent, "tray");
		if (tray)
			this.findElements(tray);
	},
	
	// trayChild here is clicked TR or tray of opened dialog
	findElements : function(trayChild) {
		// 1. tray in dialog
		var tray = getAncestorByClassName(trayChild, "tray");
		// 2. tray in RL editor
		if (!tray) {
			var resourceListDiv = document.getElementById("siteResourceList");
	  	tray = getChildByClassName(resourceListDiv, "tray");
		}

		// 3. test if we continue to work with the same tray
		if (this.tray != null && comparePosition(tray, this.tray) == 0)
			return;
		// 4. find other elements
		this.tray = tray;
		this.panelBlock = getAncestorByClassName(this.tray, "panel_block");
		this.formPanel = getChildByClassName(this.tray, "form_panel");
		this.optionsPanel = getChildByClassName(this.tray, "options_panel");
		this.classifierPanel = getChildByClassName(this.tray, "classifier_panel");
    this.calendarPanel = getChildByClassName(this.tray, "calendar_panel");
		
		this.textEntry = getChildById(this.optionsPanel, "text_entry");
		this.classifierTextEntry = getChildById(this.classifierPanel, "text_entry");
	},	
	
  onClickParam : function(event, optionsSelectorStr) {
		var $t = ListBoxesHandler;
		var target = getEventTarget(event);
		
		if (isElemOfClass(target, "input") && target.getAttribute("readonly") == null)
			return;

		if ($t.skipUserClick) {
			$t.skipUserClick = false;
			if (event != null)
				return;
		}
		else
			$t.skipUserClick = true; // prevent secondary click on (other) parameter
		
		if (!event)
			event = $t.clonedEvent;
		
		
		var isLink = getAncestorByTagName(target, "a") != null;
		var isRollUp = getAncestorByClassName(target, "rollup_td") != null;

		// There are links in date rollup that should be processed
		// rollup td without link inside
		if (isRollUp && !isLink)
			return;
		// link not in rollup td
		if (isLink && !isRollUp)
			return;
	
		var tr = getAncestorByClassName(target, "param_tr");
		if (!tr)
			return;	

		// reset tray if parent dialog was closed
		// note: not optimized for RL editor when "dialog" opened many times
		if (!$t.panelBlock || !isVisible($t.panelBlock) || $t.panelBlock.parentNode == null)
			$t.findElements(tr);

		// set members corresponding to happend event target
		if (SlideSwaper.doesSlidingRun($t.tray))
			return;

		// resource list: formPanel is empty (except \n)
		$t._isEditList = $t.formPanel.innerHTML.length < 10; ///*$t.tray == null || */($t.formPanel && $t.formPanel.innerHTML.length < 10);
		if ($t._isEditList) { 
			// init options selector in RL editor
			FieldsWithEmptyValue.initField($t.textEntry, "select")
	  }

		$t.clonedEvent = cloneEvent(event);
		$t.curClass = null; 
		 
		// 2nd click in RL editor; options list is opened
		if ($t._isEditList && isVisible($t.panelBlock)) {
			$t.onOptionsBackBtn();

			// click on different parameter then invoke this function with delay 800 ms
			if ($t.curParamRow && comparePosition($t.curParamRow, tr) != 0) {
		  	setTimeout("ListBoxesHandler.onClickParam(null, " + optionsSelectorStr + ")", 800);
		  	 $t.skipUserClick = true; // to skip additional clicks
		  }
			return;
		}
		else
			$t.curParamRow = tr;
			
    return $t.processClickParam(event, tr, optionsSelectorStr);
  },
	
  // optionsSelectorStr is not required parameter
  processClickParam : function(e, tr, optionsSelectorStr) {
		if (SlideSwaper.doesSlidingRun())
			return;

    var target = getEventTarget(e);

    // skip click on rollup (checkbox) td
 //   if(getAncestorByClassName(target, "rollup_td") != null)
 //     return;

		var isClassifier = this.isClassifier(tr);
    var arrowTd = getChildByClassName(tr, "arrow_td");
    if (!arrowTd && !isClassifier)
      return false; // no options for this item 

    var input = getChildByClassName(tr, "input");

    // prepare options div
    if (typeof optionsSelectorStr == 'undefined') {
      optionsSelectorStr = arrowTd.getAttribute("options_selector");
    }

		this.toPutInClassifier = false;
		var curPanel = this.getCurrentPanelDiv();
    
		var isCalendar = optionsSelectorStr == "calendar" && curPanel.className != "calendar_panel"
		var isDateRollup = isCalendar && getAncestorByClassName(target, "rollup_td") != null;
		
		// 1. calendar
		if (isCalendar && !isDateRollup) {
			// create calendar div if need.
			if (this.calendarPanel == null) {
				this.createCalendarPanel(this.tray);
			}
			this.showCalendar(tr);
		}
		// 2. options list
		else {
			// 2.1 specific for "classifier" options list
			if (optionsSelectorStr == "classifier") {
				var input = tr.getElementsByTagName("input")[0];
				//////// use class selection step only if no previously assigned resource value
				//if (input.value.length == 0) {
					if (this.classifierPanel == null)
						this.createClassifierPanel(this.tray);

					this.classifierPanel.style.display = "inline";
					this.toPutInClassifier = true;
			}
			
			// set name of text enry of current input field
			// numeric selector should be initialized with previously manually entered value
			if (this.textEntry && !isClassifier) {
		  	this.textEntry.name = input.name;
				if (tr.getAttribute("is_numeric") != null)
					FieldsWithEmptyValue.setValue(this.textEntry, input.value);
		  }
			
			var str = "";
			var classValue = null;
			if (isClassifier) { // 2.1 Classifier
				var paramsTable = getAncestorByClassName(tr, "rounded_rect_tbl");
				str = paramsTable.id.substr("table_".length) + "_filter";
				classValue = tr.id;
			}
			else if(isDateRollup) { // 2.2 date rollup
				str = target.parentNode.id;
			}
			else // 2.3 options list
				str = input.name + "_" + input.id + "_filter";
			
			// show options list
			this.listboxOnClick1(e, str, null, null, classValue, arrowTd);
		}
		return true; 
  },

  onListLoaded : function(event, popupDiv, hotspot, content) {
		var $t = ListBoxesHandler;
		var panel = $t.toPutInClassifier ? $t.classifierPanel : $t.optionsPanel;

    var listsCont = getChildById(panel, "lists_container");
    if (listsCont)
			listsCont.appendChild(popupDiv);
		else
			panel.appendChild(popupDiv);
  
		var noMatchesDiv = getChildByClassName(panel, "no_matches");
		if (noMatchesDiv) // temporary check gor RL edit
			noMatchesDiv.style.display = "none";

		popupDiv.innerHTML = content;

		// add highlighting
		TouchDlgUtil.init(popupDiv);
		
		// bind click on option row 
		var trs = popupDiv.getElementsByTagName("tr");
		for (var i = 0; i < trs.length; i++)
			trs[i].onclick = $t.onOptionsItemClick;

		$t.showOptions(popupDiv);

		// RL editor: align options list
		if ($t._isEditList && !isVisible($t.panelBlock)) {
			var form = getAncestorByAttribute(hotspot, "name", "siteResourceList");
			var scXY = getScrollXY();
			var leftEdge = findPosX(form) + scXY[0];
			var x = findPosX(hotspot) - $t.panelBlock.clientWidth;

			var y = findPosY(hotspot);
			var pageHeight = getWindowSize()[1] + scXY[1];
			
			if (pageHeight > y + $t.panelBlock.clientHeight + 30)  // show under item
	  		y += 30;
	  	else if (y - $t.panelBlock.clientHeight - 5 > 0)  // flip
	  		y -= $t.panelBlock.clientHeight + 5;
	  	else { // prevet showing over page top edge
	  		y = 0;
				x -= $t.curParamRow.clientWidth;
	  	}	
			
			// prevet showing more left than page left edge
			if (x < leftEdge)
				x = leftEdge;
			
			$t.panelBlock.style.left = x;
			$t.panelBlock.style.top = y;
			$t.panelBlock.style.visibility = "visible";
		}
  },

  showOptions : function(popupDiv) {
    var $t = ListBoxesHandler;

		var panel;
		if ($t.toPutInClassifier) {
			panel = $t.classifierPanel;
			$t.curClassesPopupDiv = popupDiv;
		}
		else {
			panel = $t.optionsPanel;
	    $t.curOptionsListDiv = popupDiv;
		}
		// set top offset (margin) to sutisfy current scroll position
		if (!$t._isEditList) {
			var topOffset = getScrollXY()[1] - findPosY($t.tray);
			panel.style.marginTop = (topOffset > 0) ? topOffset : 0;
		}
		
		panel.style.display = "inline";
		popupDiv.style.display = "block";
		$t.optionsPanel.style.height = "";
	
		if ($t.optionsPanel.offsetHeight < $t.panelBlock.offsetHeight)
			$t.optionsPanel.style.height = $t.panelBlock.offsetHeight;
		
    popupDiv.style.visibility = "visible";
    
    // show item/parameter name (if it is too long)
    $t.displayItemName();

		if ($t.panelBlock.id == "fts_filter" && Browser.ie) { // IE does not support min-width
			if ($t.optionsPanel.clientWidth > $t.panelBlock.clientWidth)
				$t.panelBlock.style.width = $t.optionsPanel.clientWidth;
		}
		
    // slide forward
		var curPanel = $t.getCurrentPanelDiv();
		if (curPanel && curPanel.className != panel.className) {
			var toResetTray = (SlideSwaper.getTrayPosition($t.tray) == 0) ? true : false;
			
			// hide invisible param-rows under page bottom trying to speed up sliding in FF.
			$t._hideInvisibleParams();
			SlideSwaper.moveForward($t.tray, toResetTray, $t.onOptionsDisplayed);
		}
  },
	
	// the following 2 functions try to speed up sliding in FF
	// they hide invisible parameter-rows under bottom page edge.
	// require more testing.
	_showInvisibleParams : function() {
		var table = this.curParamRow.parentNode;
		for (var i = 0; i < table.rows.length; i++) {
			var row = table.rows[i];
			row.style.display = "";
		}
		this.panelBlock.style.height = "";
	},
	
	_hideInvisibleParams : function() {
		var table = this.curParamRow.parentNode;
		var idx = table.rows[0].cells.length - 2;
		var bottomEdge = getWindowSize()[1] + getScrollXY()[1];
		var tableTop = findPosY(table);
		
		// prevent from change of vertical scrollbar height
		this.panelBlock.style.height = this.panelBlock.offsetHeight;
		
		for (var i = table.rows.length - 1; i >= 0; i--) {
			var row = table.rows[i];
			var rowBottom = tableTop + row.offsetTop;
			if (bottomEdge > rowBottom)
				break;
				
			row.style.display = "none";
		}
	},

  onOptionsDisplayed : function() {
    var $t = ListBoxesHandler;
		var textEntry = $t.toPutInClassifier ? $t.classifierTextEntry : $t.textEntry;
		TouchDlgUtil.focusSelector(textEntry, false);
		$t.skipUserClick = false; // accept click on parameter	
		
		if ($t._isEditList)
			setShadow($t.panelBlock, "6px 6px 25px rgba(0, 0, 0, 0.5)");
  },

  showCalendar : function(paramTr) {
		var $t = ListBoxesHandler;
		// set top offset (margin) to sutisfy current scroll position
		var topOffset = getScrollXY()[1] - findPosY(this.tray);
		$t.calendarPanel.style.marginTop = (topOffset > 0) ? topOffset : 0 ;

    $t.calendarPanel.style.display = "inline";
    
    var inputs = $t.getDateInputs(paramTr); //Filter.getPeriodInputs(paramTr);
	  startCalendar($t.calendarPanel, $t.onPeriodSelectionFinish, inputs[0], inputs[1]); // calCont
    
    // slide forward
    SlideSwaper.moveForward($t.tray, true);
  },
	
	isCalendar : function() {
		return this.calendarPanel != null && this.calendarPanel.style.display == "inline";
	},

  // returns 2 inputs for the filter (period)
  // and 1 input for data entry (date)
  getDateInputs : function(parent) {
    var inputs = parent.getElementsByTagName("input");
    var fromInp = null;
    var toInp = null;
    
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].type == "text") {
        if (inputs[i].name.indexOf("_To") != -1) 
          toInp = inputs[i];
        else
          fromInp = inputs[i];
      }
    }

    return [fromInp, toInp];
  },

  displayItemName : function() {
    var itemNameDiv = getChildById(this.optionsPanel, "item_name");
    
    var form = document.forms[currentFormName];
    var textField = getOriginalPropField(form, originalProp); // form.elements[originalProp];
    
    var label = getPreviousSibling(textField.parentNode);
    if (label) {
      itemNameDiv.innerHTML = getTextContent(label);
      itemNameDiv.style.display = "";
    }
  },
  
  // allows multiple selection timeout delay
	onOptionsItemClick : function(e) {
		var $t = ListBoxesHandler;
		e = getDocumentEvent(e);
		var target = getEventTarget(e);
		var tr = getAncestorByTagName(target, "tr");
				
		// call "old" processor of option item click
		// so, it sets _select and _verified
		if (!$t.toPutInClassifier) {
			var popup = Popup.getPopup($t.curOptionsListDiv.id)
			popup.popupRowOnClick1(e, tr, target);
		}
		
		$t.onOptionsItemClickProcess(tr);
	},
		
  onOptionsItemClickProcess : function(tr) {
	  var $t = ListBoxesHandler;

		if ($t.isClassifier(tr)) {
			$t.onClassifierItemClick(null, tr);
			return;
		}

		clearTimeout($t.timerId);
		if (SlideSwaper.doesSlidingRun())
			return true;
			
    if (tr.id == "$more" || tr.id.indexOf("$add") == 0) // prevent from "More" and "Add"
      return true;

    chkCell = tr.cells[0];
    var checkBox = chkCell.getElementsByTagName("input")[0];
    var vIcon = chkCell.getElementsByTagName("img")[0];
		
		// no checkbox - no single selection (data entry, rollup)
		if (!checkBox) {
			if (!vIcon) {
		  	$t.onOptionsSelectionFinish(tr);
		  	return; // false;
			}
			var isVisable = (vIcon.style.visibility.toLowerCase() == "visible"); // hidden in css
			if (isVisable) 
	  		vIcon.style.visibility = "hidden";
		  else {
		  	$t.removeV();
		  	vIcon.style.visibility = "visible";
		  }
			$t.onOptionsSelectionFinish(tr);
			return; // false;
		}
		
		// multiple selection (filter)
    if (checkBox.checked) {
      checkBox.checked = false;
    //  checkBox.removeAttribute("checked");
      vIcon.style.visibility = "hidden";
    }
    else {
      checkBox.checked = true;
    //  checkBox.setAttribute("checked", "true");
      vIcon.style.visibility = "visible";
    }
    // close options on timeout
    $t.timerId = setTimeout(ListBoxesHandler.onOptionsSelectionFinish, $t.OPTIONS_DELAY);
    return true;
  },
  
  onClassifierItemClick : function(e, tr) {
		this.curClass = tr.id;
		this.processClickParam(e, tr, "options");
	},	
	
  onOptionsSelectionFinish : function(lastClickedTr) {
		var $t = ListBoxesHandler;
		if (lastClickedTr && lastClickedTr.id == "$noValue") {
			$t.onBackBtn();
			return;
		}
		
		var textField = null;
		if ($t.isCalendar()) 
			textField = PeriodPicker.onSetThruList();
		
		if (textField == null) {
			var form = document.forms[currentFormName];
			textField = getOriginalPropField(form, originalProp);
		}

    var selectedOptionsArr = $t.getSelectedOptions(lastClickedTr);
	 	var tr = getAncestorByClassName(textField, "param_tr");
	  var rollupTd = getAncestorByClassName(textField, "rollup_td"); //getAncestorByTagName(textField, "td"); //getAncestorByClassName(textField, ["input_td"]);
    var chosenValuesDiv = getChildByClassName(tr, "chosen_values");

		if (rollupTd != null) { // rollup
			var img = rollupTd.getElementsByTagName("img")[0];
	  	textField.value = lastClickedTr.id;
			img.src = "icons/cakes.png";
		}
		else if (chosenValuesDiv) { // Filter or Subscribe
			var html = $t.getSelectedOptionsHtml(selectedOptionsArr, textField.name);
			chosenValuesDiv.innerHTML = html;
			
			// unselected all options / checkboxes
			if (selectedOptionsArr.length == 0) {
				textField.value = "";
				var verifiedField = form.elements[originalProp + "_verified"] 
				if (verifiedField)
					verifiedField.value = "n";
			}
			else { // on selection from options list remove value from textField
						 // textField used on manual data entry (!)
				textField.value = "";
			}
		}
		else { // data entry
			FieldsWithEmptyValue.setValue(textField, selectedOptionsArr[0]["value"]);
			// "_select" and "_verified" hidden fields processed in popupRowOnClick1
			
			// change color of touched input/value
			if ($t._isEditList) {
				// setting font as bold changes width & height of a field. So, fix it previously
				textField.style.width = textField.clientWidth;
				textField.style.height = textField.clientHeight;
 				textField.style.fontWeight = "bold";
		  }
		}
    
		$t.prevSelectorInputValue = ""; // reset
    // slide back
    $t.onBackBtn();
  },
  
  onPeriodSelectionFinish : function(fromInp, toInp) {
		var $t = ListBoxesHandler;
    var td = getAncestorByTagName(fromInp, "td");
    var chosenValuesDiv = getChildByClassName(td, "chosen_values");
		if (chosenValuesDiv) {
			var html = "";
			if (fromInp.value.length != 0) 
				html += "<div>" + fromInp.value + "</div>";
			if (toInp && toInp.value.length != 0) 
				html += "<div>" + toInp.value + "</div>";
		
			chosenValuesDiv.innerHTML = html;
		}
		
    // slide back
    $t.onBackBtn(1); 
  },
  
  // 1) multipele selection: checked [v]-icon.
  // 2) single selection allowed: lastClickedTr.
  getSelectedOptions : function(lastClickedTr) {
		var selectedOptions = new Array();
    // loop on options table rows.
    var optTable = getChildByClassName(this.curOptionsListDiv, "rounded_rect_tbl");
    var amt = optTable.rows.length;
    for (var i = 0; i < amt; i++) {
			var tr = optTable.rows[i];
      var chkCell = tr.cells[0];
      var checkBox = chkCell.getElementsByTagName("input")[0];
      if (checkBox) {
        if (checkBox.checked) {
					var paramNameTd = getChildByClassName(tr, "menuItem"); //getNextSibling(getNextSibling(checkBox.parentNode));
          var text = getTextContent(paramNameTd);
					selectedOptions.push({"text" : text, "value" : checkBox.value});
        }
      }
      else {
        // no checkbox(es) - data entry
				if (typeof lastClickedTr == "object") {
					var text = getTextContent(lastClickedTr).trim();
					selectedOptions.push({"text": text,	"value": text});
				}
        break;
      }
    } // the loop end
    return selectedOptions;
  },
  
  // clears selections in options panel
  removeV : function() {
    var optTable = getChildByClassName(this.curOptionsListDiv, "rounded_rect_tbl");
    var amt = optTable.rows.length;
    for (var i = 0; i < amt; i++) {
      var chkCell = optTable.rows[i].cells[0];
      var checkBox = chkCell.getElementsByTagName("input")[0];
      var img = chkCell.getElementsByTagName("img")[0];

      if (checkBox)
        checkBox.checked = false;
      if (img)
				img.style.visibility = "hidden";

    } // the loop end
  
  },
  
  getSelectedOptionsHtml : function(selectedOptionsArr, propName) {
    var html = "";
    for (var i = 0; i < selectedOptionsArr.length; i++) {
      html += "<div>" + selectedOptionsArr[i]["text"] + "</div>";
      if (propName)
      html +=
				// display name
			  "<input type=\"hidden\" value=\""
        + selectedOptionsArr[i]["text"]
        + "\" name=\""
        + propName
        + "\" />"
				
				// checkbox containig "reference" to the resource
        + "<input type=\"checkbox\" checked=\"true\" value=\""
        + selectedOptionsArr[i]["value"]
        + "\" name=\""
        + propName
        + "_select\" class=\"hdn\"/>";
    
    }
    return html;  
  },
	
  onParamReset : function() {
		this.makeParamReset();
		this.onBackBtn();
	},
  makeParamReset : function() {
    // remove value in coresponding <input>s
    var form = document.forms[currentFormName];
  
		// 1. text/hidden field
		var textField = getOriginalPropField(form, originalProp); // form.elements[originalProp];
//    textField.value = "";
		FieldsWithEmptyValue.setEmpty(textField);

		// 2. select field
		var selectField = form.elements[originalProp + "_select"] 
		if (selectField) {
			if (typeof selectField.length != 'undefined') {
				// possible several checkboxes and 1 hidden
				for (var i = 0; i < selectField.length; i++)
					selectField[i].value = "";
			}
			else
				selectField.value = "";
		}
		// 3. verified field
		var verifiedField = form.elements[originalProp + "_verified"] 
		if (verifiedField)
			verifiedField.value = "n";
		
		// 4. class filed	
		var classField = form.elements[originalProp + "_class"] 
		if (classField)
			classField.value = "";
			
    // 5. clear chosen_values in the filter
		// chosen_values contains corresponding "display names" (like text field)
		// and _select fields
		var paramTr = getAncestorByClassName(textField, "param_tr");
    var chosenValuesDiv = getChildByClassName(paramTr, "chosen_values");
    if (chosenValuesDiv)
      chosenValuesDiv.innerHTML = "";

    // remove selections in options panel
    this.removeV();

    // reset icon of complex date rollup
    var prop = textField.name;
    if (prop.indexOf("_groupBy") == prop.length - 8) {
      var targetImg = textField.parentNode.getElementsByTagName("img")[0];
      if (targetImg)
        targetImg.src = "icons/cakes_gray.png";
    }
  },

  onOptionsBackBtn : function() {
    var form = document.forms[currentFormName];
    var textField = getOriginalPropField(form, originalProp); // form.elements[originalProp]; // field of the form

    var td = getAncestorByTagName(textField, "td");
    if (td.className == "rollup_td") { // rollup, not parameter
			this.onBackBtn();
			return;
		}
		
		var value = "";
		var chosenValuesDiv = getChildByClassName(this.curParamRow, "chosen_values"); 
		// data entry: get 1st option item
		if (!chosenValuesDiv) { 
		  if (this.curOptionsListDiv && isVisible(this.curOptionsListDiv)) {
		  	var optTr = getChildByClassName(this.curOptionsListDiv, "option_tr");
				while (optTr && optTr.style.display == "none")
					optTr = getNextSibling(optTr);
				if (optTr && optTr.style.display != "none")
					value = getTextContent(optTr);
		  }
		}
		else // Filter: allows to set value from textEntry directly
			value = FieldsWithEmptyValue.getValue(this.textEntry);
		
		if (value.length != 0) {
			// remove possible selected values
			this.makeParamReset();
			if (chosenValuesDiv)
      	chosenValuesDiv.innerHTML = "<div>" + value + "</div>";
      textField.value = value;
		}
		
    this.onBackBtn();
  },

  onBackBtn : function() {
    var tray = getAncestorByClassName(this.optionsPanel, "tray");
    if (tray == null)
      var tray = getAncestorByClassName(this.calendarPanel, "tray");

		if (tray == null)
			return false;
			
		if (SlideSwaper.getTrayPosition(tray) == 0)
			return false;
		
		if (this._isEditList)
			setShadow(this.panelBlock, "");

    SlideSwaper.moveBack(tray);

		// posssible it is "Subscribe"
		var chosenValuesDiv = getChildByClassName(this.curParamRow, "chosen_values");
		var wasSelection = chosenValuesDiv != null && chosenValuesDiv.innerHTML.length != 0;
		SubscribeAndWatch.onOptionSelection(this.curParamRow, wasSelection);
    
		// instead of webkitTransitionEnd
    setTimeout("ListBoxesHandler.onBackFinish();", 800);
		return true;
  },
  
  onBackFinish : function() {
    var $t = ListBoxesHandler;
    if ($t.optionsPanel != null) {
      $t.optionsPanel.style.display = "none";
      if ($t.curOptionsListDiv)
				$t.curOptionsListDiv.style.display = "none";
    }
    if ($t.calendarPanel != null)
      $t.calendarPanel.style.display = "none";
    if ($t.classifierPanel != null) {
			$t.classifierPanel.style.display = "none";
			$t.curClassesPopupDiv.style.display = "none";
		}
		
		if ($t._isEditList) // hide panel block using on RL editor
			$t.panelBlock.style.visibility = "";
		
		$t.textEntry.name = "";
		
		if ($t.panelBlock.id == "fts_filter" && Browser.ie) { // IE width fitting
			$t.panelBlock.style.width = $t.formPanel.clientWidth; 
		}
		
		FieldsWithEmptyValue.setEmpty(this.textEntry);
		FieldsWithEmptyValue.setEmpty(this.classifierTextEntry);
		
		TouchDlgUtil.bleachBlueRow();
		$t._showInvisibleParams();

		$t.skipUserClick = false; // accept click on parameter
  },

  localOptionsFilter : function(typedText, parentDiv) {
	  typedText = typedText.toLowerCase();
    parentDiv = parentDiv || this.curOptionsListDiv
		var tbl = parentDiv.getElementsByTagName("table")[0];
 
		var rows = tbl.rows;
		var noMatches = true;
    for (var i = 0; i < rows.length; i++) {
      var label = getChildByClassName(rows[i], "menuItem");
      if (!label)
        continue;
			var chkCell = getChildByClassName(rows[i], "menuItemChk");
      var labelName = getTextContent(label).toLowerCase();
			
      if (labelName.indexOf(typedText) == 0) {
		  	rows[i].style.display = "";
				noMatches = false;
		  }
		  else 
		  	rows[i].style.display = "none";
    }

		var noMatchesDiv = getChildByClassName(this.optionsPanel, "no_matches");
		if (noMatches) {
			noMatchesDiv.innerHTML = "no matches for \"" + typedText + "\"";
			noMatchesDiv.style.display = "block";
		}
		else
			noMatchesDiv.style.display = "none";
  },
  
  // create Calendar
  createCalendarPanel : function(parent) {
    this.calendarPanel = document.createElement("div");
    this.calendarPanel.className = "calendar_panel";
    // this.calendarPanel.style.width = this.IPH_WIDTH;

    parent = this.optionsPanel.parentNode || parent; 
    parent.insertBefore(this.calendarPanel, this.optionsPanel);
    //parent.appendChild(this.calendarPanel);
  },
	
	// createClassesPanel
  createClassifierPanel : function(parent) {
    this.classifierPanel = this.optionsPanel.cloneNode(true);
    this.classifierPanel.className = "classifier_panel";

 		this.classifierTextEntry = getChildById(this.classifierPanel, "text_entry");
		this.classifierTextEntry.onkeydown = null; // remove autoComplete handler
		this.classifierTextEntry.onkeyup = this.onClassNameTyping;

		this.classifierTextEntry.value = "";
		FieldsWithEmptyValue.initField(this.classifierTextEntry, "select", true)
    
		parent = this.optionsPanel.parentNode || parent; 
    parent.insertBefore(this.classifierPanel, this.optionsPanel);
  },

	onClassNameTyping : function(e) {
		var $t = ListBoxesHandler;
		e = getDocumentEvent(e);
		// only local filtering of classes
		var typedText = getEventTarget(e).value;
		$t.localOptionsFilter(typedText, $t.curClassesPopupDiv);
	},
	
	isClassifier : function(child) {
		return getAncestorByClassName(child, "classifier_panel") != null;
  },
	
  // for calendar panel
  onDatesList : function() {
		var $t = ListBoxesHandler;
		$t.skipUserClick = false;
		$t.onClickParam($t.clonedEvent);
  },
	
	getCurrentPanelDiv : function() {
		if (this.tray == null)
			return null;
		var offset = SlideSwaper.getTrayPosition(this.tray);
		var panels = this.tray.childNodes;
		var n = 0;
		for (var i = 0; i < panels.length; i++) {
			if (!panels[i].style || panels[i].style.display == "none")
				continue;
			if (offset == n)
				return panels[i];
			n++;	
		}
	},
	getCurrentOptionsList : function() {
		return this.curOptionsListDiv;
	},
	// returns form panel div or current options list from options panel
	getCurrentListOfItems : function() {
		var div = this.getCurrentPanelDiv();
		if (div && isElemOfClass(div, "options_panel"))
			return this.curOptionsListDiv;
		return div;	
	},
	
	isEditList : function() {
		return this._isEditList;
	},
	
	isBusy: function(){
  	return this.skipUserClick;
  },
	isFormPanelCurrent: function(){
  	return SlideSwaper.getTrayPosition(this.tray) == 0;
  }
}

/*******************************************
* SlideSwaper
* tray contains 2 slides that are swaped
********************************************/
var SlideSwaper = {
  STEPS_AMT : 5,
  TIMEOUT : 25, // timeout between steps. On FF3 can not be applied too short timeout.
  DISTANCE : 20, // pecents of tray width 
  
	// ease-in-out // currently used for WebKit in common.css
	BEZIER_POINTS : [[0.0, 0.0], [0.42, 0.0], [0.58, 1.0], [1.0, 1.0]],
	
	offset : 0,
  
  curState : 0, // -1 means moveForward; -2 means moveForward twice.
  tray : null,
  callback: null,
  
  factor : 1,

  // callback is not required
  moveForward : function(tray, reset, callback) {
		if (this.offset != 0)
      return;

    this.tray = tray;
    this.callback = callback;
    
    if (typeof reset != 'undefined' && reset == true)
      this.curState = 0;
    
    if (Browser.webkit) {
      this.curState--;
		  this.tray.style.webkitTransform = "translate(" + this.DISTANCE * this.curState + "%, 0%)";
			if (callback) // note: failed to use 'webkitAnimationEnd' event
        setTimeout(callback, 500); // 500 - arbitary quite big timeout
    }
    else {
      this.isForward = true;
      this._moveStep();
    }
  },
  
  moveBack : function(tray, callback) {
	 	if (this.offset != 0)
      return;
      
		var trayPosition = this.getTrayPosition(tray);
		if (trayPosition == 0)
			return;

    this.factor = trayPosition;  
      
    this.tray = tray;
    this.callback = callback;

    if (Browser.webkit) {
      this.curState += this.factor;
      // to the beginning "translate(0%, 0%)";
      this.tray.style.webkitTransform = "translate(" + this.DISTANCE * this.curState + "%, 0%)";
    }
    else {
      this.isForward = false;
      this._moveStep();
    }
  },
  
	// There is a (temporary) HACK(!) - FF 3.6 FIXED!!!
	// focus/click in options selector containing in moved tray by MozTransfor invokes
	// additional offset (FF's bug). It was overcame with hack when on last step
	// MozTransfor is "substituted" with style.left. It should be removed after FF's bug fixing.
  _moveStep : function() {
    var $t = SlideSwaper;
    var dir = -1;
    var bPoint;
    if ($t.isForward)
      dir = -1;
    else
      dir = 1;
      
    bPoint = Math.bezierPoint($t.BEZIER_POINTS, $t.offset);
    $t.offset += 1.0 / $t.STEPS_AMT;
		
		if ($t.offset > 1.0) { // last step
			bPoint[0] = 1.0;
		}
		
		var distance = $t.factor * $t.DISTANCE;
		var left = Math.floor(dir * distance * bPoint[0]) + ($t.DISTANCE * $t.curState);  

    // for FF 3.1b2 that does not support -moz-transition-duration (?)
    if (typeof $t.tray.style.MozTransform != 'undefined') {
			// HACK! FF 3.5
			$t.tray.style.left = 0; 

			$t.tray.style.MozTransform = "translate(" + left + "%, 0%)";
		}
		else 
			$t.tray.style.left = left * 5 + "%"; // tray is 5 width of a panel


    if ($t.offset <= 1.0)
      setTimeout($t._moveStep, $t.TIMEOUT);
    else { // finish
      $t.offset = 0;
      $t.factor = 1;
      $t.curState += dir;
      
			// HACK! FF 3.5
	    $t.tray.style.MozTransform = "translate(0%, 0%)";
	    $t.tray.style.left = left * 5 + "%"; 

      if ($t.callback)
        $t.callback();
    }
  },
  
  // returns state of current tray or some pointed tray in pixels
	// currently, possible 3 offset-mechanisms:
	// 1) webkitTransform 2) MozTransform 3) style.left
  getTrayPositionInPercents : function(tray) {
    tray = tray || this.tray;
    if (!tray)
      return 0;

    var str = "";
		
		// check style.left first - it allows FF3.x hack
		str = tray.style.left; 
		if (str.length != 0)
      return parseInt(str) / 5;
    
		// translate --- 
    if (typeof tray.style.webkitTransform != 'undefined')
      str = tray.style.webkitTransform;
    else if (typeof tray.style.MozTransform != 'undefined')
      str = tray.style.MozTransform;
		
		if (str.length == 0)
      return 0;
    
		// takes first digit from "translate(x, y)"
		var numberStr = str.replace("translate(", "");
    return parseInt(numberStr); 
  },
	
	// returns integer 0, 1, 2
	getTrayPosition : function(tray) {
		return -Math.floor(this.getTrayPositionInPercents(tray) / this.DISTANCE);
	},
	doesSlidingRun : function() {
		if (!this.tray)
			return false;
			
		var pos = this.getTrayPositionInPercents(this.tray);
		if (pos % this.DISTANCE == 0)
			return false;
		return true;		
	}
}

/*******************************************
* Filter
* filter is common for several mobile pages
* only corresponding content is changed
********************************************/

var Filter = {
  //filterParent : null,
  FILTER_URL_DIV : "filter_url_div",
 // filterDiv : null, // <- container

  // contains DOM object of filters by urls
	// fiters collected by whole url not by type only as for mkResource data entry
  filtersArr : new Array(),
  
  loadingUrl : null,
  loadingPosition : null, // used for desktop
  currentFilterUrl : null,
	
	filterBackup : new Array(),

  // filter can have several
  initFilter : function(filterDiv) {
		var filterHeader = getChildByClassName(filterDiv, "header");
		var textEntry = getChildById(filterDiv, 'text_entry');
		FieldsWithEmptyValue.initField(textEntry, 'select')
		
		// set event handlers for toobar buttons
		var submitBtn = getChildById(filterHeader, "submitFilter");
		if (submitBtn)
			submitBtn.onclick = this.submit;

		var clearFilterBtn = getChildById(filterHeader, "clear");
		if (clearFilterBtn)
			clearFilterBtn.onclick = this.submitClearFilter;
		
		var closeFilterBtn = getChildById(filterHeader, "close");
		if (closeFilterBtn)
			closeFilterBtn.onclick = this.hide;
		
		// note: filter contains only one paramsTable
    // init filter content
    var paramsTable = getChildByClassName(filterDiv, "rounded_rect_tbl");

    if (!paramsTable)
      return false;
    
    CheckButtonMgr.substitute(filterDiv);
 
    var paramSel = getChildById(filterDiv, 'parameter_selector');
    FieldsWithEmptyValue.initField(paramSel, 'select');
    var textSearch = getChildById(filterDiv, '-q');
    FieldsWithEmptyValue.initField(textSearch, 'search');

    for (var i = 0; i < paramsTable.rows.length; i++) {
      var td = paramsTable.rows[i].cells[1];
			if (td) {
		  	var isCalendar = (td.getAttribute("options_selector") == "calendar");
		  	if (isCalendar) 
		  		this._initPeriodTd(td);
		  }
    }    
    
    // assign mouse handlers
    addEvent(paramsTable, 'click',     ListBoxesHandler.onClickParam, false);
		TouchDlgUtil.init(filterDiv);
    
		// embeded into page filter
		if (filterDiv.id == "fts_filter") {
			this.currentFilterUrl = window.location.href;
			this.filtersArr[this.currentFilterUrl] = filterDiv;
		}
		
    return true;
  },
  
  _initPeriodTd : function(td) {
    var inputs = ListBoxesHandler.getDateInputs(td); //this.getPeriodInputs(td);
    var chosenValuesDiv = getChildByClassName(td, "chosen_values");
    chosenValuesDiv.innerHTML = "<div>" +
        inputs[0].value + "</div>" + "<div>" + inputs[1].value + "</div>";
  },
  
  // hotspot used to search FILTER_URL_DIV in current mobile page
  // otherwise - in document for desktop version
  show : function(x, y, e, hotspot) { // hotspot, x, y)
		if (this.loadingUrl != null)
      return; // downloading

    var filterUrl = this.retrieveFilterUrl();

 		// no type in url - no filter
		if (getUrlParam(filterUrl, "type") == null)
			return;
 
   	// hide possible opened dialogs
		TouchDlgUtil.closeAllDialogs();
		
    // 1. filter for that type already loaded
    if (this.filtersArr[filterUrl]) {
			// mobile has several filters simultaneously
			if (Browser.mobile) {
		  	this.filtersArr[filterUrl] = document.body.appendChild(this.filtersArr[filterUrl]);
				this.handleFilterState(true);
		  }
			setDivVisible(null, this.filtersArr[filterUrl], null, null, x, y, null, true);
    }
    // 2. download new filter for this type
    else {
      this.loadingUrl = filterUrl;
      var urlParts = filterUrl.split('?');

      if (x && y)
        this.loadingPosition = [x, y];
      else
        this.loadingPosition = null;  
    
      postRequest(e, urlParts[0], urlParts[1], null, hotspot, this.onFilterLoaded);
    }
  },
	// saves / restores filter state before user interaction
	// Note: for mobile filter resets on cross icon as well
	handleFilterState : function(toSave) {
		if (this.filterBackup == null) {
			if (toSave)
				this.filterBackup = new Array();
			else
				return; // nothing to resore	
		}

		// 1. filter parameters
		var paramsTable = getChildByClassName(this.filtersArr[this.currentFilterUrl], "rounded_rect_tbl");
		var idx = 0;
		
		for (var i = 0; i < paramsTable.rows.length; i++) {
			var cells = paramsTable.rows[i].cells;
			for (var j = 0; j < cells.length; j++) {
				if (cells[j].className != "data_td") 
					continue;
				
			if (toSave) 
				this.filterBackup[idx] = cells[j].innerHTML;
			else if (cells[j].innerHTML != this.filterBackup[idx]) {
				cells[j].innerHTML = this.filterBackup[idx];
			}
				idx++;
			}
		}
		// 2. search field
		var searchField =  getChildById(this.filtersArr[this.currentFilterUrl], "-q");
		if (searchField) {
			if (toSave) {
		  	this.filterBackup["-q"] = FieldsWithEmptyValue.getValue(searchField);
				FieldsWithEmptyValue.updateClearControl(searchField);
		  }
		  else 
		  	FieldsWithEmptyValue.setValue(searchField, this.filterBackup["-q"]);
		}
		
		if (!toSave && Browser.mobile) // reset after restoring
			this.filterBackup = null;
	},
	
// callback
  onFilterLoaded : function(event, div, hotspot, content, url) {
	  var $t = Filter;

		if (!$t.loadingUrl)
			$t.loadingUrl = url;
			
	  $t.currentFilterUrl = $t.loadingUrl;

    var loadedFilter = $t.createFilterDomObject(content);
    
    if (loadedFilter == null)
      return;
    
		// insert in DOM
		$t.filtersArr[$t.currentFilterUrl] = document.body.appendChild(loadedFilter);

		ExecJS.runDivCode(loadedFilter);
 
    var initialized = $t.initFilter($t.filtersArr[$t.currentFilterUrl]);
		if (!initialized && Browser.mobile) {
//			 alert("problem to initialize filter"
//				+ "<br/>possible came login page instead the filter"
//				+ "<br/>handling of this case should be implemented!");
		}

    // desktop has filter position
    if (initialized || Browser.mobile) { // not initialized if filter is empty
    	var x = 0, y = 0; 
			if ($t.loadingPosition) {
		  	x = $t.loadingPosition[0];
		  	y = $t.loadingPosition[1];
		  }
			setDivVisible(null, loadedFilter, null, null, x, y, null, true);
		}
		
		$t.handleFilterState(true);
    $t.loadingUrl = null;
  },
  
  createFilterDomObject : function(html) {
    var filterDiv = getDomObjectFromHtml(html, "className", "panel_block");
	
		// no filter in response - possible login page
    if (filterDiv == null) {
      /* // not implemented !!!!!!!!!!!
      var url = getBaseUrl() + "register/user-login.html";
      Mobile.getPage(null, url);
      */
			alert("Filter not found!");
      return null;
    }
    
 		// for gecko
    filterDiv.style.visibility = "hidden";
    return filterDiv;
  },
  
	// reset filter for mobile
  hide : function() {
		var $t = Filter;

	 	if (!Browser.mobile) { // desktop
			var url = $t.currentFilterUrl;
			if ($t.filtersArr[url] && 
					$t.filtersArr[url].parentNode.tagName.toLowerCase() == "body") {
				$t.filtersArr[url].style.display = "none";
		  }
			DesktopSearchField.onFilterHide();
			return;
		}
	 	
		// mobile
		var url = $t.currentFilterUrl; //$t.retrieveFilterUrl();
    if ($t.filtersArr[url] &&
       getAncestorByTagName($t.filtersArr[url], "body")) {
      var parent = $t.filtersArr[url].parentNode;
      
      // remove filter from DOM
			$t.filtersArr[url] = parent.removeChild($t.filtersArr[url]);
			$t.filtersArr[url].style.display = "none";
			$t.handleFilterState(false);
    }
  },
  
  submit : function(e) {
		e = getDocumentEvent(e);
		var btn = getEventTarget(e);
		Filter.submitProcess(e, getAncestorByClassName(btn, "form_panel"), false);
  },

  // just closes filter panel if there were no filtering
  submitClearFilter : function(e) {
		var $t = Filter;
		e = getDocumentEvent(e);
		var btn = getEventTarget(e);
		
    var url = window.location.href;
    if (Browser.mobile)
      url = Mobile.getCurrentUrl();
   
    // url contains '-cat=on' '-q=' or parameter starts from "." then filtering exists
    // and no 'clear=Filter'
    if ((url.indexOf('-cat=on') != -1 || url.indexOf('-q=') != -1 ||
				url.indexOf('&.') != -1) &&	url.indexOf('clear=Filter') == -1) {
			BrowserDialog.setCallbackArguments(e, btn);
			// clear filter
			$t.submitProcess(e, getAncestorByClassName(btn, "form_panel"), true);
		}
		else {
			$t.hide();
			$t.clearRollups();
			
			if (!Browser.mobile)
				$t.handleFilterState(false);
		}
  },
  
	submitClearFilterCallback : function (toClear, e, btn) {
		var $t = Filter;
		if (toClear)
	  	$t.submitProcess(e, getAncestorByClassName(btn, "form_panel"), true);
		else
			$t.hide();	
	},
	
  submitProcess : function(e, parent, toClearFilter) {
		if (!parent) { // on <enter> key
			if (typeof this.filtersArr[this.currentFilterUrl] != 'undefined') {
		  	parent = this.filtersArr[this.currentFilterUrl];
				if (parent.style.display == 'none')
					return false;	
		  }
		  else 
		  	return false;
		} 
		
    var forms = parent.getElementsByTagName("form");
    var input;
    
    var filterForm = forms[0];
    // mobile panel contains 2 forms: text searchForm and filter
    if (forms.length == 2)
      filterForm = forms[1];
			
    // append corresponding hidden field (like "submit button") for server processing
    if (toClearFilter)
      input = this._createHiddenInput("clear", "Filter");
    else
      input = this._createHiddenInput("submitFilter", "Filter");
    
    filterForm.appendChild(input);

    // note: submit() does not invoke the onsubmit event handler
    // Call the onsubmit event handler directly
    var url = FormProcessor.onSubmitProcess(e, filterForm);
    
		if (Browser.mobile)
      Mobile.getPage(e, url);
    else 
      filterForm.submit();
		
		// hide (and reset for mobile) filter
		this.hide();
		return true;
  },
  
  // simulates 
  _createHiddenInput : function(name, value) {
    var input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    return input;
  },
  
	clearRollups : function() {
		var $t = Filter;
		var url = $t.retrieveFilterUrl();
    if (!$t.filtersArr[url]) 
			return;
	
		var cells = $t.filtersArr[url].getElementsByTagName("td");
		for (var i = 0; i < cells.length; i++) {
			if (cells[i].className == "rollup_td") {
				var btn = cells[i].getElementsByTagName("div")[0];
				var input = cells[i].getElementsByTagName("input")[0];
				if (!btn || !input)
					continue;
				CheckButtonMgr.setState(btn, input, false, true);
			}
		}
	},
	  
  onPeriodReset : function() {
    var inputs = PeriodPicker.getInputs();
    inputs[0].value = "";
    inputs[1].value = "";
    var chosenValuesDiv = getChildByClassName(inputs[0].parentNode, "chosen_values");
    chosenValuesDiv.innerHTML = "";
    
    ListBoxesHandler.onBackBtn(1);
  },

  // hides params with not suited beginning.
  onParamNameTyping : function(paramNameField) {
		var $t = Filter;
		
    var typedText = FieldsWithEmptyValue.getValue(paramNameField).toLowerCase();
    var paramsTable = getChildByClassName($t.filtersArr[$t.currentFilterUrl], "rounded_rect_tbl");
    if (!paramsTable)
      return;
    var rows = paramsTable.rows;
    var noMatches = true;
		for (var i = 0; i < rows.length; i++) {
      var label = getChildByClassName(rows[i], "label");
			
			if (!label) {
				// FTS filter contains statistic data / row
				if (rows[i].className == "filter_stat" && i > 0) {
					if (rows[i - 1].style.display == "none")
						rows[i].style.display = "none";
					else
						rows[i].style.display = "";	
				}
				continue;
			}
			
      var labelName = getTextContent(label).toLowerCase();
      if (labelName.indexOf(typedText) == 0) {
	  	rows[i].style.display = "";
				noMatches = false;
		  }
		  else 
		  	rows[i].style.display = "none";
	  }
		
		var formPanel = getAncestorByClassName(paramsTable, "form_panel");
		var noMatchesDiv = getChildByClassName(formPanel, "no_matches");
		if (noMatches) {
			noMatchesDiv.innerHTML = "no matches for \"" + typedText + "\"";
			noMatchesDiv.style.display = "block";
		}
		else
  		noMatchesDiv.style.display = "none";
  },
	
	retrieveFilterUrl: function(){
		var urlPointer = "";
		if (Browser.mobile) {
  		var page = Mobile.getCurrentPageDiv();
				urlPointer = getChildById(page, this.FILTER_URL_DIV);
			}
			else 
				urlPointer = document.getElementById(this.FILTER_URL_DIV);
			
			return getTextContent(urlPointer);
	}
}


/*******************************************
* SubscribeAndWatch
********************************************/
var SubscribeAndWatch = {
	panelBlock : null,
	
	onLoaded : function(event, div, hotspot, content, url) {
		this.panelBlock = getDomObjectFromHtml(content, "className", "panel_block");
		var paramsTable = getChildByClassName(this.panelBlock, "rounded_rect_tbl");
		
		var paramSel = getChildById(this.panelBlock, 'item_selector');
    FieldsWithEmptyValue.initField(paramSel, 'select');
    var optionSel = getChildById(this.panelBlock, 'text_entry');
    FieldsWithEmptyValue.initField(optionSel, 'search');
    
		// init
		FormProcessor.initForms(this.panelBlock);
		
		document.body.appendChild(this.panelBlock);
		
		addEvent(this.panelBlock, "change", this.onchange, false);
		setDivVisible(event, this.panelBlock, null, null, 5, 5);
	},
	
	submit : function(e) {
		var $t = SubscribeAndWatch;
		if ($t.panelBlock == null)
			return false;
			
		var form = getChildByTagName($t.panelBlock, "form");
		$t.panelBlock.style.display = "none";
		FormProcessor.getFormFilters(form, false, null, false);
		form.submit();
		return true;
	},
	
	hide : function() {
		var $t = SubscribeAndWatch;
		if ($t.panelBlock == null)
			return;
		$t.panelBlock.style.display = "none";
		$t.panelBlock.parentNode.removeChild($t.panelBlock);
		$t.panelBlock = null;
		PlainDlg.onSubscribeAndWatchHide();
	},
	
	onOptionSelection : function(paramTr, wasSelection) {
		var $t = SubscribeAndWatch;
		if ($t.panelBlock != null && $t.panelBlock.style.display != "none") {
			var input = paramTr.getElementsByTagName("input")[0];
			var toggleBtn = getChildByClassName(input.parentNode, "iphone_checkbox");
			CheckButtonMgr.setState(toggleBtn, input, wasSelection);
		}
	},
	
	onchange : function(event) {
		var $t = SubscribeAndWatch;
		var target = getEventTarget(event);
		if (target.className != "input")
			return;
			
		var value = FieldsWithEmptyValue.getValue(target);
		if (value == null)
			return;
		
		var paramTr = getAncestorByClassName(target, "param_tr");
		
		$t.onOptionSelection(paramTr, value.length != 0); 	
	},
	
	limitNumberOfAlerts : function() {
		var contentTd = getChildByClassName(this.panelBlock, "content");
		// IE <=7 does not support display = "table-cell"
		// (a fix thru CSS "subclass" was not implemented
		if (Browser.ie)
			contentTd.style.display = "inline";
		else	
			contentTd.style.display = "table-cell";
		
		var subscribeNoteDiv = getChildById(this.panelBlock, "subscribeNote");
		subscribeNoteDiv.className = "";
	}
}


/*******************************************
* DataEntry
* 1. multi-dialog support for mobile version
* 2. handles dialogs for data entry in Touch UI
********************************************/
var DataEntry = {
	dataEntryArr : new Array(),
	loadingUrl : null,
	currentUrl : null,
	_hdnDiv : null, // used to convert html to DOM object
	inpValues : null, // used for mkResource forms
	
	onDataError : false, // data entry was returned by server with errors on data entry
	
	hotspotDim : null,
	
	show : function(e, url, hotspot) {
		if (this.loadingUrl != null)
			return;

		this.hotspotDim = {x:0, y:0};
		if (hotspot)
			this.hotspotDim = getElementCoords(hotspot);
		
		// hide possible opened dialogs
		TouchDlgUtil.closeAllDialogs();

		var isSecondClick = (this.currentUrl == url);		
		if (isSecondClick)
			return;
		
		var key = this._getKey(url);
		if (this.dataEntryArr[key]) { // data entry stored (in mobile mode)
			if (this.isMkResource(url))
				this.doStateOnMkResource(this.dataEntryArr[key], true);
			
			if (Browser.mobile &&
							 getAncestorByTagName(this.dataEntryArr[key], 'body') == null) {
				
				document.body.appendChild(this.dataEntryArr[key]);
		  	// RTE requires new initialization after insertion into document (?!)
				if (!Browser.mobile)
					ExecJS.runDivCode(this.dataEntryArr[key]);
			}
			// on desktop only hide/show, without append/remove
			setDivVisible(null, this.dataEntryArr[key], null, hotspot, 5, 5, null);
			this.currentUrl = url;
		}
		else {
			this.loadingUrl = url;
			urlParts = url.split('?');
			postRequest(e, urlParts[0], urlParts[1], null, null, this.onDataEntryLoaded);
		}
	},

	// parameters provided by XHR and not all used
	onDataEntryLoaded : function(event, div, hotspot, html, url, onDataError) {
		var $t = DataEntry;

		if (onDataError) { // server returned previously submitted data dialog with errors of data entry
			$t.onDataError = true;
			$t.currentUrl = url;
			// to show dialog at page top
			window.scrollTo(0, 0);
		}
		else 
			$t.currentUrl = $t.loadingUrl;
			
		$t.loadingUrl = null;

		div = getDomObjectFromHtml(html, "className", "panel_block");
		div.style.visibility = "hidden";
		// insert in DOM
		div = document.body.appendChild(div);
	
		// onDataError happens on mkResource
		if (onDataError || $t.isMkResource($t.currentUrl))
			$t.doStateOnMkResource(div, true);

		var tdsAmt = div.getElementsByTagName("tr").length; // includes "liquid" table TDs
		// hide slector / iphone_field if data entry contains a little number of items		
		if (tdsAmt < 20) {
			var iphoneField = getChildByClassName(div, 'iphone_field'); // gui wrapper of item_selector
				iphoneField.style.visibility = "hidden";
		}
		else {
	    	var itemSelector = getChildById(div, 'item_selector');
			FieldsWithEmptyValue.initField(itemSelector, 'select');
		}

		var textEntry = getChildById(div, 'text_entry');
		FieldsWithEmptyValue.initField(textEntry, 'select')

		FormProcessor.initForms(div);
		TouchDlgUtil.init(div); // moved from ListBoxes
		ExecJS.runDivCode(div);

		// show dialog after GUI initialization
		setDivVisible(event, div, null, null, 5, 5, $t.hotspotDim);
		
		var key = $t._getKey($t.currentUrl);
		$t.dataEntryArr[key] = div;
	},
	
	onDataEntryRejection : function(event, div, hotspot, html, url) {
		var $t = DataEntry;
		$t.onDataEntryLoaded(event, div, hotspot, html, url, true);
	},
	
	hide : function (e, hideIcon) {
		var key = this._getKey(this.currentUrl);
		if (key == null)
			return;
		
		if (!this.dataEntryArr[key] || !this.dataEntryArr[key].parentNode)
			return;
		
		// on desktop only hide/show, without append/remove
		if (!Browser.mobile) {
			this.dataEntryArr[key].style.display = "none";
		}
		// mobile: append/remove dialogs
		else {
			document.body.removeChild(this.dataEntryArr[key]);
		}

		// resore initial state of MkResource dialog
		if (this.isMkResource(this.currentUrl)) 
			this.doStateOnMkResource(this.dataEntryArr[key], false);

		// enforce to reload data entry without error message.
		if (this.onDataError) {
			delete this.dataEntryArr[key];
			this.onDataError  = false;
		}
		
		this.currentUrl = null;
	},
	
	// hides params with not suited beginning.		
  onParamNameTyping : function(paramNameField) {
    var typedText = FieldsWithEmptyValue.getValue(paramNameField).toLowerCase();
    var paramsTable = getAncestorById(paramNameField, "dataEntry");
    var spans = paramsTable.getElementsByTagName("span");
    var noMatches = true;
		for (var i = 0; i < spans.length; i++) {
			var classes = ["label", "propLabel1"];
			if (!isElemOfClass(spans[i], classes))
        continue;
      var labelName = getTextContent(spans[i]).toLowerCase();
      var row = getAncestorByClassName(spans[i], "param_tr");
      if (labelName.indexOf(typedText) == 0 && row) {
		  	row.style.display = "";
				noMatches = false;
		  }
		  else if (row)
		  	row.style.display = "none";
	  }
		
		var formPanel = getAncestorByClassName(paramsTable, "form_panel");
		var noMatchesDiv = getChildByClassName(formPanel, "no_matches");
		if (noMatches) {
			noMatchesDiv.innerHTML = "no matches for \"" + typedText + "\"";
			noMatchesDiv.style.display = "block";
		}
		else
			noMatchesDiv.style.display = "none";
			
  },
	
  submit : function(e, submitIcon) {
		var $t = DataEntry;
		var form = null;
		if (submitIcon) {
			form = getAncestorByTagName(submitIcon, "form");
			if (form == null) {
				var panel = getAncestorByClassName(submitIcon, "panel_block");
				form = getChildByTagName(panel, "form");
			}
		}
		else {
			var dataEntry = $t.getCurrentDataEntry();
			if (!dataEntry) 
				return false;
			form = getChildByTagName(dataEntry, "form");
		}
		
		// wasSubmitted flag prevents form submission twice but
		// 1. mobile stores forms 2. data entry dialog closed on submissoin
		if (Browser.mobile)
			form.removeAttribute("wasSubmitted");

		var res = FormProcessor.onSubmitProcess(e, form);
		
	//	this.hide();
		
		if (Browser.mobile) {
      var url = res;
			if (this.isMkResource(url))
				Mobile.getPage(e, url, false);
			else
      	Mobile.getPage(e, url, true);
    }
		// desktop; html form
    else if (res == true)
			form.submit();  // submit is not a button, so send the form with help of JS.
		
		this.hide();
		
		return true;	
  },
	
	// MkResource uses the same data entry for one resource type
	_getKey : function(url) {
		if (this.onDataError) {
			return "onDataError";
		}
		else if(url == null)
			return null;
		
		if (this.isMkResource(url)) {
			var key = getUrlParam(url, "type");
			if (url.indexOf("$rootFolder=") != -1) // $rootFolder also defines type
				key += "_rf";
			return key;	
		}
		return url;	
	},
	
	isMkResource : function(url) {
		return (url.indexOf("-$action=mkResource") != -1);
	},
	
	// mkResource form used for all URLs with the same resource type
	// doStateOnMkResource saves / restores initial values of mkResource inputs
	doStateOnMkResource: function(div, toSave){
		if (toSave)
			this.inpValues = new Array();
		else if (this.inpValues == null)	
			return;
			
		var inputs = div.getElementsByTagName("input");
		for (var i = 0; i < inputs.length; i++) {
			if (toSave) 
		  	this.inpValues[i] = inputs[i].value;
		  else {
				if (FieldsWithEmptyValue.hasEmptyValue(inputs[i])) {
					FieldsWithEmptyValue.setEmpty(inputs[i]);
					if (inputs[i].id == "item_selector")
						this.onParamNameTyping(inputs[i]); 
				}
		  	else
					inputs[i].value = this.inpValues[i];

				if (inputs[i].id == "item_selector")
					this.onParamNameTyping(inputs[i]); 
		  }
		}
		if (!toSave)
			this.inpValues = null;
	},
	
	getCurrentDataEntry : function() {
		if (this.currentUrl != null) {
			// 1. dialog
			var key = this._getKey(this.currentUrl);
			if (this.dataEntryArr[key] && this.dataEntryArr[key].parentNode) 
				return this.dataEntryArr[key];
		}	
		
		// 2. on page data entry. Note: it is not "recorded" in dataEntryArr!
		var divEdit = document.getElementById("div_Edit");
		if (divEdit && getElementStyle(divEdit).display != 'none') {
			var onPageDataEntry = getChildByClassName(divEdit, "panel_block");
			if (onPageDataEntry) 
				return onPageDataEntry;
		}
		
		// 3. on page data entry
		// ---
		
		return null;
	}
}

/*****************************************************************
* PlainDlg
* menu popups and "blue" dalogs
* NOTE: menu popus content is stored but NOT "blue" dalogs' one
******************************************************************/
var PlainDlg = {
	ID : "pane2", // "pane2" name was inherited from previous UI version
	dlgDiv : null, 
	dlgArr : new Array(), // stores content of previously downloaded dialogs. Used for MENU only!
	curUrl : null,

	// anchor can be omitted and retrieved from click-event
	show : function(e, urlStr, anchor) {
		var $t = PlainDlg;
	  e = getDocumentEvent(e); if (!e) return;
  
	  if (!anchor) {
			var target = getTargetElement(e); if (!target) return;
			anchor = getTargetAnchor(e);
		}
	
	  var finalUrl;
	  if (urlStr)
	    finalUrl = urlStr;
	  else {
	    if (!anchor)
	      return;
	    urlStr = anchor.href;
	  }
		
		var isSecondClick = ($t.curUrl == urlStr);
		// hide possible opened dialogs including previously opened PlainDlg
		TouchDlgUtil.closeAllDialogs();
		if (isSecondClick)
			return;
		
		$t.curUrl = urlStr;
		if (!$t.dlgDiv)
			$t.createDiv();
		
		$t.dlgDiv.innerHTML = "";
		// show stored content
		if (typeof $t.dlgArr[urlStr] != 'undefined') { // this.dlgArr != null && 
			$t.dlgDiv.appendChild($t.dlgArr[urlStr]);
			$t._show(e, anchor);
			return stopEventPropagation(e);
		}
		
	  var idx = urlStr.indexOf('.html');
	  if (idx != -1) {
	    var idx1 = urlStr.lastIndexOf('/', idx);
	    finalUrl = urlStr.substring(0, idx1 + 1) + urlStr.substring(idx1 + 1);
	  }
	
	  var idx = finalUrl.indexOf('?');
	  if (idx == -1) {
	    idx = finalUrl.length;
	    finalUrl += '?';
	  }
	  else
	    finalUrl += '&';
	  finalUrl += "-inner=y";
	
		var action = getUrlParam(finalUrl, "-$action");
	 	var url = finalUrl;
		var params = null;
		// if (finalUrl.length > 2000) {
			url = finalUrl.substring(0, idx);
			params = finalUrl.substring(idx + 1);
			// }
			
		postRequest(e, url, params, $t.dlgDiv, anchor, PlainDlg.onDialogLoaded);
	  return stopEventPropagation(e);
	},
	
	showPreloaded : function(event, id, hotspot) {
		var toInitialize = false;
		
		if (typeof this.dlgArr[id] == 'undefined') {
			this.dlgArr[id] = document.getElementById(id);
			this.dlgArr[id].className = ""; // remove "hdn" class to show content
			toInitialize = true;
		}
		if (!this.dlgDiv)
			this.createDiv();
		
		isSecondClick = (this.curUrl == id);
		// hide possible opened dialogs including previously opened PlainDlg
		TouchDlgUtil.closeAllDialogs();
		if (isSecondClick)
			return;
		
		this.curUrl = id;	
		this.dlgDiv.appendChild(this.dlgArr[id]);
		if (toInitialize)
			FormProcessor.initForms(this.dlgDiv);
		// items navigation
		TouchDlgUtil.init(this.dlgDiv);
		hotspot = hotspot || getEventTarget(event);
		this._show(event, hotspot);
	},
	
	_show : function(event, hotspot) {
		var iframe = document.getElementById('dialogIframe');

		if(FullScreenPopup.show(this.dlgDiv, hotspot) == false)
	    setDivVisible(event, this.dlgDiv, iframe, hotspot, 5, 5);
		
		if (TouchDlgUtil.isMenuPopup(this.dlgDiv))
			TabMenu.setActiveTab(getAncestorByClassName(hotspot, "dashboard_btn"))
	},
	
	// XHR callback
	onDialogLoaded : function (event, div, hotspot, content, url) { 
		var $t = PlainDlg;

	  // SubscribeAndWatch.
		// TODO: call it in better way, for example, thru LinkProcessor.onClickDisplayInner 
		if (url.endsWith("subscribe.html")) {
			SubscribeAndWatch.onLoaded(event, div, hotspot, content, url);
			return;
		}
		
	  setInnerHtml(div, content);
		FormProcessor.initForms(div);
		// items navigation
		TouchDlgUtil.init(div);
		
		$t._show(event, hotspot);
	  
		// update page if content is empty (all is ok)
	  if (content.length == 0)
	    window.location.reload();
	  
	},
	
	hide : function (e) {
		var $t = PlainDlg;
		if ($t.dlgDiv == null) // || $t.curUrl == null
			return;
		
	  // var dialogIframe = document.getElementById('dialogIframe');
	  setDivInvisible($t.dlgDiv/*, dialogIframe*/);
	 	if (!Browser.mobile)
			Tooltip.hide(true);
	 	
		if ($t.dlgArr == null)
			$t.dlgArr = new Array();
		
		var curContentElem = $t.dlgDiv.firstChild;

		if (curContentElem)
			$t.dlgDiv.removeChild(curContentElem);
		
		// store content
		if ($t.curUrl && $t.curUrl.indexOf("-menu=y") != -1)
			$t.dlgArr[$t.curUrl] = curContentElem;	
		
		$t.curUrl = null;
		return stopEventPropagation(e);
	},
	// note: subscribe/watch dialog uses PlainDlg basis.
	onSubscribeAndWatchHide : function() {
		this.curUrl = null;
	},
	
	createDiv : function() {
		this.dlgDiv = document.createElement("div");
		this.dlgDiv.id = this.ID;
		this.dlgDiv.className = "panel_block";
		
		if (Browser.ie || Browser.opera)
			this.dlgDiv.style.width = 200;
			
		document.body.appendChild(this.dlgDiv);
	},
	getPane2Dialog : function() {
		if (!this.dlgDiv)
			this.createDiv();

		return this.dlgDiv;
	}
}

/*******************************************
* TouchDlgUtil
* common features for all dialogs
********************************************/
var TouchDlgUtil = {
	TR_CLASS : ["param_tr"/*, "option_tr", "menuItemRow"*/],
	
	blueTr : null, //used for blue highlighting
	greyTr : null,
	skipBleachBlue : false, // used with RL editor
	
	curDlgDiv : null,
	focusHolder : null,

	wasOnceInit : false, // to hide autocomplete
	
	// it is called for 1) whole dialog + form panel 2) for each options list
	init : function(parent) {
		if (this.wasOnceInit == false) {
			addEvent(document.body, 'click', this.onBodyClick, false);
			wasOnceInit = true;
		}
		
		// autocomplete popup
		if (this.isAutocompletePopup(parent)) {
			var table = parent.getElementsByTagName("table")[0];
			var rows = table.rows;
			for (var n = 0; n < rows.length; n++) {
		  	addEvent(rows[n], 'mouseover', this.highlightRowGreyOnOver, false);
		  	addEvent(rows[n], 'mouseout', this.bleachGreyRowOnOut, false);
		  }
			return;
		}
		
		var tables = parent.getElementsByTagName("table");
    for (var i = 0; i < tables.length; i++) {
			if (tables[i].className == "rounded_rect_tbl") {
				var rows = tables[i].rows;
				for (var n = 0; n < rows.length; n++) {
					addEvent(rows[n], 'mouseover', this.highlightRowGreyOnOver, false);
					addEvent(rows[n], 'mouseout', this.bleachGreyRowOnOut, false);
					addEvent(rows[n], 'mousedown', this.highlightRowBlue, false);
				}
			}				
			
			// no grey highlighting in RL editor
			if (tables[i].id.indexOf("siteRL_") == 0)
				addEvent(tables[i], 'mousedown', this.highlightRowBlue, false);
		}

		addEvent(parent, 'keyup', this.keyHandler, false);
		addEvent(parent, 'keydown', this.arrowsHandler, false);
	},
	
	setCurrentDialog : function(dlgDiv) {
		if (!isElemOfClass(dlgDiv, ["panel_block", "dsk_auto_complete"]))
			return;
		this.curDlgDiv = dlgDiv;
		if (this.focusHolder == null) {
			this.focusHolder = document.createElement("input");
			this.focusHolder.className = "shrunk_field";
			this.focusHolder.setAttribute("readonly", "true");
			this.focusHolder.style.top = getScrollXY()[1];
			
			if (Browser.ie)  // IE does not support "fixed position. So move focusHolder manually.
				this.focusHolder.style.position = "absolute";
		}
		// autocomplete gets events from FTS field; others required "focusHolder"
		if (dlgDiv.className != "dsk_auto_complete") {
			dlgDiv.appendChild(this.focusHolder);
			this.focusSelector(dlgDiv, true);
		}
		
		if (this.isMenuPopup(dlgDiv))
			this._selectMenuItemWithArrow(dlgDiv);
	},
	
	keyHandler : function(event) {
		var $t = TouchDlgUtil;
		var code = getKeyCode(event);
		var target = getEventTarget(event);
		var tagName = (typeof target.tagName != 'undefined') ? target.tagName.toLowerCase() : "";
		var wasProcessed = false;

		// 1. backspace or left arrow in "tray"
		if (code == 8 || (code == 37 && !$t.isMenuPopupOpened())) {
			if (target.id != "text_entry") {
		  	wasProcessed = ListBoxesHandler.onBackBtn();
  	  	// prevent default browser behavior (backspace) and  other handlers
				if (wasProcessed) 
					stopEventPropagation(event);
			}
		}
		// 2. enter
		else if (code == 13) {
			// 2.1 set manually entered value
			//if (target.id == "text_entry")
			if ($t.isMenuPopupOpened()) {
				if ($t.greyTr) {
					var a = getChildByTagName($t.greyTr, "a");
					window.location.assign(a.href);
				}
			}
			else if (!$t.greyTr)
				ListBoxesHandler.onOptionsBackBtn();
			else if (!ListBoxesHandler.isFormPanelCurrent())	
				ListBoxesHandler.onOptionsItemClickProcess($t.greyTr);
			else if (tagName != 'textarea'){
				$t.submitOnEnter(event);
			}
		}
		// 3. esc
		else if(code == 27) {
			if ($t.isMenuPopupOpened())
				stopEventPropagation(event); // prevent TabMenu	processing of Esc
			TouchDlgUtil.closeAllDialogs();
		}
		// left, right with opened menu "popup"
		else if ((code == 37 || code == 39) && $t.isMenuPopupOpened()) {
			PlainDlg.hide();
			$t.curDlgDiv = null;
			TabMenu.keyHandler(event);
			TabMenu.openActivePopup(event);
		}
	},
	onBodyClick : function(){
		FtsAutocomplete.hide();
	},

	isMenuPopupOpened : function() {
		return (this.curDlgDiv != null && isVisible(this.curDlgDiv) && this.isMenuPopup(this.curDlgDiv));
	},	
	isMenuPopup : function(div) {
		if (div.id != "pane2")
			return false;
		var firstChild = getFirstChild(div);
		if(firstChild && getFirstChild(firstChild).className != "menu")
			return false;
		
		return true;
	},
	isAutocompletePopup : function(div) {
		if (!div || div.id != "auto_complete")
			return false;
		
		return true;
	},

	// arrow navigation
	arrowsHandler : function(event) {
		var $t = TouchDlgUtil;
		var target = getEventTarget(event);
		var code = getKeyCode(event);
		
		if ((code == 39 || code == 37) && target.className != "shrunk_field") // target.getAttribute("readonly") == null
			return;
		
		var isMenu = $t.isMenuPopupOpened();
		var isAutocomplete = $t.isAutocompletePopup($t.curDlgDiv);

		if (isMenu || isAutocomplete) {
			$t._selectMenuItemWithArrow($t.curDlgDiv, code);
			if (code >= 37 && code <= 40)
				stopEventPropagation(event);
			return;
		}

		var listOfItems = ListBoxesHandler.getCurrentListOfItems();
		
		// no arrows processing in edit in-place fields
		//if (target.className && target.className.indexOf("pointer") == -1)
		//	return;
		var panelBlock = getAncestorByClassName(listOfItems, "panel_block");
		if (!panelBlock)
			return;

		// process boolean / toggle button
		var toggleBtnTray = getChildByClassName($t.greyTr, "toggle_btn_tray");
		if (toggleBtnTray && (code == 39 || code == 37)) {
			ToggleBtnMgr.onclick(toggleBtnTray);
			stopEventPropagation(event);
			return;
		}
		
		// embeded dialogs (in dashboard) do not handle Up and Down buttons to allow page scrolling.
		var isEmbeded = getElementStyle(panelBlock).position == "static";
		// arrows inside textarea - no "navigation" 
		var isTextarea = target.tagName.toLowerCase() == "textarea";
		
		// main arrows processing -------------
		if ((code == 40 && !isTextarea) || (code == 9 && !event.shiftKey) && !isEmbeded) { // Down or tab
			$t._selectRowWithArrow(listOfItems, true);
		}
		else if ((code == 38 && !isTextarea) || (code == 9 && event.shiftKey) && !isEmbeded) { //	Up or Shift + Tab
			$t._selectRowWithArrow(listOfItems, false);
		}
		else if(code == 39 && ListBoxesHandler.isFormPanelCurrent()) { // right
			var clickEvent = new Object();
			clickEvent["target"] = $t.greyTr;
			clickEvent["type"] = "";
			$t.highlightRowBlueProcess($t.greyTr);
			ListBoxesHandler.onClickParam(clickEvent)
		}
		else 
			return;
		stopEventPropagation(event);
	},
	
	// up / down	
	_selectRowWithArrow : function(listOfItems, down) {
		var passToTr = null;	
		// no highlighting before; it goes from Selector
		if (listOfItems.className == "calendar_panel")
			return; // calendar panel does not support key navigation for now

		if (!this.greyTr) {
			//if (target.id != "item_selector" && target.id != "text_entry")
			//	return;

			var table = getChildByClassName(listOfItems, "rounded_rect_tbl");
			if (down) {
		  	if (table.className == "rounded_rect_tbl") 
					passToTr = table.rows[0];
		  }
		  else {
		  	table = getLastChild(table.parentNode);
		  	if (table.className == "rounded_rect_tbl") 
		  		passToTr = table.rows[table.rows.length - 1];
		  }
			
		}
		else if (down) { // down arrow
			passToTr = getNextSibling(this.greyTr);
			if (passToTr == null) {
				var table = getAncestorByTagName(this.greyTr, "table");
				var nextTable = getNextSibling(getNextSibling(table));
				if (nextTable && nextTable.className == "rounded_rect_tbl") 
					passToTr = nextTable.rows[0];
			}
		}
		else { // up arrow
			passToTr = getPreviousSibling(this.greyTr);
			if (passToTr == null) {
				var table = getAncestorByTagName(this.greyTr, "table");
				var prevTable = getPreviousSibling(getPreviousSibling(table));
				if (prevTable && prevTable.className == "rounded_rect_tbl") 
					passToTr = prevTable.rows[prevTable.rows.length - 1];
			}
		}
		
		// highlighting & focus
		this.bleachGreyRow();
		if (passToTr) { // go to the next row
		
			// no highlighting of hidden rows and currently disabled items "More..." and "Add..."
			if (getElementStyle(passToTr).display == "none" || passToTr.id == "$more" || passToTr.id == "$addNew") {
				this.greyTr = passToTr;
				this._selectRowWithArrow(listOfItems, down);
				return;
			}
		
			this.highlightRowGrey(passToTr);
			// set focus inside writable input
			var input = getChildByClassName(passToTr, ["input", "textarea", "rte"]);
			if (input && !input.getAttribute("readonly")) 
				FieldsWithEmptyValue.setFocus(input);
			else
				this._setFocusInFocusHolder();	
			if (!isElemInView(passToTr))
				passToTr.scrollIntoView(down == false);
		}
		else { // go into Selector
			var activePanel = ListBoxesHandler.getCurrentPanelDiv();
			var selector = this.focusSelector(activePanel);
			if (selector && !isElemInView(selector)) {
				var header = getAncestorByClassName(selector, "header");
				if (header)
					header.scrollIntoView(true);	
			}
		}
	},
	
	_selectMenuItemWithArrow : function(dlg, code) {
		var passToTr = null;
		
		if (!this.greyTr) {
			passToTr = getChildByClassName(dlg, "param_tr");
		}
		else if (code == 40 || (code == 9 && !event.shiftKey)) { // down
			passToTr = getNextSibling(this.greyTr);
			if (passToTr == null || !getTextContent(passToTr)) {
				var column = getAncestorByTagName(this.greyTr, "td");
				passToTr = getChildByClassName(getNextSibling(column), "param_tr");
			}
		}
		else if (code == 38 || (code == 9 && event.shiftKey)) { // up
			passToTr = getPreviousSibling(this.greyTr);
			if (passToTr == null || !getTextContent(passToTr)) {
				var column = getAncestorByTagName(this.greyTr, "td");
				if (column != null) {
					var prevColumn = (column && column.cellIndex > 0) ? getPreviousSibling(column) : getLastChild(column.parentNode);
					var prevTable = getChildByTagName(prevColumn, "table");
					passToTr = prevTable.rows[prevTable.rows.length - 1];
				}
				else { // autocomplete
					var table = this.greyTr.parentNode;
					passToTr = table.rows[table.rows.length - 1];
				}
			}
		}
		else
			return;
		
		this.bleachGreyRow();
		
		if (passToTr) {
			if (!getTextContent(passToTr)) { // empty item
				this.greyTr = passToTr;
				return this._selectMenuItemWithArrow(dlg, code);
			}
			this.highlightRowGrey(passToTr);
		}
		else if (this.greyTr) // try to find suited TR again only if dialog supports highlighting
			this._selectMenuItemWithArrow(dlg, code);			
	},
	
	// selector focused on opening dialog or panel
	focusSelector : function(parent, delayed) {
		var selector = getChildById(parent, ["item_selector", "parameter_selector", "text_entry"]);
		if (!selector || !isVisible(selector)) {
			selector = this.focusHolder;
			this.focusHolder.focus();
		}
		else {
			if (!selector.onfocus) 
				selector.onfocus = this._onFocusSelector;
			FieldsWithEmptyValue.setFocus(selector, delayed, true);
		}
		
		this.greyTr = null;
		return selector;
	},
	
	_onFocusSelector : function() {
		var $t = TouchDlgUtil;
		$t.bleachGreyRow();
	},
	
	// Note: only one opened dialog can be on a page in current version
	// handled 3 "classes" of dialogs
	submitOnEnter : function(event) {
		var $t = TouchDlgUtil;
		var target = null;

		// prevent submit before sliding back (option selection) finished
		if ($t.hasBlueRow()) 
			return;
		
		if (event.type == 'click')
			target = getEventTarget(event);
		
		var isDone = DataEntry.submit(event, target);
		if(!isDone)
			isDone = Filter.submitProcess(event);
		if(!isDone)
			SubscribeAndWatch.submit(event);
	
		$t.closeAllDialogs();
	},
	
	// closes 1) data entry 2) filter 3) plain dialog
	closeAllDialogs : function(isFtsAutocomplete) {
		ListBoxesHandler.onBackBtn();

		DataEntry.hide();
		if (!(isFtsAutocomplete && Browser.mobile))
			Filter.hide();
		PlainDlg.hide();
		SubscribeAndWatch.hide();
		FtsAutocomplete.hide();
		if (!Browser.mobile)	 
			Tooltip.hide(true);
		
		if (this.greyTr) {
			this.bleachGreyRow();
			this.greyTr = null;
		}

		this.bleachBlueRow()
		this.curDlgDiv = null;
		this.blueTr = null;
	},
	
	highlightRowGreyOnOver : function(event) {
    var $t = TouchDlgUtil;
		var target = getEventTarget(event);
		var tr = null;
		if (ListBoxesHandler.isFormPanelCurrent())
    	tr = getAncestorByClassName(target, $t.TR_CLASS);
		else
			tr = getAncestorByTagName(target, "tr");	
		
		if (!tr || !getTextContent(tr))
			return;
			
		if($t.greyTr)
			$t.bleachGreyRow();	
    if (tr)
			$t.highlightRowGrey(tr);
	},
	
	highlightRowGrey : function(tr) {
		this.greyTr = tr;
		if (tr.getAttribute("blue") != null)
			return;
		
		if (tr.className.indexOf("grey_highlighting") != -1)
			return;

		tr.className = (tr.className + " grey_highlighting");
	},
	
	highlightRowBlue : function(event) {
		var $t = TouchDlgUtil;
    var target = getEventTarget(event);
    var tr = getAncestorByClassName(target, $t.TR_CLASS);
		if (!tr)
			return;
		if (isElemOfClass(target, "iphone_checkbox"))
			return; // skip click on iPhone-like checkbox (roll-up)

    $t.highlightRowBlueProcess(tr);
	},
		
	highlightRowBlueProcess : function(tr) {
		var $t = TouchDlgUtil;

		// in-place editors
		if (getChildByClassName(tr, "arrow_td") == null) {
			return;
		}
		
		// previous click on parameter is processed
		if (ListBoxesHandler.isBusy())
			return;
		
		var skipBleachBlue = false;
		if ($t.hasBlueRow() && ListBoxesHandler.isEditList() &&
				 comparePosition($t.blueTr, tr) != 0)
			skipBleachBlue = true;

 		// possible if next selection was made too fast (in RL editor as well)
		$t.bleachBlueRow();
		$t.skipBleachBlue = skipBleachBlue;

		TouchDlgUtil.blueTr = tr;
		
		$t.bleachGreyRow();
		appendClassName(tr, "blue_highlighting");
		tr.setAttribute("blue", "y");
  }, 
	  
	bleachGreyRowOnOut : function(event) {
		var $t = TouchDlgUtil;
	  var target = getEventTarget(event);
    
		if (target.className != $t.TR_CLASS[0] && target.className != $t.TR_CLASS[1])
			return;
		
		var tr = target;
 		
		$t.bleachGreyRow();
	},
	
	bleachGreyRow : function() {
		var tr = this.greyTr;
		if (!tr)
			return;
		if (tr.getAttribute("blue") != null)
			return;
		
		if (tr.className.indexOf("grey_highlighting") == -1)
			return;

		tr.className = tr.className.replace("grey_highlighting", "").trim();
		this.greyTr = null;
	},
	
	// "callback" - called after option selection / scroll back
  bleachBlueRow : function() {
    if (this.blueTr == null)
      return;
		
		if (this.skipBleachBlue) {
			this.skipBleachBlue = false;
			return;
		}

		this.blueTr.className = this.blueTr.className.replace(/blue_highlighting|grey_highlighting/g, "").trim();

		this.bleachGreyRow(); // possible other row was highlighted with mouse
		this.blueTr.removeAttribute("blue");
		this.highlightRowGrey(this.blueTr); // make blue row "grey"
		this.blueTr = null;
		
		this._setFocusInFocusHolder();	
  },
	
	_setFocusInFocusHolder : function() {
	  // IE does not support "fixed position. So move focusHolder manually.
		if (Browser.ie)
			this.focusHolder.style.top = getScrollXY()[1];
		this.focusHolder.focus();		
	},
	
	getGreyTr : function() {
		return this.greyTr; 
	},
	
	hasBlueRow : function() {
		return this.blueTr != null;
	},
	
	isFieldBlueHighlight : function(field) {
		if (this.blueTr == null)
			return false;
		return this.blueTr.contains(field);
	}
}

// TabMenu
var TabMenu = {
	homeTab : null,
	firstTab : null,
	lastTab : null,
	activeTab : null,
	
	isEmptyPopupOpened : false, // in case when item does not have popup 
	init : function() {
		// use keydown instead of keyup to prevent horizontal scrolling
		addEvent(window, 'keydown', this.keyHandler, false);
		window.focus();
	},
	
	_findTabs : function() {
		var mainMenu = document.getElementById("mainMenu");
		var homeTab = getChildByClassName(mainMenu, "dashboard_btn");
		// there are possible 2 "mainMenu" (floordata)
		if (!homeTab) {
			mainMenu = getNextSibling(mainMenu);
			homeTab = getChildByClassName(mainMenu, "dashboard_btn");
			if (!homeTab) return;
		}
		this.homeTab = homeTab;
		this.firstTab = getChildByClassName(getNextSibling(this.homeTab), "dashboard_btn");
		if (this.firstTab)
			this.lastTab = getLastChild(this.firstTab.parentNode);
	},
	
	keyHandler: function(event){
  	var $t = TabMenu;
		var code = getKeyCode(event);
		
		if (TouchDlgUtil.isMenuPopupOpened() && !$t.isEmptyPopupOpened)
			return; // no Tab navigation while popup on screen

		if (code == 18) { // Alt
			if ($t.firstTab == null) 
				$t._findTabs();
			if ($t.firstTab == null) 
				return;	
			if ($t.activeTab == null) {
				$t.activeTab = $t.firstTab;
				appendClassName($t.activeTab, "active");
			}
			else {
				removeClassName($t.activeTab, "active");
				$t.activeTab = null;
			}
			stopEventPropagation(event);
			return;
		}
		else if (code == 27 && $t.activeTab != null) { // esc
			removeClassName($t.activeTab, "active");
			$t.activeTab = null;
		}
		else 
			if ($t.activeTab == null) 
				return;
		
		if (code == 13 || code == 40) // enter, down
			$t.openActivePopup(event);
		else if (code == 39) { // right
			var nextTab; 
			if ($t.isHomeTabActive())
				nextTab = $t.firstTab;
			else
				nextTab = getNextSibling($t.activeTab) || $t.homeTab;
			$t.setActiveTab(nextTab);
		}
		else if (code == 37) { // left
			var prevTab;
			if ($t.isHomeTabActive())
				prevTab = $t.lastTab;
			else
				prevTab = getPreviousSibling($t.activeTab) || $t.homeTab;
			$t.setActiveTab(prevTab);
		}
		else 
			return;

		stopEventPropagation(event);
		
		// open popup after that "previous" item without popup was active
		if ($t.isEmptyPopupOpened) {
			$t.openActivePopup(event);
			$t.isEmptyPopupOpened = false;
		}
		
	},
	openActivePopup : function(event) {
		var anchor = getChildByTagName(this.activeTab, "a");
		if (this.isHomeTabActive()) 
  		anchor.onclick(event);
		else
	  	this.isEmptyPopupOpened = LinkProcessor.onClickDisplayInner(event, anchor) == false;
	},
	
	setActiveTab : function(newActiveTab) {
		if (!newActiveTab)
			return;
		if (this.activeTab)
			removeClassName(this.activeTab, "active");
		this.activeTab = newActiveTab;
		appendClassName(this.activeTab, "active");
	},
	
	isHomeTabActive : function() {
		if (this.firstTab == null) 
			this._findTabs();
		return (comparePosition(this.homeTab, this.activeTab) == 0);
	}
	
}

/**************************************************
* LinkProcessor
* handles anchors with help of onmousedown on BODY.
//**************************************************/
var LinkProcessor = {
	onLinkClick : function(e) {

		var $t = LinkProcessor;
	  e = getDocumentEvent(e);
	  if (!e)
	    return;

	  var anchor = getTargetAnchor(e);
		
	  if (!anchor)
	    return;
	
	  var id = anchor.id;
	  // with purpose to speed up GUI we handle onmousedown
	  if (e.type == "click") {
	    // close popup menu on its item click
	    var popupDiv = getAncestorByAttribute(anchor, "className", "popMenu");
	    if (popupDiv)
	      Popup.close0(popupDiv.id)
	
	    // 1. stop click event on anchors with href == "about:blank"
	    // because we handled it with onmousedown
	    if (anchor.href == "about:blank" || id == "-inner")
	      return stopEventPropagation(e);
	    // 2. pressed with shift or ctrl key
	    else if(e.shiftKey || e.ctrlKey) 
	      return stopEventPropagation(e);
	    // 3. default browser behaviour
	    else {
	      var className = anchor.className;
	      if (className  &&  className == "external")  
	        $t.onClickGoLinkOut(e, anchor);
	      else
	        return;
	    }
	  }
		
		// process only left mouse button (1)
		var btn = e.which || e.button;
		if (typeof btn != 'undefined' && btn != 1)
			return;
	
	  $t.linkHrefModifier(e, anchor);
	
	  if (!id)
	    return;
	
	  var idLen = id.length;

	  // 1.
	  if (id.startsWith("-inner")) {
	    $t.onClickDisplayInner(e, anchor);
	  }
	  // 2.
	  else if (id.startsWith('menuLink_')) {
	    menuOnClick(e, anchor);
	  }
	  // 3. 
	  /// commenten out because whole TD is event target
//	  else if (id.indexOf("_filter", idLen - "_filter".length) != -1) {
//	    ListBoxesHandler.listboxOnClick1(e, id);
//	  }
	 
	  // 4. Boolean toggle (in UI it looks like a dot)
	  else if (id.indexOf("_boolean", idLen - "_boolean".length) != -1  ||
	        id.indexOf("_boolean_refresh", idLen - "_boolean_refresh".length) != -1) {
			changeBoolean(e, anchor);
	  }
	},
	onClickGoLinkOut : function(e, anchor) {
    if (!anchor)
      anchor = getTargetAnchor(e);
    if (!anchor)
      return;
    var a = decodeURIComponent(anchor.href);
    if (a.indexOf('/LinkOut?targetUrl=') != -1 || a.indexOf('/LinkOutShared?targetUrl=') != -1)
      return;
    e = getDocumentEvent(e); if (!e) return false;
    var div;
    
    
    var table = getAncestorByTagName(anchor, "table");
    /*
    table = getAncestorByTagName(table.parentNode, "table");
    table = getAncestorByTagName(table.parentNode, "table");
    table = getAncestorByTagName(table.parentNode, "table");
    table = getAncestorByTagName(table.parentNode, "table");
    table = getAncestorByTagName(table.parentNode, "table");
    table = getAncestorByTagName(table.parentNode, "table");
    table = getAncestorByTagName(table.parentNode, "table");
    table = getAncestorByTagName(table.parentNode, "table");
    */

    var grid;
    while (table) {
      if (table.id && table.id.indexOf("siteRL_") == 0) {
        if (table.className  &&  table.className == "grid")
          grid = true;
        break;
      }
      table = getAncestorByTagName(table.parentNode, "table");
    }
    var tag;
    var tag = grid ? getTdNode(anchor) : getTrNode(anchor);
    var i = 0;
    while (tag) {
      var id = tag.id;
      if  (!id  ||  id.indexOf("uri") == -1 || !isDigit(id.charAt(3))) {  
        var parent = grid ? tag.parentNode.parentNode : tag.parentNode;
        tag = grid ? getTdNode(parent) : getTrNode(parent);
      }
      else   
        break;
    }
    if (!tag)
      return;

    
    // this clause only for list RL
    if (!grid) {
      var id = tag.id;
      var idx = id.indexOf("_displayInFull");
      if (idx != -1) {
        var parentTable = getAncestorByTagName(tag, "table");
        id = id.substring(0, idx);
        var children = parentTable.getElementsByTagName("tr");
        for (var i = 0; i < children.length; i++) {
          if (children[i].id  &&  children[i].id == id) {
            tag = children[i];
            break;
          }
        }
      }
    }

    var divs = tag.getElementsByTagName("div");
    var cnt = divs.length;
    for (var i=0; i<cnt  &&  !div; i++) {
      var clName = divs[i].className;
      if (clName  &&  clName == "uri")
        div = divs[i];
    }
    if (!div) 
      return;

    var linkOutDiv;
    var parentDiv = getAncestorByTagName(tag, "div");
    while (parentDiv  &&  !linkOutDiv) {
      if (parentDiv  &&  (parentDiv.id == 'front' || parentDiv.className == 'front')) {
        var children = parentDiv.getElementsByTagName('div');
        for (var i = 0; i < children.length  &&  !linkOutDiv; i++) {
          var d = children[i];
          if (d.className  &&  d.className == 'linkOut') 
            linkOutDiv = d;
        }
        break;
      }
      parentDiv = getAncestorByTagName(parentDiv, "div");
    }
    if (!linkOutDiv) 
      return;
    var rUri = div.textContent;
    var idx = rUri.indexOf("?");
    var href = anchor.href;
    var len = href.length;
//console.log("href = " + href);
//console.log("rUri = " + rUri);
    if (href.indexOf("http://") == 0  &&  href.charAt(len - 1) == '/'  &&  href.indexOf('/', 7) == len - 1) 
      href = href.substring(0, len - 1);
//    var uri = 'v.html?uri=sql/www.hudsonfog.com/voc/model/portal/LinkOut%3FtargetUrl%3D' + encodeURIComponent(href) + '%26' + encodeURIComponent(rUri.substring(idx + 1));
    
    href = encodeURI(href);
    href = href.replace(/=/g, '%3D');
    href = href.replace(/&/g, '%26');
    href = href.replace(/\?/g, '%3F');
    var linkOutType = linkOutDiv.textContent;
    var uri = 'sql' + linkOutType.substring(6) + '?targetUrl=' + href + '&' + rUri.substring(idx + 1);   
    
    anchor.href = 'v.html?uri=' + encodeURIComponent(uri);
    anchor.target = "_blank";
	},
	// calls 1) DataEntry 2) PlainDlg
	onClickDisplayInner : function(e, anchor) {
	  if (!anchor)
	    anchor = getTargetAnchor(e);
	  if (!anchor || !anchor.id)
	    return false;
	  e = getDocumentEvent(e); if (!e) return false;
	  var propName = anchor.id.substring(7);
		var urlStr;
	  if (propName.indexOf("list.") == 0) {
	    var ul = document.getElementById(propName);
	
	    if (!ul) {
	      var strippedProp = propName.substring(5);
	      //r = PlainDlg.show(e, innerListUrls[strippedProp]);
				urlStr = innerListUrls[strippedProp];
	    }
	    else {
	      var li = ul.getElementsByTagName("li");
	      //r = PlainDlg.show(e, decodeURL(li[0].innerHTML));
				urlStr = decodeURL(li[0].innerHTML);
	    }
	  }
	  else {
	    var a = anchor.href;
	
	    if (a != 'about:blank')
	      //r = PlainDlg.show(e, a);
				urlStr = a;
	    else {
	      var ul = document.getElementById(propName);
	      if (!ul)
	        //r = PlainDlg.show(e, innerUrls[propName]);
					urlStr = innerUrls[propName];
	      else {
	        var li = ul.getElementsByTagName("li");
	        //r = PlainDlg.show(e, decodeURL(li[0].innerHTML));
					urlStr = decodeURL(li[0].innerHTML);
	      }
	    }
	  }
		
		if (urlStr.indexOf("mkResource.html") != -1 ||
	  			urlStr.indexOf("editProperties.html") != -1)
	  	DataEntry.show(e, urlStr, anchor);
//		else if (urlStr.endsWith("subscribe.html"))
//			SubscribeAndWatch.show(event, div, hotspot, content, url);
		else
			PlainDlg.show(e, urlStr, anchor);
	  
		return true;
	},
	
	/**
	 * Registered to receive control on a click on any link. Adds control key
	 * modifier as param to url, e.g. _ctrlKey=y
	 */
	linkHrefModifier : function(e, link) {
	  detectClick = true;
	  var p;
	
	  // add current dashboard ID and current tab ID to url if they are not there
	  var a = link.href;
	  addCurrentDashboardAndCurrentTab(link);
	  if     (e.ctrlKey) {
	    p = '_ctrlKey=y';
	  }
	  else if(e.shiftKey) {
	    p = '_shiftKey=y';
	  }
	/*
	 * else if(e.altKey) { p = '_altKey=y'; var frameId = 'bottomFrame'; var
	 * bottomFrame = frames[frameId]; // show content in a second pane // if
	 * (bottomFrame) { removeModifier(link, '_shiftKey=y'); removeModifier(link,
	 * '_ctrlKey=y'); removeModifier(link, '_altKey=y'); return displayInner(e,
	 * link.href); } }
	 */
	  if (p) {
	    removeModifier(link, '_shiftKey=y');
	    removeModifier(link, '_ctrlKey=y');
	    removeModifier(link, '_altKey=y');
	    addUrlParam(link, p, null);
	
	    var rc = stopEventPropagation(e);
	    document.location.href = link.href;
	    return rc;
	  }
	  else if (link.id  &&  link.id.startsWith('-inner')) {
	    return;
	  }
	
	  var idx = link.href.indexOf("&-ulId=");
	
	  if (idx == -1)
	    return true;
	  var idx1 = link.href.indexOf("&", idx + 1);
	  var ulId;
	  if (idx1 == -1)
	    ulId = link.href.substring(idx + 7);
	  else
	    ulId = link.href.substring(idx + 7, idx1);
	  var ul = document.getElementById(ulId);
	  if (ul) {
	    var li = ul.getElementsByTagName("li");
	    if (li) {
	      var qs = li[0].innerHTML;
	      if (qs.length > 0  &&  link.href.indexOf('&-paging=') == -1)
	        link.href += "&-paging=" + encodeURIComponent(decodeURL(qs));
	    }
	  }
	  return true;
	}
}
	

/**
 * remove modifier, like ctrl_y
 */
function removeModifier(url, param) {
  var urlStr = url.href;
  var idx = urlStr.indexOf(param);
  if (idx == -1)
    return url;

  var len = param.length;
  if (urlStr.charAt(idx - 1) == '&') {
    idx--;
    len++;
  }

  var uBefore = urlStr.substring(0, idx);
  var uAfter  = urlStr.substring(idx + len);
  urlStr = uBefore + uAfter;
  url.href = urlStr;
  // alert('before='+uBefore + ', after=' + uAfter);
}

function addUrlParam(url, param, target) {
  if (!url)
    return;
  if (!url.href)
    return;
  if (url.href.indexOf('?') == -1) {
    url.href = url.href + '?' + param;
    if (target)
      url.target = target;
  }
  else {
    url.href = url.href + '&' + param;
    if (target)
      url.target = target;
  }
}

function getANode(elem) {
  var e;

  if (elem.tagName && elem.tagName.toUpperCase() == 'A') {
    if (elem.href)
      return elem;
    else
      return null;
  }

  e = elem.parentNode;
  if (e)
    return getANode(e);
  else
    return null;
}


/**
 * function that adds a title (taken from page HEAD) of current page to a url
 * that is passed as a parameter
 */
function addPageTitleToUrl(e) {
  var target = getTargetElement(e);
  if (!target)
    return;
  var tr = getTrNode(target);
  if (!tr)
    return;

  tr.setAttribute('eventProcessed', 'true');
  var aa = tr.getElementsByTagName("a");
  if (!aa)
    return;
  a = aa[0];

  var idx = a.href.indexOf('?');
  var delim = idx != -1 ? '&' : '?';

  var title = document.title;
  if (title)
    title = encodeURIComponent(title);
  var ret = PlainDlg.show(e, a.href + delim + 'title=' + title);
  return ret;
}

var xmlEntities = [];
xmlEntities['quot'] = '"';
xmlEntities['amp'] = '&';
xmlEntities['lt'] = '<';
xmlEntities['gt'] = '>';
xmlEntities['apos'] = "'";
xmlEntities['34'] = '"';
xmlEntities['38'] = '&';
xmlEntities['60'] = '<';
xmlEntities['62'] = '>';
xmlEntities['39'] = "'";

function decodeURL(str) {
  var buf = '';
  for (var i = 0; i < str.length; ++i) {
    var ch = str.charAt(i);
    if (ch != '&') {
      buf += ch;
      continue;
    }
    var semi = str.indexOf(';', i + 1);
    if (semi == -1) {
      buf += ch;
      continue;
    }
    var entityName = str.substring(i + 1, semi);
    var entityValue;
    if (entityName.charAt(0) == '#')
      entityValue = entityName.substring(1);
    else {
      var e = xmlEntities[entityName];
      if (e == null)
        entityValue = -1;
      else
        entityValue = e;
    }
    if (entityValue == -1) {
      buf += '&' + entityName + ';';
    } else {
      buf += entityValue;
    }
    i = semi;
  }
  return buf;
}



/**
 * Used in FrequencyPropertyEditor (e.g. for Scheduled Report)
 */
function showRecurrencePanel(formName, propertyName) {
  var form     = document.forms[formName];
  var elements = form.elements[propertyName + '_recur'];

  if (elements[0].checked == true) {
    document.getElementById('frequencyStartEndBlock').style.display = 'none';
  }
  else {
    document.getElementById('frequencyStartEndBlock').style.display = 'inline';
  }
  for (var i=0; i<5; i++) {
    if (elements[i].checked == true) {
      for (var j=0; j<5; j++) {
        if (j != i) {
          document.getElementById(elements[j].value + 'Block').style.display = 'none';
        }
      }
      document.getElementById(elements[i].value + 'Block').style.display = 'inline';
      return;
    }
  }
}

/**
 *
 */
/*
function initCalendarsFromTo(div, formName, fromDateField, toDateField) {
  var contents =  "<script>" +
                  "var _init_from = { " +
                  "      'formname' : '" + formName + "', " +
                  "      'dataformat' : 'M-d-Y', " +
                  "      'replace' : true, " +
                  "      'selected', new Date(), " +
                  "      'watch', true, " +
                  // " 'controlname' : '" + fromDateField + "' "
                  "};" +

                  "var _init_to = { " +
                  "      'formname' : '" + formName + "', " +
                  "      'dataformat' : 'M-d-Y', " +
                  "      'replace' : true, " +
                  "      'selected', new Date(), " +
                  "      'watch', true, " +
                  // " 'controlname' : '" + toDateField + "' "
                  "};" +

                  "var from    = new calendar(_init_from, CAL_TPL1, " + "fromDateField);" +
                  "var to      = new calendar(_init_to,   CAL_TPL1, " + "toDateField);" +
                  "</script>";
  div.setInnerHtml(contents);
}
*/
function resetViewCols(e, tr) {
  e = getDocumentEvent(e); 
  if (!e) 
    return;
//  var target = getTargetElement(e);
//  var tr = getTrNode(target);

  var arr;
  var form = getFormNode(tr);
  var currentFormName = form.name;

  // form url based on parameters that were set
  var elm = form.elements['-$action'];

  var formAction = (elm) ? elm.value : null;
  var allFields = true;
  if (formAction == "showproperties")
    allFields = false;
  var params;
  var arr = new Array(3);
  if (currentFormName.indexOf("viewColsList") == 0) {
    arr["-viewCols"] = "-viewCols";
    arr[".-viewCols"] = ".-viewCols";
    arr["-curViewCols"] = "-curViewCols";
  }
  else if (currentFormName.indexOf("gridColsList") == 0) {
    arr["-gridCols"] = "-gridCols";
    arr[".-gridCols"] = ".-gridCols";
    arr["-curGridCols"] = "-curGridCols";
  }
  else {
    arr["-filterCols"] = "-filterCols";
    arr[".-filterCols"] = ".-filterCols";
    arr["-curFilterCols"] = "-curFilterCols";
  }
  params = FormProcessor.getFormFilters(form, allFields, arr, false);
  var baseUriO = document.getElementsByTagName('base');
  var baseUri = "";
  if (baseUriO) {
    baseUri = baseUriO[0].href;
    if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
      baseUri += "/";
  }
  var url = baseUri + "l.html?" + params;
  document.location.replace(url);
  return stopEventPropagation(e);
}

function checkAll(formName) {
  var form = document.forms[formName];
  var fields = form.elements;
  var checkAll = form.elements["-checkAll"];
  var isChecked = checkAll.checked == true;
  for (var i=0; i<fields.length; i++) {
    var type  = fields[i].type;
    if (type  &&  type.toUpperCase() == "CHECKBOX") {
      var uiCheckbox = getChildByClassName(fields[i].parentNode, "iphone_checkbox");
 			// note: in the future all checkboxes should be substituted with UI's ones
			if (uiCheckbox)
				CheckButtonMgr.setState(uiCheckbox, fields[i], isChecked);
			else 
        fields[i].checked = isChecked;
    }
  }
}

function checkAllInGroup(e, divId) {
  var div = document.getElementById(divId);
  var fields = div.getElementsByTagName('input');

  var groupField = getTargetElement(e);
  var isChecked  = groupField.checked;
  for (var i=1; i<fields.length; i++) {
    var type  = fields[i].type;
    if (type  &&  type.toUpperCase() == "CHECKBOX") {
      if (isChecked)
        fields[i].checked = true;
      else
        fields[i].checked = false;
    }
  }
}

// *********************************** Icon/Image effects
// **************************************
var lowOpacity  = 60;
var highOpacity = 100;
var browserDetect;
var timeouts = new Array();

function unfadeOnMouseOut(e) {
  var target = getMouseOutTarget(e);
  if (!target) {
    target = getTargetElement(e);
    // alert("unfade canceled for: " + target + ", id: " + target.id + ",
    // target.tagName: " + target.tagName);
    return false;
  }

  return unfade(target);
}

function unfadeOnMouseOver(e) {
  var target = getMouseOverTarget(e);
  if (!target) {
    target = getTargetElement(e);
    // alert("unfade canceled for: " + target + ", id: " + target.id + ",
    // target.tagName: " + target.tagName);
    //alert("unfade canceled: e.target: " + e.target + ", e.srcElement: " + e.srcElement + ", e.currentElement: " + e.currentElement);
    return false;
  }

  return unfade(target);
}

function fadeOnMouseOver(e) {
  var target = getMouseOverTarget(e);
  if (!target)
    return true;

  return fade(target);
}

function fadeOnMouseOut(e) {
  var target = getMouseOutTarget(e);
  if (!target)
    return false;

  return fade(target);
}

function unfade(target) {
  if (!target)
    return false;

  if (!target.id || target.id == '')
    return false;
  // alert("highlighting: " + target.id);
  browserDetect = target.filters? "ie" : typeof target.style.MozOpacity=="string"? "mozilla" : "";

  var timeout = timeouts[target.id];
  if (timeout) {
    clearTimeout(timeout);
    timeouts[target.id] = null;
  }
  timeout = setTimeout("incrementallyChangeOpacity('" + target.id + "', false)", 50);
  timeouts[target.id] = timeout;
}


function fade(target) {
  if (!target)
    return false;

  if (!target.id || target.id == '')
    return false;

  browserDetect = target.filters? "ie" : typeof target.style.MozOpacity=="string"? "mozilla" : "";
  var timeout = timeouts[target.id];
  if (timeout) {
    clearTimeout(timeout);
    timeouts[target.id] = null;
  }
  timeout = setTimeout("incrementallyChangeOpacity('" + target.id + "', true)", 50);
  timeouts[target.id] = timeout;
}

function incrementallyChangeOpacity(targetId, fade) {
  var target = document.getElementById(targetId);
  if (target == null)
    return;
  var targetOpacity = fade ? lowOpacity : highOpacity;
  var opacityChangeStep = 10.0;

  if (browserDetect == "mozilla") {
    targetOpacity  = fade ? lowOpacity / 100.0 : (highOpacity - 1) / 100.0;
    opacityChangeStep /= 100.0;
    if (target.style.MozOpacity == null || isNaN(parseFloat(target.style.MozOpacity))) {
      target.style.MozOpacity = fade ? (highOpacity - 1) / 100.0 : lowOpacity / 100.0;
    }

    if (fade) {
      if (target.style.MozOpacity > targetOpacity) {
        target.style.MozOpacity = parseFloat(target.style.MozOpacity) - opacityChangeStep;
        setTimeout("incrementallyChangeOpacity('" + target.id + "', true)", 50);
      }
    }
    else {
      if (target.style.MozOpacity < targetOpacity) {
        target.style.MozOpacity = parseFloat(target.style.MozOpacity) + opacityChangeStep;
        setTimeout("incrementallyChangeOpacity('" + target.id + "', false)", 50);
      }
    }
  }
  else if (browserDetect == "ie") {
    if (target.filters == null || target.filters.alpha == null)
      return;
    if (target.filters.alpha.opacity == null) {
      target.filters.alpha.opacity = fade ? highOpacity : lowOpacity;
    }
    if (fade) {
      if (target.filters.alpha.opacity > targetOpacity ) {
        target.filters.alpha.opacity -= opacityChangeStep;
        setTimeout("incrementallyChangeOpacity('" + target.id + "', true)", 50);
      }
    }
    else {
      if (target.filters.alpha.opacity < targetOpacity) {
        target.filters.alpha.opacity += opacityChangeStep;
        setTimeout("incrementallyChangeOpacity('" + target.id + "', false)", 50);
      }
    }
  }
}

function createUrlForBacklink(formName, prop) {
  var form = document.forms[formName];
  var url = "smartPopup?";

  var formAction = form.elements['-$action'].value;
  if (!formAction)
    url += "-$action=" + formAction;
  var url = "smartPopup?urlForBacklink=y&prop=" + prop;
  var param = FormProcessor.getFormFilters(form, true);
  url += param + "&type=" + form.elements['type'].value;
  document.location.href = url; // load data from server into iframe
}

function changeCurrentStyle(target, idName) {
  var curActiveImg = document.getElementById(idName);
  curActiveImg.id='';
  target.id = idName;

  var td = getTdNode(curActiveImg);
  td.className = 'box';
  var td1 = getTdNode(target);
  td1.className = 'redbox';
  var a = document.getElementById('a_currentImage');
  td1 = getTdNode(td1);
  var thisA = td1.getElementsByTagName('a');
  if (thisA  &&  thisA.length)
    a.href = thisA[0].href;
}

function getTdNode(elem) {
  var e;
  var elem_ = elem;
  if (elem.length > 1)
    elem_ = elem[0];
  if (typeof elem_.tagName == 'undefined')
    return null;
  if (elem_.tagName.toUpperCase() == 'TD')
    return elem;
  e = elem_.parentNode;
  if (e)
    return getTdNode(e);
  else
    return null;
}

var hotspot1;

function largeImageOnLoad(e) {
  Popup.open(e, 'gallery', hotspot1, null, 0, 19);
  return true;
}

function showLargeImage(e, current, largeImageUrl) {
  var div = document.getElementById('gallery');
  var img = document.getElementById('galleryImage');
  if(!div || !img)
    return;

  makeDivAutosize(div);

  if (!largeImageUrl) {
    e = getDocumentEvent(e); if (!e) return;
    var target = getTargetElement(e);

    var thumbnailUrl = target.src;
    var idx = thumbnailUrl.lastIndexOf('.');
    var file = thumbnailUrl.substring(0, idx);
    var ext  = thumbnailUrl.substring(idx);
    var idx1 = file.lastIndexOf('_');
    var file1 = file.substring(0, idx);
    largeImageUrl = file1 + '_image' + ext;

	  hotspot1 = target;
	  hotspot1.forcedPosition = Popup.POS_LEFT_TOP;
	  addEvent(img, 'load',  largeImageOnLoad,  false);
	  img.src = "";
	  img.src = largeImageUrl;
	  return true;
  }

  img.src = "";

  if (div.style.display == "block") {
    div.style.display = "none";
    // img.src always has host in it; largeImageUrl not always that is why using
    // indexOf
    if (img.src.indexOf(largeImageUrl) == img.src.length - largeImageUrl.length) {
      img.src = "";
      return false;
    }
  }
  // se the title text
  var titleObj = getChildById(gallery, "titleBar");
  if(titleObj != null) {
	  var idx1 = largeImageUrl.lastIndexOf("/");
	  var idx2 = largeImageUrl.indexOf("_image", idx1); // always suffix "_image"
	  var fileName = largeImageUrl.substring(idx1 + 1, idx2);
	  titleObj.innerHTML = fileName;
	  titleObj.noWrap = true;
  }

  hotspot1 = current;
  hotspot1.forcedPosition = Popup.POS_LEFT_TOP;
  addEvent(img, 'load',  largeImageOnLoad,  false);
  img.src = largeImageUrl;
  return true;
}

// makes div / container to fit to content size.
function makeDivAutosize(div, fitHeightOnly) {
  var stl = div.style;
  if(typeof fitHeightOnly == 'undefine')
    fitHeightOnly = false;
  if(Browser.ie) { // IE
    stl.height = "1px";
    if(!fitHeightOnly)
      stl.width = "1px";
  }
  else if(stl.width != "auto") {
    stl.height = "auto";
    if(!fitHeightOnly)
      stl.width = "auto";
  }
}

function hide(target) {
  if (typeof target == 'string')
    target = document.getElementById(target);
  target.style.display = "none";
  return false;
}

function addAndShow(td, e) {
  e = getDocumentEvent(e);
  if (!e)
    return stopEventPropagation(e);

  var a = td.getElementsByTagName("a");

// iframe.style.display = "none";

  var anchor = a[0].href;
  return addAndShow1(anchor, e);
}

var calendarCell; // last cell on which user clicked
var lastPopupRowTD = null;


function showAlert(alertName) {
  var blockReleaseDiv = document.getElementById('blockReleaseParameters');
  if (!blockReleaseDiv)
    throw new Error("showExpired: blockReleaseParameters div not found for: " + anchor);
  var brParams = blockReleaseDiv.getElementsByTagName('a');
  if (!brParams || brParams.length == 0)
    throw new Error("showExpired: blockReleaseParameters are empty for: " + anchor);
  for (var i=0; i<brParams.length; i++) {
    var alertId = brParams[i].id;
    if (alertId.indexOf(alertName + "=") == 0) {
      alert(alertId.substring(alertName.length + 1))
      break;
    }
  }
}


function addAndShow1(anchor, event) {
  var hotspot = getTargetElement(event);
  var iframeId = "resourceList";
  var iframe = document.getElementById(iframeId);
  try {
    var iframeWindow = frames[iframeId];
    var newUri = anchor;
    var q = anchor.indexOf('?');
    var params;
    if (q != -1) {
      params = anchor.substring(q + 1) + "&";
      newUri = anchor.substring(0, q);
    }
    else
      params = "";
    params += "hideComments=y&hideMenuBar=y&hideNewComment=y&hideHideBlock=y";  // skip all navigation blocks

    var aa = document.getElementById("currentItem");
    if (aa) {
      var currentItem = aa.href;
      if (currentItem.indexOf("about") == -1) {
        var idx = anchor.indexOf("-propToSet=");
        var idx1 = anchor.indexOf("&", idx);
        if (idx != -1) {
          var shortProp;
          if (idx1 == -1)
            shortProp = "." + anchor.substring(idx + 11);
          else
            shortProp = "." + anchor.substring(idx + 11, idx1);
          var encCurrentItem = encodeURIComponent(currentItem);
         
          params += "&" + shortProp + "_select=" + encCurrentItem + "&" + shortProp + "_verified=y";
          params += "&-currentItem=" + encCurrentItem;
        }
      }
    }
    if (params.indexOf("$returnUri=") == -1) {
       var div = document.getElementById(iframeId + "_div");
      var tag = div.getElementsByTagName('a');
      if (tag.length) {
        var retUri = tag[0].href;
        params += "&$returnUri=" + encodeURIComponent(retUri + "&-addItems=y");
      }
    }
/*
 * iframeWindow.location.replace(newUri); // load data from server into iframe //
 * window.open(newUri); // return; setTimeout(addAndShowWait, 50);
 */
    var div = document.createElement('div');
    div.style.display = "none";

		postRequest(event, newUri, params, div, hotspot, addAndShowWait);
    return stopEventPropagation(event);
  } catch (er) {
    alert(er);
  }
}

function cancelItemAndWait(event) {
  var divId = "resourceList_div";
  var divCopyTo = document.getElementById(divId);
  var elms = divCopyTo.getElementsByTagName('a');
  var currentItem;
  var currentItemA;
  for (var j=0; j<elms.length; j++) {
    if (elms[j].id  &&  elms[j].id == 'currentItem') {
      currentItemA = elms[j];
      currentItem = elms[j].href;
      break;
    }
  }
  var divs = divCopyTo.getElementsByTagName("div");
  var eDiv;
  for (var i=0; i<divs.length; i++) {
    if (divs[i].id && divs[i].id == 'errorMessage') {
      divs[i].innerHTML = '';
      eDiv = divs[i];
      break;
    }
  }

  elms = divCopyTo.getElementsByTagName('tr');
  var currentTr;
  var resultsTr;
  var totalsTr;

  var newCurrentTr;
  var headerRow;
  var recsNmb;
  for (var j=0; j<elms.length; j++) {
    var tr = elms[j];
    if (!tr.id)
      continue;
    if (tr.id == 'results') {
      var tds = tr.childNodes;
      for (var i=0; i<tds.length; i++) {
        if (tds[i].id && tds[i].id == 'results') {
          var r = tds[i].innerHTML;
          var idx = r.indexOf('-');
          var idx1 = r.indexOf('<', idx);
          var recs = r.substring(idx + 1, idx1);
          recsNmb = parseInt(recs) - 1;
          if (recsNmb == 0)
            resultsTr = tr;
          else {
            var newInnerHTML = r.substring(0, idx + 1) + recsNmb;
            idx = r.indexOf(recs, idx1);

            newInnerHTML += r.substring(idx1, idx) + recsNmb;
            tds[i].innerHTML = newInnerHTML;
          }
        }
      }
    }
    else if (tr.id == 'header')
      headerRow = j;
    else if (tr.id == currentItem) {
      currentTr = tr;
      if (recsNmb) {
        if (elms.length > j + 2)
          newCurrentTr = elms[j + 1];
        else if (j - 1 != headerRow)
          newCurrentTr = elms[j - 1];
      }
    }
    else if (tr.id == 'totals') {
      totalsTr = tr;
      if (recsNmb == 0)
        break;
      var tds = tr.getElementsByTagName('td');
      var curTrTds = currentTr.getElementsByTagName('td');
      for (var i=0; i<tds.length; i++) {
        if (tds[i].id && tds[i].id.indexOf('tot_') == 0) {
          var tot = tds[i].innerHTML;
          var startDigit = -1;
          for (var ii=0; ii<tot.length; ii++) {
            var ch = tot.charAt(ii);
            if (isDigit(ch)) {
              if (startDigit == -1)
                startDigit = ii;
            }
          }
          var total = extractTotalFrom(tot);
          // since first cell of Total tr has colspan=2, the column # in
          // resources TR that referes to the same property will reside in # + 1
          // column
          var curTotal = extractTotalFrom(curTrTds[i + 1].innerHTML);

          total -= curTotal;
          total = Math.round(total * 100)/100;
          var totS = '' + total;
          var itot = totS.indexOf(".");
          if (itot == -1)
            totS += ".00";
          else if (itot == totS.length - 2)
            totS += "0";
          tds[i].innerHTML = tot.substring(0, startDigit) + totS;
        }
      }
    }
  }
  if (newCurrentTr) {
    newCurrentTr.style.backgroundColor = '#F5ABE6';
    var a = newCurrentTr.getElementsByTagName('a');
    var h = a[0].href;
    var idx = h.indexOf('&uri=');
    var idx1 = h.indexOf('&', idx + 1);
    var uri;
    if (idx1 == -1)
      uri = decodeURIComponent(h.substring(idx + 5));
    else
      uri = decodeURIComponent(h.substring(idx + 5, idx1));
    if (uri.indexOf('/hosts/') != -1) {
      idx = h.indexOf('/v.html');
      idx1 = uri.indexOf('/', 7);
      uri = h.substring(0, idx) + uri.substring(idx1);
    }
    currentItemA.href = newCurrentTr.id; //uri;
  }
  var tbody  = currentTr.parentNode;
  tbody.removeChild(currentTr);
  if (recsNmb == 0) {
    tbody = resultsTr.parentNode;
    tbody.removeChild(resultsTr);
    tbody = totalsTr.parentNode;
    tbody.removeChild(totalsTr);
  }
}

function addAndShowWait(event, body, hotspot, content, url, noInsert, isReplace)	{
  var frameId = "resourceList";
  if (!noInsert) {
    if (!content) {
      var frameBodyId = "siteResourceList";
      if (!frameLoaded[frameId]) {
        setTimeout(addAndShowWait, 50);
        return;
      }
      frameLoaded[frameId] = false;
      var l = document.location;
      var iframe = document.getElementById(frameId);
      var iframeWindow = frames[frameId];
      body = iframeWindow.document.getElementById(frameBodyId);
      if (!body) {
	      alert("Warning: server did not return options data - check connection to server");
				setTimeout("ListBoxesHandler.onBackBtn()", 1000);
        return;
      }
    }
    else {
      setInnerHtml(body, content);
    }
  }
  var divCopyTo = document.getElementById(frameId + "_div");
  if (!divCopyTo) {
    throw new Error("Warning: target div not found: " + frameId + "_div");
    return;
  }
  var divs = divCopyTo.getElementsByTagName("div");
  var eDiv;
  for (var i=0; i<divs.length; i++) {
    if (divs[i].id && divs[i].id == 'errorMessage') {
      divs[i].innerHTML = '';
      eDiv = divs[i];
      break;
    }
  }
  var bdivs = body.getElementsByTagName("div");
  for (var i=0; i<bdivs.length; i++) {
    if (bdivs[i].id && bdivs[i].id == 'errorMessage') {
      if (bdivs[i].innerHTML) {
        eDiv.innerHTML = bdivs[i].innerHTML;
        return;
      }
    }
  }
  // Find new 'currentItem' anchor and substitute old one with new
  var elms = body.getElementsByTagName('a');
  var currentItem;
  for (var j=0; j<elms.length; j++) {
    if (elms[j].id  &&  elms[j].id == 'currentItem') {
      currentItem = elms[j].href;
      // alert(currentItem);
      break;
    }
  }
  // Find tr that needed to be inserted in the list
  var elms = body.getElementsByTagName('tr');
  var currentTR;
  var curResultsTR;
  var found;
  for (var j=0; j<elms.length; j++) {
    if (elms[j].id) {
      if (elms[j].id == currentItem) {
        currentTR = elms[j];
        found = true;
      }
      else if (elms[j].id == "results")
        curResultsTR = elms[j];
    }
    else if (noInsert) {
      if (!found)
        currentTR = elms[j];
    }
  }
  // Find TR in previous list that was current and change style of the row
  elms = divCopyTo.getElementsByTagName('a');
  var oldCurrentItem;
  for (var j=0; j<elms.length; j++) {
    if (elms[j].id  &&  elms[j].id == 'currentItem') {
      oldCurrentItem = elms[j].href;
      elms[j].href = currentItem;
      break;
    }
  }

  var oldCurrentTR;
  elms = divCopyTo.getElementsByTagName('tr');
  if (oldCurrentItem) {
    for (var j=0; j<elms.length; j++) {
      if (elms[j].id  &&  elms[j].id == oldCurrentItem) {
        if (oldCurrentItem == currentItem) {
          var tbody  = elms[j].parentNode;
          oldCurrentTR = elms[j];
          tbody.removeChild(elms[j]);
          // copyTableRow(tbody, rowIndex, currentTR);
          if (j == elms.length)
            tbody.appendChild(currentTR);
          else {
            // alert(currentTR.id + ', ' + elms[j].innerHTML);
            tbody.insertBefore(currentTR, elms[j]);
          }
        }
        else
          elms[j].style.backgroundColor = '';
        break;
      }
    }
  }

// divCopyTo.innerHTML = body.innerHTML;
  var totals;
  var oldResultsTR;
  var totalsTR;
  var resultsTR;
  var headerTR;
  var headerTRidx = 0;
  for (var j=0; j<elms.length; j++) {
    var tr = elms[j];
    if (!tr.id)
      continue;
    if (!oldCurrentTR  &&  tr.id == 'results') {
      var tds = tr.childNodes;
      resultsTR = tr;
      for (var i=0; i<tds.length; i++) {
        if (tds[i].id && tds[i].id == 'results') {
          var r = tds[i].innerHTML;
          var idx = r.indexOf('-');
          if (idx == -1) {
// tds[i].innerHTML = curResultsTR.innerHTML;
            continue;
          }
          var idx1 = r.indexOf('<', idx);
          var recs = r.substring(idx + 1, idx1);
          var recsNmb = parseInt(recs) + 1;
          var newInnerHTML = r.substring(0, idx + 1) + recsNmb;
          idx = r.indexOf(recs, idx1);

          newInnerHTML += r.substring(idx1, idx) + recsNmb;
          tds[i].innerHTML = newInnerHTML;
        }
      }
    }
    else if (tr.id == 'totals') {
      totalsTR = tr;
      var tds = tr.getElementsByTagName('td');
      var curTrTds = currentTR.getElementsByTagName('td');
      var oldCurTrTds;
      if (oldCurrentTR)
        oldCurTrTds = oldCurrentTR.getElementsByTagName('td');
      for (var i=0; i<tds.length; i++) {
        if (tds[i].id && tds[i].id.indexOf('tot_') == 0) {
          var tot = tds[i].innerHTML;
          var startDigit = -1;
          for (var ii=0; ii<tot.length; ii++) {
            var ch = tot.charAt(ii);
            if (isDigit(ch)) {
              if (startDigit == -1)
                startDigit = ii;
            }
          }
          var total = extractTotalFrom(tot);
          // since first cell of Total tr has colspan=2, the column # in
          // resources TR that referes to the same property will reside in # + 1
          // column
          var curTotal = extractTotalFrom(curTrTds[i + 1].innerHTML);
          total += curTotal;
          if (oldCurrentTR) {
            var oldTotal = extractTotalFrom(oldCurTrTds[i + 1].innerHTML);
            total -= oldTotal;
          }
          total = Math.round(total * 100)/100;
          var totS = '' + total;
          var itot = totS.indexOf(".");
          if (itot == -1)
            totS += ".00";
          else if (itot == totS.length - 2)
            totS += "0";
          tds[i].innerHTML = tot.substring(0, startDigit) + totS;
        }
      }
    }
    else if (!oldCurrentTR  &&  tr.id == 'header') {
      headerTR = tr;
      headerTRidx = j;
      var tbody  = tr.parentNode;
      var trElms = tbody.childNodes;
      var pos = 1;
      var trNmb = 0;
      var headerIdx = 0;
      for (var ii=0; ii<trElms.length; ii++) {
        var tagName = trElms[ii].tagName;
        if (!tagName ||  tagName.toLowerCase() != 'tr')
          continue;
        else if (headerIdx  && pos == 1)
          pos = ii;
        else if (trElms[ii].id == 'header')
          headerIdx++;
        trNmb++;
      }
      // var newTr = document.importNode(currentTR, true);
// copyTableRow(tbody, pos, currentTR);
      if (pos == trNmb || pos == 0) {
        tbody.appendChild(currentTR);
      }
      else {
        tbody.insertBefore(currentTR, trElms[pos]);
      }
    }
  }
  // This is the first element in RL. That means that 'Total' line was not
  // formed
  if (oldCurrentItem != currentItem && (!totalsTR || !resultsTR)) {
    var elms = body.getElementsByTagName('tr');
    for (var j=0; j<elms.length; j++) {
      var tr = elms[j];
      tbody = headerTR.parentNode;
      if (!totalsTR && tr.id == 'totals')
        tbody.appendChild(tr);
      else if (!resultsTR && tr.id == 'results') {
        var cells = tr.getElementsByTagName('td');
        var cellsNmb = cells.length;
        var headerCols = headerTR.getElementsByTagName('td').length;
        if (cellsNmb != headerCols)
          cells[0].colSpan = headerCols - cellsNmb + 1;
        tbody.insertBefore(tr, headerTR);
      }
    }
  }
  // resourceListEdit(divCopyTo);
  var anchors = divCopyTo.getElementsByTagName('a');
  for (var i=0; i<anchors.length; i++)
    addBooleanToggle(anchors[i]);
}

function extractTotalFrom(tot) {
  var ii = 0;
  var dot = -1;
  var startDigit = -1;
  var endDigit = tot.length;
  for (; ii<tot.length; ii++) {
    var ch = tot.charAt(ii);
    if (isDigit(ch)) {
      if (startDigit == -1)
        startDigit = ii;
    }
    else if (startDigit == -1)
      continue;
    else if (dot != -1) {
      endDigit = ii;
      break;
    }
    else if (ch == '.')
      dot = ii;
  }
  var total = 0;
  if (startDigit != -1)
    total = parseFloat(tot.substring(startDigit, endDigit));
  return total;
}
function isDigit(num) {
  if (num.length > 1)
    return false;
  var string="1234567890";
  if (string.indexOf(num)!=-1)
    return true;
  return false;
}
function processTransaction(e) {
  var target = getTargetElement(e);
  if (!target)
    return;
  var form = target.form;
  var params = FormProcessor.getFormFilters(form, true);
  var url = "FormRedirect?JLANG=en" + params; // HACK: since form.action returns
                                              // the value of '&action='
  url += "&-applet=y";

  var w     = 400;
  var h     = 400;
  var top   = 100;
  var left  = 100;
  window.open(url, 'Transaction','width=' + w + ',height=' + h + ',top=' + top + ',left=' + left + ', menubar=no, status=0, location=no, toolbar=no, scrollbars=no, status=no, resizable=yes');
  return stopEventPropagation(e);
}

function showDiv(e, td, hideDivId) {
  e = getDocumentEvent(e);
  var div = document.getElementById(hideDivId);
  div.style.visibility = Popup.HIDDEN;
  div.style.display = "none";
  var divId = 'div_' + td.id;
  div = document.getElementById(divId);
  div.style.visibility = Popup.VISIBLE;
  div.style.display = 'inline';
  return stopEventPropagation(e);
}
// Close neiboghring bookmark and update main Bookmark
function closeDiv(e, hideDivId) {
  e = getDocumentEvent(e);

  var elm = getTargetElement(e);
  var div = document.getElementById(hideDivId);
  if (!elm) {
    hideDiv(e, hideDivId);
    return stopEventPropagation(e);
  }
  a = elm;
  if (elm.tagName.toLowerCase() != 'a')
    a = elm.parentNode;
  var url = a.href;
  if (url == 'about:blank') {
    var widget = hideDivId.substring("widget_".length);
    if (isNaN(widget))
      hideDiv(e, hideDivId);
    else {
      var bookmarkBase = document.getElementById('bookmarkBlock');
      var uri = bookmarkBase.innerHTML + widget;
      postRequest(e, 'delete', 'uri=' + encodeURIComponent(uri), div, elm, closeDivCallback);
    }

    return stopEventPropagation(e);
  }
  var ret = stopEventPropagation(e);
  var idx = url.indexOf('?');
  postRequest(e, url.substring(0, idx), url.substring(idx + 1), div, elm, closeDivCallback);

  function closeDivCallback(e, div) {
    hideDiv(e, div.id);
    hideDiv(e, div.id + '_back');
    var idx = hideDivId.lastIndexOf('=');
    // find tr in dashboard menu that corresponds to deleted widget and hide it
    var tr = document.getElementById('dm_' + hideDivId.substring(idx + 1));
    if (tr) {
      tr.style.visibility = Popup.HIDDEN;
      tr.style.display = "none";
    }
  }
  return ret;
}

// Show/hide all neiboghring bookmarks and update main Bookmark
function showHideAll(e, divId) {
  e = getDocumentEvent(e);

  var a = getTargetElement(e);
  var elm = a.firstChild;
  var showAll = elm.src.indexOf('show.gif') != -1;

  var url = a.href;
  var idx = url.indexOf('?');
  var div = document.getElementById(divId);
  var href = document.location.href;
  postRequest(e, url.substring(0, idx), url.substring(idx + 1), div, elm, showHideCallback);

  function showHideCallback() {
    var idx = href.indexOf("&-showAll=");
    if (idx != -1) {
      var idx1 = href.indexOf("&", idx + 1);
      var isShowAll = href.charAt(idx + 10) == 'y';
      var href1 = href.substring(0, idx + 10);
      if (isShowAll)
        href1 += "n";
      else
        href1 += "y";
      if (idx1 != -1)
        href1 += href.substring(idx1);
      href = href1;
    }
    else
      href += "&-showAll=y";
    document.location.href = href;
  }
  return stopEventPropagation(e);
}
// Minimize/restore neiboghring bookmark and update main Bookmark
function minimizeRestoreDiv(e, hideDivId, property) {
  e = getDocumentEvent(e);

  var elm = getTargetElement(e);
  var div = document.getElementById(hideDivId);
  if (!elm) {
    minMax(e, hideDivId);
    return stopEventPropagation(e);
  }
  var a;
  if (elm.tagName.toLowerCase() == 'a')
    a = elm;
  else
    a = elm.parentNode;
  var url = a.href;
  if (url == 'about:blank') {
    minMax(e, hideDivId);
    return stopEventPropagation(e);
  }
  var idx = url.indexOf('?');
  var propParam = '&.' + property + '=';
  var idx1 = url.indexOf(propParam);
  if (idx1 != -1) {
    var pos = idx1 + propParam.length;
    if (url.charAt(pos) == '-')
      a.href = url.substring(0, pos) + '%2B' + url.substring(pos + 1);
    else
      a.href = url.substring(0, pos) + '-' + url.substring(pos + 3);
  }
  var ret = stopEventPropagation(e);
  postRequest(e, url.substring(0, idx), url.substring(idx + 1), div, elm, minMaxAndFlip);
  return ret;
}
// Dummy callback that is called after updating main boolmark
function hideDiv(e, hideDivId) {
  var div = document.getElementById(hideDivId);
  if (!div)
    return;
  div.style.visibility = Popup.HIDDEN;
  div.style.display = "none";
  return stopEventPropagation(e);
}

function showDiv1(e, showDivId) {
  activateDiv(e, showDivId);
  displayDiv(e, showDivId);
}

function activateDiv(e, showDivId) {
  var div = document.getElementById(showDivId);
  if (!div)
    return;
  div.style.display = "block";
}

function displayDiv(e, showDivId) {
  var div = document.getElementById(showDivId);
  if (!div)
    return;
  div.style.visibility = Popup.VISIBLE;
}

function minMaxAndFlip(e, div) {
  var hideDivId = div.id;
  if (hideDivId.indexOf('_min') != -1) {
    var showDivId = hideDivId.substring(0, hideDivId.length - 4);
    hideDiv(e, showDivId + "_back");
    activateDiv(e, showDivId);
    displayDiv(e, showDivId);
  }
  else
    hideDiv(e, hideDivId + "_back");
  minMax(e, hideDivId);
  return stopEventPropagation(e);
}

function minMax(e, divId) {
  e = getDocumentEvent(e);
  if (!e)
    return;
  var elm = getTargetElement(e);
  if (!elm)
    return;
  if (elm.tagName.toLowerCase() == 'a') {
    var elms = elm.childNodes;
    for (var i=0; i<elms.length; i++) {
      if (elms[i].tagName.toLowerCase() == 'img') {
        elm = elms[i];
        break;
      }
    }
  }
  var div = document.getElementById(divId);
  div.className = '';
  if (elm.src.indexOf('minimize.gif') != -1) {
    div.style.visibility = Popup.HIDDEN;
    div.style.display = "none";
    elm.src = 'icons/restore.gif';
  }
  else {
    div.style.visibility = Popup.VISIBLE;
    div.style.display = '';
    elm.src = 'icons/minimize.gif';
  }
}

function showTab(e, td, hideDivId, unhideDivId) {
  e = getDocumentEvent(e);

  var isViewAll = td.id == 'viewAll';
  var hasPrefix;
  if (hideDivId  &&  hideDivId.length != 0) {
    var tokens = hideDivId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var tok = trim(tokens[i]);
      var div = document.getElementById(tok);
      if (!div)
        continue;
			
			// div_Description occupies 100% that's why make its parent TD 100%
			// TODO: probably to redo Tabs and to put all divs in one container.
			if (i == 0) {
		  	var parentTd = getAncestorByTagName(div, "td");
		  	var divDescription = getChildById(parentTd, "div_Description");
		  	var hasDescription = (divDescription != null);
		  	if (hasDescription && hideDivId.indexOf("div_Description") == -1)  
		  		parentTd.style.width = "100%";
  	  	else { 
          var hasEdit = (getChildById(parentTd, "div_Edit") != null);
          if (hasEdit && hideDivId.indexOf("div_Edit") == -1) 
            parentTd.style.width = "50%";
          else if (hideDivId.indexOf("div_cp") == -1) 
            parentTd.style.width = "50%";
          else 
            parentTd.style.width = "100%";
  	  	}
	  	}

      div.style.visibility = Popup.HIDDEN;
      div.style.display = "none";
			
      var tdId;
      if (tok.charAt(0) == 'i') {
        tdId = tok.substring(5);
        hasPrefix = true;
      }
      else
        tdId = tok.substring(4);
      var hideTD = document.getElementById(tdId);
      if (hideTD) {
        if (hideTD.className == "dashboard_btn current")
          hideTD.className = "dashboard_btn";
        if (!isViewAll  &&  tt != null) {
          tt = document.getElementById('cp_' + tdId);
          if (tt != null)
            tt.className = "currentTabTitleHidden";
        }
      }
    }
    var tt;
    if (hasPrefix)
      tt = document.getElementById('cp_i_' + td.id);
    else
      tt = document.getElementById('cp_' + td.id);
    if (tt)
      tt.className = "currentTabTitleHidden";
  }
  var divId;
  if (hasPrefix)
    divId = 'idiv_' + td.id;
  else
    divId = 'div_' + td.id;

  var curDiv = document.getElementById(divId);
//  curDiv.style.visibility = Popup.VISIBLE;
//  curDiv.style.display = 'inline';
  curDiv.className = "";
  curDiv.style.visibility = "";
  curDiv.style.display = "";
  

  if (td.className == "dashboard_btn")
    td.className = "dashboard_btn current";
/*
 * if (isViewAll && tokens) { var tr = document.getElementById(tokens.length +
 * 'cp'); if (tr != null) tr.className = "currentTabTitle"; }
 */
  if (unhideDivId  &&  unhideDivId.length != 0) {
    var tokens = unhideDivId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var tok = trim(tokens[i]);
      var div = document.getElementById(tok);
      if (!div)
        continue;

      div.className = "";
      div.style.visibility = Popup.VISIBLE;
      div.style.display = 'inline';
      var tdId;
      if (tok.charAt(0) == 'i') {
        tdId = tok.substring(5);
        hasPrefix = true;
      }
      else
        tdId = tok.substring(4);
      var uTD = document.getElementById(tdId);
      if (uTD) {
        if (uTD.className == "dashboard_btn current")
          uTD.className = "dashboard_btn";
        var controlPanelId = (hasPrefix) ? 'icp' : 'cp';
        if (uTD.id == controlPanelId  &&  uTD.className == 'currentTabTitleHidden')
          uTD.className = 'controlPanel';
        if (isViewAll) {
          var tt;
          if (hasPrefix)
            tt = document.getElementById('cp_i_' + tdId);
          else
            tt = document.getElementById('cp_' + tdId);
          tt.className = "currentTabTitle";
        }
      }
    }
  }
  ExecJS.runDivCode(curDiv);
  if(typeof ImageAnnotations != 'undefined')
    ImageAnnotations.onTabSelection(curDiv);

  resizeIframeOnTabSelection(curDiv); // IE
  
	var panelBlock = getChildByClassName(curDiv, "panel_block");
	if (panelBlock) {
  	TouchDlgUtil.init(panelBlock);
  	TouchDlgUtil.setCurrentDialog(panelBlock);
  }
  return stopEventPropagation(e);
}
var curSpan;
function showTabLabel(label) {
  if (curSpan)
    curSpan.style.display = 'none';
  var span = document.getElementById(label);
  if (span)
    span.style.display = 'inline';
  curSpan = span;
}
// IE specific function. (Tab in a dialog)
function resizeIframeOnTabSelection(tabDiv) {
  var dialogIframe = document.getElementById('dialogIframe');
  if(dialogIframe && dialogIframe.style.visibility == "visible") {
    var div = getAncestorById(tabDiv, "pane2");
    if(!div)
      return;

    var SHADOW_WIDTH = 11;
    var istyle = dialogIframe.style;
    var contentObj = getChildById(div, "dataEntry");
    if (contentObj == null)
      contentObj = getChildById(div, "resourceList");
    if (contentObj != null) {
      istyle.width   = contentObj.clientWidth  - SHADOW_WIDTH + 'px';
      istyle.height  = contentObj.clientHeight - SHADOW_WIDTH + 'px';
    }
  }
}

function hideShowControlPanel(hide) {
  var td = document.getElementById('cp');
  if (!td)
    return;
  if (hide)
    td.style.display = 'none';
  else
    td.style.display = '';
  td = document.getElementById('cpTabs');
  if (!td)
    return;
  if (hide)
    td.style.display = 'none';
  else
    td.style.display = '';
}

function showRows(e, td, hideRowsId, unhideRowsId) {
  e = getDocumentEvent(e);

  var isViewAll = td.id == 'viewAll';
  if (hideRowsId  &&  hideRowsId.length != 0) {
    var tokens = hideRowsId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var rowgroup = document.getElementById(tokens[i]);
      rowgroup.style.visibility = 'collapse';
      var tdId = tokens[i].substring(4);
      var hideTD = document.getElementById(tdId);
      var ht = hideTD.getElementsByTagName("table");
      if (ht.length != 0  &&  ht[0].className == "dashboard_btn current")
        ht[0].className = "dashboard_btn";
      if (!isViewAll  &&  tt != null) {
        tt = document.getElementById('cp_' + tdId);
        if (tt != null)
          tt.className = "currentTabTitleHidden";
      }
    }
    var tt = document.getElementById('cp_' + td.id);
    if (tt != null)
      tt.className = "currentTabTitleHidden";
  }

  if (unhideRowsId  &&  unhideRowsId.length != 0) {
    var tokens = unhideDivId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var rowgroup = document.getElementById(tokens[i]);
      rowgroup.style.visibility = 'visible';
      var tdId = tokens[i].substring(4);
      var uTD = document.getElementById(tdId);
      var uTable = uTD.getElementsByTagName("table");
      if (uTable.length != 0  &&  uTable[0].className == "dashboard_btn current")
        uTable[0].className = "dashboard_btn";
      if (isViewAll) {
        var tt = document.getElementById('cp_' + tdId);
        tt.className = "currentTabTitle";
      }
    }

  }
  var rowgroupId = 'div_' + td.id;
  rowgroup = document.getElementById(rowgroupId);
  rowgroup.style.visibility = Popup.VISIBLE;
  rowgroup.style.display = 'inline';

  var t = td.getElementsByTagName("table");
  if (t.length != 0  &&  t[0].className == "dashboard_btn")
    t[0].className = "dashboard_btn current";

  if (isViewAll) {
    var tr = document.getElementById(tokens.length + 'cp');
    if (tr != null)
      tr.className = "currentTabTitle";
  }
  return stopEventPropagation(e);
}

/*
function onHideDialogIcon(e, hideIcon) {
  var pane2 = getAncestorById(hideIcon, 'pane2');
  if (pane2) {
    PlainDlg.hide(e);
  }
}
*/

function openPopup1(divId1, alertName, hotSpot, e) {
  var etarget = getEventTarget(e);
  var isCalendar = etarget.tagName.toLowerCase() == 'img'  &&  etarget.src.indexOf('calendar.gif') != -1;

// alert('divId1=' + divId1 + ', divId2=' + divId2 + ', hotSpot=' + hotSpot + ',
// e=' + e + ', maxDuration=' + maxDuration);
  if (isCalendar  ||  e.ctrlKey)  // ctrl-enter
    showAlert(alertName);
  else
    openPopup(divId1, null, hotSpot, e);
}

function openPopup(divId1, divId2, hotSpot, e, maxDuration) {
  if (divId2 != null) {
    if (resourceCalendars[divId2] == null)
      divId2 = null;
    else
      divId2 = "a." + divId2;
  }
  var etarget = getEventTarget(e);
  var isCalendar = etarget.tagName.toLowerCase() == 'img'  &&  etarget.src.indexOf('calendar.gif') != -1;


// alert('divId1=' + divId1 + ', divId2=' + divId2 + ', hotSpot=' + hotSpot + ',
// e=' + e + ', maxDuration=' + maxDuration);
  if (isCalendar  ||  e.ctrlKey)  {// ctrl-enter
    if (!maxDuration) {
      Popup.open(e, divId2, hotSpot);
      return stopEventPropagation(e);
      return;
    }
    var div = document.getElementById(divId2);
    var tables = div.getElementsByTagName("table");
    var table;
    for (var i=0; i<tables.length && !table; i++) {
      if (tables[i].id  &&  tables[i].id.indexOf("table_") == 0)
        table = tables[i];
    }
    var trs = table.getElementsByTagName('tr');
    var trLen = trs.length;
    for (var i=1; i<trLen; i++) {
      var tr = trs[i];
// var anchor = tr.getElementsByTagName('a');
// var s = anchor[0].innerHTML;
      var s = tr.id;

      var idx = s.indexOf("=");
      s = s.substring(idx + 1);
      if (parseInt(s) > maxDuration) {
        tr.style.visibility = Popup.HIDDEN;
        tr.style.display = "none";
      }
      else {
        tr.style.visibility = Popup.VISIBLE;
        tr.style.display = "";
      }
    }
    Popup.open(e, divId2, hotSpot);
  }
  else {
    if (divId1 != null) {
      var target = getTdNode(hotSpot);
      if (!currentCell || currentCell != target)
        schedule(e);
      else
        Popup.open(e, 'e.' + divId1, hotSpot);
    }
  }
  calendarCell = hotSpot;
  return stopEventPropagation(e);
// return false;
}

function setCurrentItem (event, tr) {
  tr.style.backgroundColor = '#F5ABE6';
  var aa = document.getElementById('currentItem');
  if (!aa)
    return;
  if (aa.href != tr.id) {
    var elm = document.getElementById(aa.href);
    if (elm == null)
      return;
    var cName = elm.className;
    if (cName)
      elm.style.backgroundColor = '';
    else
      elm.style.backgroundColor = 'white';

    aa.href = tr.id;
  }
  var div = document.getElementById('keyboard');
  if (!div)
    return;

  var form = div.getElementsByTagName('form');
  var forum = form[0].elements['.forum_select'];
  forum.value = tr.id;
}

function inReplyTo(event, tr, shortPropName, value) {
  tr.style.backgroundColor = '#F5ABE6';
  $t = Mobile;
  if (!$t.currentUrl)
    return;
  var currentDiv = $t.getCurrentPageDiv();
  var forms = currentDiv.getElementsByTagName('form');
  if (!forms)
    return;
  var form;
  for (var i=0; i<forms.length  &&  !form; i++) {
    var f = forms[i];
    if (f.id  &&  f.id.startsWith('tablePropertyList_'))
      form = f;
  }
  if (!form)
    return;

  form.elements["." + shortPropName].value = value;
  var anchors = currentDiv.getElementsByTagName('a');
  if (!anchors)
    return;
  var aa;
  for (var i=0; i<anchors.length  &&  !aa; i++) {
    var a = anchors[i];
    if (a.id  &&  a.id == 'currentItem')
      aa = a;
  }
  if (!aa)
    return;
  if (aa.href != tr.id) {
    var elm = document.getElementById(aa.href);
    if (elm == null)
      return;
    var cName = elm.className;
    if (cName)
      elm.style.backgroundColor = '';
    else
      elm.style.backgroundColor = 'white';

    aa.href = tr.id;
  }
  //  document.forms['tablePropertyList'].elements["'." + shortPropName + "_select'"] = value;
//  document.forms['tablePropertyList'].elements["'." + shortPropName + "_verified'"] = 'y';
}

function addAndShowItems(tr, e) {
  e = getDocumentEvent(e);
  if (!e)
    return stopEventPropagation(e);
  var anchor = "mkresource?type=http://www.hudsonfog.com/voc/model/portal/Annotation&submit=Please+wait&.forum_verified=y&";
  var form = document.getElementById('filter');
  var forum = form.elements[".forum_select"].value;
  var title = form.elements[".title"].value;
  var href = document.location.href;
  var idx = href.indexOf("?");
  anchor += "&.forum_select=" + encodeURIComponent(forum) + "&.title=" + encodeURIComponent(title) + "&$returnUri=";

  var idx1 = href.indexOf("-currentItem=");

  if (idx1 == -1)
    anchor += encodeURIComponent("l.html?-addItems=y&-noRedirect=y&-currentItem=" + encodeURIComponent(forum) + "&" + href.substring(idx + 1));
  else {
    var idx2 = href.indexOf("&", idx1);
    anchor += encodeURIComponent("l.html?-addItems=y&-noRedirect=y&-currentItem=" + encodeURIComponent(forum) + "&" + href.substring(idx + 1, idx1) + href.substring(idx2));
  }

  return addAndShow1(anchor, e);
}
function printReceipt(url) {
  var curUL = document.getElementById(url);
  if (!curUL)
    return;

  var li = curUL.getElementsByTagName("li");
  if (li.length) {
    var appl = document.applets[0];
    appl.open();
    for (i=0; i<li.length; i++)
      appl.println(li[i].innerHTML);
    appl.close();
  }
}

var menuGroupDiv;
function showKeyboard() {
  var kdiv = document.getElementById('keyboard');
  if (!kdiv)
    return;
  var divs = document.getElementsByTagName('div');
  for (var i=0; i<divs.length; i++) {
// if (divs[i].id == "div_Vodka")
// alert(divs[i].style.display + "; " + divs[i].style.visibility);

    if (divs[i].style.display == 'none')
      continue;
    if (divs[i].id  &&  divs[i].id.indexOf('div_') == 0) {
      menuGroupDiv = divs[i];
      menuGroupDiv.style.display = 'none';
      break;
    }
  }
  kdiv.style.display = 'inline';
}

// usage:
// insertAtCursor(document.formName.fieldName, ?this value?);
function insertAtCursor(myField, myValue) {
  // IE support
  if (document.selection) {
    myField.focus();
    sel = document.selection.createRange();
    sel.text = myValue;
  }
  // MOZILLA/NETSCAPE support
  else if (myField.selectionStart || myField.selectionStart == '0') {
    var startPos = myField.selectionStart;
    var endPos = myField.selectionEnd;
    myField.value = myField.value.substring(0, startPos)
    + myValue
    + myField.value.substring(endPos, myField.value.length);
  }
  else {
    myField.value += myValue;
  }
}

function setCaretToEnd (el) {
  if (el.createTextRange) {
    var v = el.value;
    var r = el.createTextRange();
    r.moveStart('character', v.length);
    r.select();
  }
}

/**
 * In the form that has several submit buttons - this is the way we detect which
 * one was clicked
 */
function saveButtonClicked(e) {
  e = getDocumentEvent(e); if (!e) return;
  var target = getTargetElement(e);
  if (!target)
    return true;
  var button = target;
  var form = target.form;
  form.setAttribute("buttonClicked", button.name);
  return true;
}


//****************************************************************
// used to manage dialogs
// Touch UI dialogs are in 'panel_block' div
// others("blue") in 'pane2' div
//
// positionEnforced enforced to set dialog in accordance to hotspot position
// without regarding if bottom of a dialog is bellow a page bottom (used for filter)
//****************************************************************
function setDivVisible(event, div, iframe, hotspot, offsetX, offsetY, hotspotDim, positionEnforced) {
	if (Browser.mobile) {
    div.style.left = 0 + 'px';
    div.style.top  = 0 + 'px';
    div.style.minWidth = "none";
		div.style.maxWidth = "none";
		
    div.style.visibility = Popup.VISIBLE;
		div.style.display = "block";
		return;
  }

  var isDivStatic = (div.style.position.toLowerCase() == 'static');
	
	if (!iframe)
		iframe = document.getElementById('dialogIframe');
		
  // only IE < 7 has a problem with form elements 'showing through' the popup
  var istyle;
  if (Browser.lt_ie7 && !Browser.mobile) {
    var istyle = iframe.style;
    istyle.visibility = Popup.HIDDEN;
  }

  div.style.visibility = Popup.HIDDEN;   // mark hidden - otherwise it shows up as soon as we set display = 'inline'
  var scrollXY = getScrollXY();
  var scrollX = scrollXY[0];
  var scrollY = scrollXY[1];

  var left = 0;
  var top  = 0;

  if (hotspotDim) {
    left = hotspotDim.left;
    top  = hotspotDim.top;
  }
  else if (event || hotspot) {
//    var coords = getElementPosition(hotspot, event);
//    left = coords.left;
//    top  = coords.top;
		
		if (!hotspot)
			hotspot = getEventTarget(event);
		
		left = findPosX(hotspot);
    top  = findPosY(hotspot);
  }

	if (hotspot) // show div under bottom of hotspot
		top += hotspot.offsetHeight;

  var screenXY = getWindowSize();
  var screenX = screenXY[0];
  var screenY = screenXY[1];

  // first position the div box in the top left corner in order to measure its dimensions
  // (otherwise, if position correctly and only then measure dimensions - the
  // width/height will get cut off at the scroll boundary - at least in firefox 1.0)
  div.style.display    = 'inline'; // must first make it 'inline' - otherwise div coords will be 0
  reposition(div, 0, 0);

	var divCoords = getElementDimensions(div);
	// set the div in screen center if neither hotspotDim nor hotspot where provided.
	if (hotspotDim == null && left == 0 && top == 0 && !positionEnforced) {
		left = (screenX + scrollX - divCoords.width) / 2;
		top = (screenY + scrollY - divCoords.height) / 2;
		if (left < 0) left = 0;
		if (top < 0) top = 0;
	}
	
	// Find out how close hotspot is to the edges of the window
  var distanceToRightEdge  = screenX + scrollX - left;
  var distanceToBottomEdge = screenY + scrollY - top;
	
	
  var margin = 40;
  // cut popup dimensions to fit the screen
  var mustCutDimension = (div.id == 'pane2' || Browser.joystickBased) ? false: true;
  // var mustCutDimension = false;

  if (mustCutDimension) {
    var xFixed = false;
    var yFixed = false;
    if (divCoords.width > screenX - margin * 2) {
      div.style.width = screenX - margin * 2 + 'px';
      xFixed = true;
    }
   
		if (divCoords.height > screenY - margin * 2) { // * 2 <- top & bottom margins
      //div.style.height = screenY - margin * 2 + 'px';
      //yFixed = true;
    }
    // recalc coords and add scrolling if we fixed dimensions
    if (typeof div.style.overflowX == 'undefined') {
      if (xFixed || yFixed) {
        div.style.overflow = "auto";
        divCoords = getElementDimensions(div);
      }
    }
    else {
      if (typeof div.style.overflowX != 'undefined') {
        if (xFixed)
			    div.style.overflowX = "auto";
		    if (yFixed)
			    div.style.overflowY = "auto";
	    }
	    else {
		    if (xFixed || yFixed)
			  div.style.overflow = "auto";
	    }
	    // get div size after scrolling appending
      if (xFixed || yFixed)
        divCoords = getElementDimensions(div);
      // reset position of the scrolls (it could be scrolled from prev. using)
      div.scrollLeft = 0;
      div.scrollTop  = 0;
    }
  }

	// move box to the left of the hotspot if the distance to window border isn't
  // enough to accomodate the whole div box
  if (distanceToRightEdge < divCoords.width + margin) {
    left = (screenX + scrollX) - divCoords.width; // move menu to the left by its width and to the right by scroll value
    if (left - margin > 0)
      left -= margin;   // adjust for a scrollbar
    if (left < scrollX) // but not over the left edge
      left = scrollX + 1;
  }
  else { // apply user requested offset only if no adjustment
    if (offsetX)
      left = left + offsetX;
  }


		// now adjust vertically - so we fit inside the viewport
		if ((typeof positionEnforced == 'undefined' || positionEnforced == false) &&
					distanceToBottomEdge < divCoords.height + margin) {
			if (hotspot)
				top = findPosY(hotspot) - divCoords.height; // make vertical flip
			else
			top = (screenY + scrollY) - divCoords.height;
			if ((top - scrollY) - margin > 0) 
				top -= margin; // adjust for a scrollbar
			if (top < scrollY) // but not higher then top of viewport
				top = scrollY + 1;
		}
		else { // apply user requested offset only if no adjustment
			if (offsetY) 
				top = top + offsetY;
		}


	// no vertical scrollbar for Touch UI dialogs
	if (div.className == 'panel_block')
		divCoords.height = "";
	
// set div size!
////  div.style.width  = divCoords.width;
////  div.style.height = divCoords.height;

  if (Browser.lt_ie7) {
    // for listboxes in Dialog - makes iframe under a listbox.
    var par = getAncestorById(div, 'pane2');
    if(par && iframe.id == 'popupIframe') {
      par.appendChild(iframe);
    }
  }


  // Make position/size of the underlying iframe same as div's position/size
  var iframeLeft = left;
  var iframeTop = top;
  if(Browser.lt_ie7) {
    if (!isDivStatic  && !Browser.mobile) {
      istyle.width     = divCoords.width;
      istyle.height    = divCoords.height;
    }
    // to make dialog shadow visible (without iframe background).
    if(div.id == 'pane2') {
      var SHADOW_WIDTH = 11;
      var contentObj = getChildById(div, "dataEntry");
      if (contentObj == null)
        contentObj = getChildById(div, "resourceList");
      if (contentObj != null && !isDivStatic && contentObj.clientWidth > SHADOW_WIDTH) {
        istyle.width   = contentObj.clientWidth  - SHADOW_WIDTH + 'px';
        istyle.height  = contentObj.clientHeight - SHADOW_WIDTH + 'px';
      }
    }
  }

  div.style.display    = 'none';   // hide it before movement to calculated position
  reposition(div, left, top); // move the div to calculated position
  div.style.visibility = Popup.VISIBLE; // show div
	div.style.display    = 'inline';

  if (Browser.lt_ie7 && !isDivStatic  && !Browser.mobile) {
    istyle.display = 'none';
    istyle.visibility  = Popup.VISIBLE;
    reposition(iframe, iframeLeft, iframeTop); // place iframe under div
  }

	// used to handle key-arrows events
	if (div.id != "system_tooltip") {
		TouchDlgUtil.setCurrentDialog(div);
		ListBoxesHandler.setTray(div);
	}

}

function setDivInvisible(div, iframe) {
  // release a popup (menu) belongs to the hidding div
  if(typeof PopupHandler != 'undefined')
    PopupHandler.checkHidingDiv(div);

  if (div.style)
    div.style.display    = "none";
  if (iframe && iframe.style)
    iframe.style.display = "none";

  // return popupIframe to body from a dialog (see setDivVisible)
  var popupIframe = getChildById(div, 'popupIframe');
  if(popupIframe)
    document.body.appendChild(popupIframe);
}

function doConfirm(msg) {
  BrowserDialog.confirm(msg, doConfirmCallback);
}

function doConfirmCallback(c){
	if (!c)
    return;

  var loc = document.location.href;
	if (Browser.mobile) {
  	loc = Mobile.getCurrentUrl();
		var type = getUrlParam(loc, "type");
		if (!type) {
			var page = Mobile.getCurrentPageDiv();
			var filterUrl = getTextContent(getChildById(page, "filter_url_div"));
			type = getUrlParam(filterUrl, "type");
			loc += "&type=" + type;
		}
		
  }

  var idx = loc.lastIndexOf("-$action=");
  if (idx != -1) {
    idx1 = loc.indexOf("&", idx);
    if (idx1 != -1) {
      if (loc.charAt(idx - 1) == '?')
        loc = loc.substring(0, idx) + loc.substring(idx1 + 1);
      else
        loc = loc.substring(0, idx) + loc.substring(idx1);
    }
    else
      loc = loc.substring(0, idx);
  }
  idx = loc.indexOf("?");
  loc = "delete?-$action=deleteAndExplore&del-yes=y&" + loc.substring(idx + 1);
  
	if (Browser.mobile) {
		// in mobile, on delete of last in RL resource, the server returned "Empty List"
		// while resources of that type existed. It was fixed by removing of "recNmb" parameter.
		loc = loc.replace(/&recNmb=[0-9]*/, ""); 
  	Mobile.getPage(null, loc, false);
		return;
  }
	
	idx = loc.indexOf("&errMsg=");
  if (idx == -1) {
    idx = loc.indexOf("?errMsg=");
    idx++;
  }

  var idx1 = loc.indexOf("&", idx + 7);
  if (idx1 == -1)
    loc = loc.substring(0, idx)
  else
    loc = loc.substring(0, idx) + loc.substring(idx1);
  
	document.location.replace(loc);
  return;
}

/*
 * Creates absolute URI from base + uri. Fixing IE ignoring of base tag uri
 */
function rel(uri) {
  if (Browser.ie) {
    var b = document.getElementsByTagName('base');
    if (b  &&  b[0]  &&  b[0].href) {
      if (b[0].href.substr(b[0].href.length-1) == '/' && uri.charAt(0) == '/')
        uri = uri.substr(1);
      uri = b[0].href + uri;
    }
  }
  document.location.href = uri;
}
function setKeyboardFocus(element) {
  element.internalFocus = true;
  try {
    if (element.focus)
      element.focus();
  }
  catch (e) {
  }
}


// ****************************** form operations from forms.js
// *****************************************
//
//
var textAreas = new Array();
function FormField(fieldRef, isModified) {
  this.fieldRef = fieldRef;
  this.isModified = isModified;
  this.modifiedByUser = true;
}

function clearUnModifiedFields(formFields) {
  for (var i = 0; i < formFields.length; i++) {
    if (formFields[i].isModified == false) {
      formFields[i].fieldRef.value = '';
    }
  }
}

function onFormFieldClick(fieldProp, fieldRef) {
  fieldProp.modifiedByUser = true;
  if (fieldProp.isModified == true)
    return;
  fieldRef.select();
}

function onFormFieldChange(fieldProp, fieldRef, oldValue) {
  if (fieldProp.modifiedByUser == false)
    return;
  fieldProp.isModified = true;
  newValue = fieldRef.value;
  if (newValue != null && newValue != '')
    newValue = trim(newValue);
  if (newValue == null || newValue == '') {
    fieldRef.value = oldValue;
    fieldProp.isModified = false;
    fieldProp.modifiedByUser = false;
  }
}

// DesktopSearchField
var DesktopSearchField = {
	 field : null,
	 arrowDiv : null,
   isFilterOpened : false,
   
	 _init : function(field, arrowDiv) {
    this.field = field;
		this.arrowDiv = arrowDiv;
    addEvent(document.body, "click", this.onBlur, true);
  },
	
	submit : function(event, sendBtn) {
		var form = getAncestorByTagName(sendBtn, 'form');
		var input = getChildByClassName(form, "ftsq");
		if (FieldsWithEmptyValue.isEmptyValue(input)) {
			alert("Enter search criteria"); // works for icon, not <enter>
			return;
		}
		form.submit();
	},
	
  onFilterArrowClick : function(event, arrowDiv) {
		var field = getPreviousSibling(arrowDiv.parentNode);

		if (this.field == null)
			this._init(field, arrowDiv);
	
		if (this.isFilterOpened) {
			Filter.hide();
			// note: Filter.hide() calls this.invertArrowState
		}
		else {
			var x = findPosX(field);
			var y = findPosY(field) + field.offsetHeight + 5;
			Filter.show(x, y, event, arrowDiv);
			this.invertArrowState();
		}
		
		stopEventPropagation(event);
  },
	
	// closes filter on click outside the filter
	onBlur : function(event) {
    var $t = DesktopSearchField;

    if ($t.field == null)
      return;
    
		if (!$t.isFilterOpened)
			return;
		  
    if (event) {
      var target = getEventTarget(event);
			// click inside the search field
			if (comparePosition($t.field.parentNode, target) == 20)
				return;
 
      // click inside the filter  
      if (getAncestorById(target, "common_filter") != null) {
				return;
			}
    }
		
    Filter.hide();
	},
	
	onFilterHide : function() { // used on ESC
		if (!this.isFilterOpened)
			return;
			
		this.invertArrowState();
		this.isFilterOpened = false;
	},
	
	invertArrowState : function() {
		if (this.isFilterOpened)
			this.arrowDiv.innerHTML = "&#9660;";
		else
			this.arrowDiv.innerHTML = "&#9650;";
		
		this.isFilterOpened = !this.isFilterOpened;
	}
	
}

// FtsAutocomplete - full text search autocomplete 
var FtsAutocomplete = {
	AUTOCOMPLETE_ID : "auto_complete",
	TIMEOUT : Popup.autoCompleteDefaultTimeout,
	field : null,
	timerId : null,
	autocompleteDiv : null,
	
	prevText : "",
	wasVerticalKeyPressed : false,
	selectedClassCell : null,
	
	// init called from FieldsWithEmptyVAlues
	init : function(field) {
		addEvent(field, "keyup", this.onkeyup, false);
		addEvent(field, "keydown", this.onkeydown, false); // process arrow keys		
		this.field = field; 
	},
	
	search : function(e, field) {
		var form = getAncestorByTagName(field, 'form')
		if (Browser.mobile) {
			var url = FormProcessor.onSubmitProcess(e, form);
			this.hide();
			Filter.hide();
			Mobile.getPage(e, url);
		}
		else
			form.submit();
	},
	
	onkeyup : function(e) {
		var $t = FtsAutocomplete;
		var code = getKeyCode(e);
		if (code == 27) { // esc
			$t.hide();
			return;
		}
		if (code < 40 && code != 8)
			return; // skip not symbol keys except backspace and delete
		
		if ($t.timerId)
			clearTimeout($t.timerId);
		
		$t.timerId = setTimeout(FtsAutocomplete.onAutocomplete, $t.TIMEOUT);
	},
	
	onkeydown : function(e) {
		var $t = FtsAutocomplete;
		
		if ($t.autocompleteDiv == null)
			$t._createDiv();
		
		var code = getKeyCode(e);
		if (code == 40 || code == 38) { // down and up
			if ($t.selectedClassCell) {
		  	$t.selectedClassCell.className = "";
				$t.selectedClassCell = null;
		  }
			TouchDlgUtil.arrowsHandler(e);
			$t.wasVerticalKeyPressed = true;
		}
		
		var greyTr = TouchDlgUtil.getGreyTr();
		if (!greyTr)
			return;
		var hasText = FieldsWithEmptyValue.getValue($t.field).length != 0;
		if ((code == 39 || code == 37) && $t.wasVerticalKeyPressed) {
			if (!$t.selectedClassCell) {
				var selectedCell = getChildByClassName(greyTr, "table");
				var classesTbl = getChildByTagName(greyTr, "table");
				$t.selectedClassCell = (code == 39) ? getFirstChild(classesTbl.rows[0]) : getLastChild(classesTbl.rows[0]);
				$t.selectedClassCell.className = "selected";
				return;
	  	}
			$t.selectedClassCell.className = "";
			$t.selectedClassCell = (code == 39) ? getNextSibling($t.selectedClassCell) : getPreviousSibling($t.selectedClassCell);
			
			if ($t.selectedClassCell)
				$t.selectedClassCell.className = "selected";
		}
		else if (code == 13 && isVisible($t.autocompleteDiv)) { // enter
			var shingle = getChildByClassName(greyTr, "menuItem");
			$t.onSelection(e, shingle);
		}
	},
	
	onAutocomplete: function() {
		var $t = FtsAutocomplete;

		var form = getAncestorByTagName($t.field, 'form');
		var text = FieldsWithEmptyValue.getValue($t.field);
		if ($t.prevText == text) {
			$t.autocompleteDiv.style.display = "";
			return;
		}
	
		$t.prevText = text;
	
		if (text.length == 0) {
			$t.hide();
			return;
		}
		
		var params = FormProcessor.getFormFilters(form, true, null, true);
		params += "&-ac=y";

		postRequest(null, "smartPopup", params, null, null, $t.autocompleteCallback);
	},
	
	autocompleteCallback : function(e, contentTr, hotspot, content, url) {
		var $t = FtsAutocomplete;

		if ($t.autocompleteDiv == null)
			$t._createDiv();

		if (!content || content.length == 0 || content.indexOf("not_found") != -1) 
			$t.autocompleteDiv.style.display = "none";
		else {
			TouchDlgUtil.closeAllDialogs(true);
			$t.autocompleteDiv.innerHTML = content;
			TouchDlgUtil.init($t.autocompleteDiv);
			$t.autocompleteDiv.style.display = "";
			TouchDlgUtil.setCurrentDialog($t.autocompleteDiv);
		}
	},
	
	_createDiv : function() {
		var $t = FtsAutocomplete;
		if ($t.autocompleteDiv != null)
			return; 
		
		$t.autocompleteDiv = document.createElement("div");
		$t.autocompleteDiv.id = $t.AUTOCOMPLETE_ID;
		$t.autocompleteDiv.style.display = "none";
		addEvent($t.autocompleteDiv, "mousedown", $t.onmousedown, false);
		addEvent($t.autocompleteDiv, "click", $t.onclick, false);	

		if (Browser.mobile) {
			//$t.autocompleteDiv.style.zIndex = Mobile.getCurrentPageDiv().style.zIndex + 1;
			var header = getAncestorByClassName($t.field, "header");
			$t.autocompleteDiv.style.top = header.clientHeight;
			$t.autocompleteDiv.style.left = 0;
			$t.autocompleteDiv.style.width = "100%";
			// instead to make all parent elements with height 100%
			//$t.autocompleteDiv.style.height = getWindowSize()[1];
		}
		else {
			$t.autocompleteDiv.className = "dsk_auto_complete";
			$t.autocompleteDiv.style.top = findPosY($t.field) + $t.field.offsetHeight + 7;
			$t.autocompleteDiv.style.left = findPosX($t.field);
		}
		
		document.body.appendChild($t.autocompleteDiv);
	},
	
	onmousedown : function(e) {
		var $t = FtsAutocomplete;
		var target = getEventTarget(e);
		var shingle = getAncestorByClassName(target, "menuItem");
		if (!shingle)
			return;
		shingle.className = shingle.className + " blue_highlighting";
	},
	
	onclick : function(e) {
		var $t = FtsAutocomplete;
		var target = getEventTarget(e);
		
		if (target.parentNode.tagName.toLowerCase() == "a") {
			$t.hide();
			return true;
		}

		var shingle = getAncestorByClassName(target, "menuItem");
		$t.onSelection(e, shingle);
	},
	// slection by click or Enter
	onSelection : function(e, shingle) {
		if (!shingle)
			return;

		this.hide();
		shingle.className = shingle.className.replace("blue_highlighting", "");
		// set text in FTS
		var textDiv = shingle.getElementsByTagName("div")[0];
		var text = textDiv.innerHTML;
		FieldsWithEmptyValue.setValue(this.field, text);
		
		// class selection
		if (this.selectedClassCell) {
			var a = getChildByTagName(this.selectedClassCell, "a");
			window.location.assign(a.href);
			stopEventPropagation(e);
		}
		else
		this.search(e, this.field);
	},
	onCrossIcon : function(icon) {
		this.hide();
		this.prevText = "";
		FieldsWithEmptyValue.onClickClearTextCtrl(icon, null);
	},
	hide : function() {
		if (!this.autocompleteDiv)
			return;

		this.autocompleteDiv.style.display = "none";
	}
}

// like "search" fields
// sets parameter "is_empty_value = y"
var FieldsWithEmptyValue = {
  emptyValuesArr : new Array(),
  fieldForDelayedAction : null, 
	
  // field is id or DOM object
  initField : function(field, emptyValue, forceInit) {
		if (!field)
      return;

	  var fieldId;

    // field parameter is id
    if (typeof field == 'string') {
      fieldId = field;
      field = document.getElementById(fieldId);
      if (!field)
        return;
    }

		if (getElementStyle(field).display == "none")
			return; // hidden field does not require to be handled

		if (forceInit) {
			field.removeAttribute("is_empty_value");
		}
	
    // already initialized
    if (field.getAttribute("is_empty_value") != null)
      return;
    
    this.emptyValuesArr[this.getKeyOfField(field)] = emptyValue; 
		
    addEvent(field, "click", this.onclick, false);
    addEvent(field, "keydown", this.onkeydown, false);
    addEvent(field, "blur", this.onblur, false);
		
		if (this.hasClearTextCtrl(field))
			addEvent(field, "keyup", this.onkeyup, false);

		// init FTS autocomplete
		if (field.id == "-q")
			FtsAutocomplete.init(field);

		if (field.value.length == 0 || field.value == emptyValue)
  		this.setEmpty(field);
  },
  
	setFocus : function(field, delayed, enforceFocus) { // just re-opened dialog requires timeout
		if (!enforceFocus && field.getAttribute("readonly"))
			return;
		this.fieldForDelayedAction = field;
		if (this.isEmptyValue(field)) {
			field.className = field.className.replace("empty_field", "focused_field");
			setCaretPosition(field, 0);
		}
		if (delayed)
			setTimeout(FieldsWithEmptyValue._setFocusDelayed, 200);
		else
			field.focus();	
	},
	// dialog shown from "cache" dose not allow immediate focus() set.
	_setFocusDelayed : function() { 
		var $t = FieldsWithEmptyValue;
		if (!$t.fieldForDelayedAction)
			return;
		$t.fieldForDelayedAction.focus();
		$t.fieldForDelayedAction = null;
	},
	
	// returns false if field is "plain"
	hasEmptyValue : function(field) {
		var isEmptyValue = field.getAttribute("is_empty_value");
   	if (isEmptyValue == null) // not field of "FieldsWithEmptyValue" kind
			return false;
			
    return true;
	},
	// returns
	// true if currently set empty value; null if field does not have empty value
	isEmptyValue : function(field) {
		var isEmptyValue = field.getAttribute("is_empty_value");
   	if (isEmptyValue == null) // not field of "FieldsWithEmptyValue" kind
			return null;
			
    return (isEmptyValue == "y") ? true : false;
	},
	
	getValue : function(field) {
		var isEmptyValue = field.getAttribute("is_empty_value");
   	if (isEmptyValue == null) // not field of "FieldsWithEmptyValue" kind
			return field.value;
			
    if (isEmptyValue == "y")
			return "";
		return field.value;
	},
	
	// note it is safe to set value for "regular" field thru setValue
	setValue : function(field, value) {
		if (value.length != 0) {
			this.setReady(field);
			field.value = value;
		}
		else
			this.setEmpty(field);
		this.updateClearControl(field);
	},
	
	setEmpty : function(field, onClearIcon) {
		if (!field)
			return;

		if (typeof this.emptyValuesArr[this.getKeyOfField(field)] == 'undefined') {
			field.value = "";
			return false;
		}

		var attrib = field.getAttribute("is_empty_value");
		var isEmpty = (attrib != null && attrib == "y");
		
		var curClassName = field.className;
		if (TouchDlgUtil.isFieldBlueHighlight(field) == false)
			if (curClassName.indexOf("focused_field") == -1) {
				if (onClearIcon)
					//field.className += (field.className.length == 0) ? "focused_field" : " focused_field";
					appendClassName(field, "focused_field")
				else if (field.className.indexOf("empty_field") == -1)	
	  			//field.className += " empty_field";
					appendClassName(field, "empty_field")
			  }
			  else 
			  	field.className = curClassName.replace("focused_field", "empty_field");
		
		if (isEmpty)
			return;
		
		field.style.fontWeight = "bold";
		field.setAttribute("is_empty_value", "y");
		field.value = this.emptyValuesArr[this.getKeyOfField(field)];
		
		this.updateClearControl(field);
	},
	
	setReady : function(field) {
		var attrib = field.getAttribute("is_empty_value");
		var isEmpty = (attrib != null && attrib == "y");
		
		if (!isEmpty)
			return;

		field.value = "";

		//if (TouchDlgUtil.isFieldBlueHighlight(field) == false)
			field.className = field.className.replace(/focused_field|empty_field/, "");
    field.style.fontWeight = "";
		field.setAttribute("is_empty_value", "n");
	},
	
	fitColor : function(field) {
		var attrib = field.getAttribute("is_empty_value");
		if (attrib == null) {
			field.style.color = "";
			return false;
		}
			
		var isEmpty = (attrib == "y");
		if (isEmpty)
			field.className = field.className.replace("focused_field", "empty_field");
		else
			field.className = field.className.replace(/empty_field|focused_field/, "");
	},
	
	getKeyOfField : function(field) {
		var key = field.id;
		
		// "text_entry" field has variable name in accordance to current parameter
		if (field.className != "iphone_field" && field.name.length > 0) {
			key += field.name; // use name because form field are different by name
		}
		return key;
	},
	
	onclick : function(event) {
		var $t = FieldsWithEmptyValue;
		var field = getEventTarget(event);
		if (field.getAttribute("readonly") != null)
			return;
		if ($t.isEmptyValue(field)) {
			field.className = field.className.replace("empty_field", "focused_field");
			setCaretPosition(field, 0);
		}
	},
	
	onkeydown : function(event) {
		var $t = FieldsWithEmptyValue;
		var field = getEventTarget(event);
		var code = getKeyCode(event);
		$t.setReady(field); 
  },
  
	onblur : function(event) {
		FieldsWithEmptyValue.fieldForDelayedAction = getEventTarget(event);
		// do blur handling with delay to process fill out thru options list
		setTimeout("FieldsWithEmptyValue._onBlurDelayed()", 200);
	},
	
  _onBlurDelayed : function() {
		var $t = FieldsWithEmptyValue;
		if (!$t.fieldForDelayedAction)
			return;
		
		var field = $t.fieldForDelayedAction;
		var value = $t.getValue(field);
	
		if (value.length == 0)
    	$t.setEmpty(field);
		else { // it happened when a field with empty value filled out from options list.
			var key = $t.getKeyOfField(field);
			if (field.value != $t.emptyValuesArr[key]) {
				if (TouchDlgUtil.isFieldBlueHighlight(field) == false)
					field.className = field.className.replace(/focused_field|empty_field/, "");
    		field.style.fontWeight = "";
				field.setAttribute("is_empty_value", "n");
			}
		}	
		$t.fieldForDelayedAction = null;
  },
	
	// only for fields with clear text contol
	onkeyup : function(event) {
		var $t = FieldsWithEmptyValue;
		var field = getEventTarget(event);
		$t.updateClearControl(field);
	},
	updateClearControl : function(field) {
		var $t = FieldsWithEmptyValue;
		if (!$t.hasClearTextCtrl(field))
			return;
		var clearImg = getPreviousSibling(field);
		var value = $t.getValue(field);
		clearImg.style.visibility = (value.length == 0) ? "hidden" : "visible";
	},
	// "cross" icon inside a field - clears text field content
	onClickClearTextCtrl : function (crossImg, callback) {
		var $t = FieldsWithEmptyValue;
		var field = crossImg.parentNode.parentNode.getElementsByTagName("input")[0];

		$t.setEmpty(field, true);
		setCaretPosition(field, 0);
		
		crossImg.style.visibility = "hidden";
	  // FF3 and higher has a problem while transform (CSS) sliding - hacked
		//if (!Browser.firefox3)
		this.setFocus(field);

	  if (callback)
		  callback(field);
	},
	
	// used to get input field on cross icon click
	getField : function(elem) {
		var parentTable = getAncestorByTagName(elem, "table");
		return parentTable.getElementsByTagName("input")[0];
	},
	
	hasClearTextCtrl : function(field) {
		var img = getPreviousSibling(field);
		if (!img)
			return false;
		
		if (img.src && img.src.indexOf("clear_text.png") == -1)
			return false;	
		
		return true;
	}
}

function hideShowDivOnClick(divId, imgId){
  div = document.getElementById(divId);
  img = document.getElementById(imgId);
  if (div.style.display == 'none') {
    div.style.display = 'block';
    img.style.display = 'none';
  }
}

/* used to show full text in a long text property, like Demand.description */
function displayFullText(div, moreDiv) {
  document.getElementById(div).style.overflow = 'visible';
  document.getElementById(div).style.display = 'inline';
  document.getElementById(moreDiv).style.display = 'none';
}
function setTextHeight(div, divider) {
  if (window.screen) {
    var divRef = document.getElementById(div);
    var spanRef = document.getElementById(div + '_span');
    var moreRef = document.getElementById(div + '_more');
  }
  // If the height of the div content is less then 40px,
  // then the height of the div is set to the height of the div content and "more>>" link is disabled.
  if(divRef.offsetHeight < 40 && document.all) {
    document.getElementById(div).style.height=divRef.offsetHeight;
    return;
  }
  var h = Math.floor(screen.availHeight/divider);
  divRef.style.height = h;
  divRef.style.overflow = "hidden";
  if (spanRef != null && moreRef != null) {
    if (spanRef.offsetHeight > divRef.offsetHeight) {
      moreRef.style.display = "block";
    }
    else { // div must have "minimized view". Then the user clicks on "more>>"
            // link and the style of the div is changed
           // from (overflow:hidden) to (display:inline; overflow:visible).
            // This is done in (function displayFullText(div, moreDiv))
      // moreRef.style.display = "none";
      divRef.style.height = 4 * 1.33 + 'em'; // 4 rows //spanRef.offsetHeight;
      // divRef.style.overflow = "visible";
    }
  }
}
function setTextHeightAll(divider) {
  for (var i = 0; i < textAreas.length; i++) {
    if (textAreas[i] != null)
      setTextHeight(textAreas[i], divider);
  }
}
function textAreaExists(textAreaName) {
  for (var i = 0; i < textAreas.length; i++) {
    if (textAreas[i] != null && textAreaName == textAreas[i])
      return true;
  }
  return false;
}

/** *********************** Form fields adding/removing ****************** */
function addField(form, fieldType, fieldName, fieldValue) {
  if (document.getElementById) {
    var input = document.createElement('INPUT');
      if (document.all) { // what follows should work
                          // with NN6 but doesn't in M14
        input.type = fieldType;
        input.name = fieldName;
        input.value = fieldValue;
      }
      else if (document.getElementById) { // so here is the
                                          // NN6 workaround
        input.setAttribute('type', fieldType);
        input.setAttribute('name', fieldName);
        input.setAttribute('value', fieldValue);
      }
    form.appendChild(input);
  }
}
function getField (form, fieldName) {
  if (!document.all)
    return form[fieldName];
  else  // IE has a bug not adding dynamically created field
        // as named properties so we loop through the elements array
    for (var e = 0; e < form.elements.length; e++)
      if (form.elements[e].name == fieldName)
        return form.elements[e];
  return null;
}
function removeField (form, fieldName) {
  var field = getField (form, fieldName);
  if (field && !field.length)
    field.parentNode.removeChild(field);
}
function toggleField (form, fieldName, value) {
  var field = getField (form, fieldName);
  if (field)
    removeField (form, fieldName);
  else
    addField (form, 'hidden', fieldName, value);
}

function processCreditCardTracks(inputField) {
  var tracks = inputField.value;
  var form = inputField.form;

  var startIdx = tracks.indexOf('%B');
  if (startIdx == -1) {
    return;
  }
  var endIdx = tracks.indexOf('?>');
  if (endIdx == -1) {
    return;
  }
  tracks = tracks.substring(startIdx + 1, endIdx);

  var middleIdx = tracks.indexOf('?;');
  if (middleIdx == -1) {
    var track1 = tracks;
  } else {
    var track1 = tracks.substring(0, middleIdx);
    var track2 = tracks.substring(middleIdx + 2, tracks.length);
  }
  var splitArray = track1.split('^');
  var accountNumber = splitArray[0].substring(1);
  accountNumber = removeSpaces(accountNumber);
  var name = splitArray[1];
  var names = name.split('/');
  name = names[1] + ' ' + names[0];
  var yearMonth = splitArray[2];
  var year = yearMonth.substring(0, 2);
  var month = yearMonth.substring(2, 4);
  form.elements['.nameOnCard'].value = name;
  form.elements['.number'].value = accountNumber;
  form.elements['expirationDate___Month'].selectedIndex = parseInt(month, 10);
  var years = form.elements['expirationDate___Year'];
  var len = years.length;
  for (var i=0; i<len; i++) {
    if (years.options[i].value.indexOf(year) == 2) {
      years.selectedIndex = i;
      break;
    }
  }
  form.elements['.track1'].value = track1;
  form.elements['.track2'].value = track2;
  form.elements['.cardholderVerificationCode'].value = "";
  return true;
}

function removeSpaces(str) {
  if (str.indexOf(' ') == -1)
    return str;
  var buf = "";
  for (var i = 0, l = str.length; i < l; i++) {
    var c = str.charAt(i);
    if (c == ' ')
      continue;
    buf += c;
  }
  return buf;
}

/*******************************************************************************
 * drag & drop engine
 * dragHandler implements: 1) getDragBlock 2) onStartDrag, 3) onDrag, 4) onStopDrag
 * DragEngine is not called in mobile mode
 ******************************************************************************/
var DragEngine = {

	dragBlock : null,
	dialogIframe : null, //IE: prevents dialog from underlaid <select>
	dragHandler : null,
  // offset of left and top edges relative to "caught point"
	offsetX: null, offsetY: null,
  dragapproved : 0,
  // dragable objects with the following className
 	classNameArr : ["dragable", "tabs", "tabs_current", "header"],

	initialize: function(){
		addEvent(document, 'mousedown', this.startDrag, false);
		addEvent(document, 'mouseup', this.stopDrag, false);
		addEvent(document, 'mousemove', this.drag, false);
		this.dialogIframe = document.getElementById('dialogIframe');
	},

	startDrag: function(e){
		var thisObj = DragEngine;
		var evtobj = e || window.event;
		var caughtObj = getEventTarget(e);
		var titleObj = null;

		// no D&D if mousedown in <input>
		if (caughtObj.tagName && caughtObj.tagName.toLowerCase() == "input")
			return;
		// no D&D if mousedown on "icon_btn" class
		var parent = caughtObj.parentNode;	
		if (parent && parent.className && parent.className.toLowerCase() == "icon_btn")
			return;

		if((titleObj =  getAncestorById(caughtObj, "titleBar")) == null &&
		    (titleObj =  getAncestorByAttribute(caughtObj, "className", thisObj.classNameArr)) == null )
		  return;
		
    // possible to define handler as Attribute in html
		var dragHandlerStr = titleObj.getAttribute("draghandler");
		// or by class name here
		if(dragHandlerStr == null || dragHandlerStr.length == 0) {
  	  if(titleObj.className == "tabs" || titleObj.className == "tabs_current") {
  	    thisObj.dragHandler = TabSwap;
  	    thisObj.dragBlock = thisObj.dragHandler.getDragBlock(titleObj, caughtObj);
  	  }
  	  else // dialog 'pane2' or panel_block
  	    thisObj.dragBlock = getParentDialog(titleObj);
		}
		else {
  	  thisObj.dragHandler = eval(dragHandlerStr);
		  if(thisObj.dragHandler)
		    thisObj.dragBlock = thisObj.dragHandler.getDragBlock(titleObj, caughtObj);
		}

		if(!thisObj.dragBlock)
		  return;

		// warning: IE sends 2 events
		if(thisObj.dragHandler && thisObj.dragHandler.onStartDrag)
		  thisObj.dragHandler.onStartDrag(thisObj.dragBlock);

		if (evtobj.preventDefault)
			evtobj.preventDefault();

	  thisObj.dragapproved = 1;
	},

	drag: function(e){
  	var thisObj = DragEngine;

	  if(thisObj.dragapproved != 1)
	    return;

		var evtobj = window.event ? window.event : e;
		
		var scrollXY = getScrollXY();

		// FF3(!)/FF2 onmousedown returns wrong coordinates
		if (thisObj.offsetX == null) {
      thisObj.offsetX = evtobj.clientX - findPosX(thisObj.dragBlock) + scrollXY[0];
      thisObj.offsetY = evtobj.clientY - findPosY(thisObj.dragBlock) + scrollXY[1];
    }

		var x = evtobj.clientX - thisObj.offsetX + scrollXY[0];
		var y = evtobj.clientY - thisObj.offsetY + scrollXY[1];

		var allowToMove; // 2D array
		if(thisObj.dragBlock && thisObj.dragHandler && thisObj.dragHandler.onDrag) {
		    if(thisObj.dragBlock.style.position == 'absolute')
  		    allowToMove = thisObj.dragHandler.onDrag(thisObj.dragBlock, x, y);
		    else
  	      allowToMove = thisObj.dragHandler.onDrag(thisObj.dragBlock, evtobj.clientX, evtobj.clientY);
  	}

		if(thisObj.dragapproved == 1){
			if(typeof allowToMove == 'undefined' || allowToMove[0] == true)
			  thisObj.dragBlock.style.left = x;
			if(typeof allowToMove == 'undefined' || allowToMove[1] == true)
			  thisObj.dragBlock.style.top  = y;

			if(thisObj.dialogIframe != null && thisObj.dragBlock.id == 'pane2' &&
			     thisObj.dialogIframe.style.visibility == 'visible') {
			  thisObj.dialogIframe.style.left = x;
 			  thisObj.dialogIframe.style.top = y;
			}

			return false;
		}
	},
	stopDrag: function(e) {
  	var thisObj = DragEngine;
  	if(thisObj.dragHandler && thisObj.dragHandler.onStopDrag) {
		  thisObj.dragHandler.onStopDrag(e, thisObj.dragBlock);
		  thisObj.dragHandler = null;
		}

		thisObj.dragapproved = 0;
		thisObj.offsetX = null;
		thisObj.offsetY = null;
	}
}
// initialize the drag & drop engine in addHandlers function

// ***********************************************************************************

/**
 * check the checkbox if property related to it has changed value (used in Watch
 * and Subscribe)
 *
 * The checkbox must be first checkbox in the same TR
 */
function setRelatedCheckbox(e) {
  e = getDocumentEvent(e); if (!e) return;
  var target = getTargetElement(e);
  var tr = getTrNode(target);
  if (!tr)
    return stopEventPropagation(e);

  var inputs = tr.getElementsByTagName('input');
  if (inputs && inputs.length != 0) {
    for (var i=0;  i <inputs.length; i++) {
      if (inputs[i].type.toLowerCase() == "checkbox")
        inputs[i].checked = false;
    }
  }
}

// ***************************************

/**
 * toogle booleans
 */

function addBooleanToggle(elem) {
  if (!elem)
    return;
  var elemId  = elem.id;
  if (!elemId) {
    return;
  }

  var elemLen = elemId.length;
  if (elemId.indexOf("_boolean",         elemLen - "_boolean".length) != -1  ||
      elemId.indexOf("_boolean_refresh", elemLen - "_boolean_refresh".length) != -1) {
    addEvent(elem, 'click', changeBoolean, false);
    elem.style.cursor = 'pointer';
  }
}


function getAnchorForTarget(e) {
  var target = getEventTarget(e);
  if (target.tagName.toUpperCase() == 'A')
    return target;
  var anchors = target.getElementsByTagName('a');
  if (anchors && anchors[0])
    return anchors[0];

  return getANode(target);
}

/*******************************************************************
* Change boolean value (in non-edit mode)
********************************************************************/
function changeBoolean(e, target) {
  var url = 'proppatch';
  var params = 'submitUpdate=Submit+changes&User_Agent_UI=n&uri=';
  var bIdx = target.id.indexOf("_boolean");
  var rUri = target.id.substring(0, bIdx);
  var idx = rUri.lastIndexOf("_");
  var propShort = rUri.substring(idx + 1);
  rUri = rUri.substring(0, idx);
  var bUri = null;
  idx = rUri.indexOf(".$.");
  var isCurrentItem;
  if (idx != -1) {
    bUri = rUri.substring(idx + 3);
    rUri = rUri.substring(0, idx);
    if (rUri == '$currentItem') {
      var a = document.getElementById("currentItem");
      if (a) {
        rUri = a.href;
        isCurrentItem =  true;
      }
    }
  }

  var pValue;
  if (isCurrentItem)
    pValue = "Yes";
  else {
    var nodes = target.childNodes;

    var node;
    for (var i=0; i<nodes.length  &&  !node; i++) {
      if (nodes[i].tagName  &&  nodes[i].tagName.toLowerCase() == 'img')
        node = nodes[i];
    }

		var yesIconName = target.getAttribute('yesIcon');
		var noIconName = target.getAttribute('noIcon');
		pValue = (node.src.indexOf(yesIconName) != -1) ? "No" : "Yes";
    if (node) {
      if (pValue == "Yes")
        node.src = yesIconName;
      else
        node.src = noIconName;
    }
		node.setAttribute('tooltip', pValue);
  }
	
  params += encodeURIComponent(rUri) + "&" + propShort + "=" + pValue;
  if (bUri != null)
    params += "&bUri=" + encodeURIComponent(bUri);

//   var listboxFrame = frames["popupFrame"];
//   popupFrameLoaded = false;

  if (document.location.href.indexOf('addLineItems.html') != -1) {
    var div = document.createElement('div');
    div.style.display = "none";
    postRequest(e, url, params + "&-addItems=y", div, target, cancelItemAndWait);
    return;
  }
  if (target.id.indexOf("_boolean_refresh") != -1) {
    var locationUrl = document.location.href;
    url +=  "?" + params + "&$returnUri=";
    var idx = locationUrl.indexOf("&errMsg=");
    if (idx == -1)
      url += encodeURIComponent(locationUrl);
    else {
      url += encodeURIComponent(locationUrl.substring(0, idx));
      idx = locationUrl.indexOf("&", idx + 1);
      if (idx != -1)
        url += encodeURIComponent(locationUrl.substring(idx));
    }
    document.location.replace(url);
		return;
  }
//  else
//    listboxFrame.location.replace(url + "?" + params); // load data from server
                                                        // into iframe
  postRequest(e, url, params, null, null);
		
  if (Popup.tooltipPopup) {
    Popup.tooltipPopup.close();
    Popup.tooltipPopup = null;
  }
  // tooltipMouseOut0(target); // remove and ...
  // tooltipMouseOver0(target); // repaint the tooltip on this boolean icon
  return stopEventPropagation(e);
}

if (!document.importNode) {
  document.importNode = function(oNode, bImportChildren) {
    var oNew;

    if(oNode.nodeType == 3) {
      oNew = document.createTextNode(oNode.nodeValue);
    }
    else {
      oNew = document.createElement(oNode.nodeName);
      for(var i = 0; i < oNode.attributes.length; i++) {
        if (oNode.attributes[i].name != 'style')
          oNew.setAttribute(oNode.attributes[i].name, oNode.attributes[i].value);
      }
      if (oNode.style.cssText) {
        //alert(oNode.style.cssText);
        oNew.setAttribute('style', oNode.style.cssText);
      }
    }

    if (bImportChildren && oNode.hasChildNodes()) {
      for (var oChild = oNode.firstChild; oChild; oChild = oChild.nextSibling) {
        oNew.appendChild(document.importNode(oChild, true));
      }
    }

    return oNew;
  }
}

function cloneNode(oNode) {
  var oNew;

  if(oNode.nodeType == 3) {
    oNew = document.createTextNode(oNode.nodeValue);
  }
  else {
    oNew = document.createElement(oNode.nodeName);
    if (oNode.nodeName == 'form') {
      oNew.innerHTML = oNode.innerHTML;
      return;
    }
    for(var i = 0; i < oNode.attributes.length; i++) {
      var aName = oNode.attributes[i].name;

      if (oNode.nodeName == 'form') {
        if (aName == 'action') {
          oNew.action = oNode.action;
          continue;
        }
        if (aName == 'method') {
          oNew.method = oNode.method;
          continue;
        }
      }

      if (aName != 'style') {
        oNew.setAttribute(aName, oNode.attributes[i].value);
      }
    }
    oNew.setAttribute('style', oNode.style.cssText);
  }

  if (oNode.hasChildNodes()) {
    for (var oChild = oNode.firstChild; oChild; oChild = oChild.nextSibling) {
//      Boost.log('cloneNode: found child node:  ' + oChild.tagName);
      var next = cloneNode(oChild);
      oNew.appendChild(next);
    }
  }

  return oNew;
}

function submitUpdate(formName) {
  var f = document.forms[formName];
  if(RteEngine)
    RteEngine.putRteDataOfForm(f);
  f.elements['submitUpdate'].value = 'Submit changes';
  f.submit();
  return false;
}

function getTopDivForTab(e, divId) {
  var target = getTargetElement(e);
  var pDiv;
  while (true) {
    pDiv = getDivNode(target)
    if (pDiv.id  &&  (pDiv.id == 'pane2' || pDiv.id == 'corePageContent'))
      break;
    else
      target = getDivNode(pDiv.parentNode);
  }
  var divs = pDiv.getElementsByTagName('div');
  for (var i=0; i<divs.length; i++) {
    var d = divs[i];
    if (d.id  &&  d.id == divId)
      return d;
  }
  return;
}

/**
 * clone data object
 */
function clone (o, deep) {
  var objectClone = new Object();
  for (var property in o) {
    var value = o[property];
    if (typeof value == 'function') { // skip functions
      continue;
    }
    if (!deep)
      objectClone[property] = value;
    else if (typeof value == 'object')
      objectClone[property] = clone(value, deep);
    else
      objectClone[property] = value;
  }
  return objectClone;
}

function setCssStyle(elem, newStyle) {
  if ( typeof( elem.style.cssText ) != 'undefined' )
    elem.style.cssText = newStyle;
  else
    elem.setAttribute('style', newStyle);
}

// auxiliary "class":
// 1) for phone - need catch event of document if arrow kes were pressed
// 2) closes dialogs for PC and phone
var closingOnEsc = {
  div : null,
  initialized : false,
  init : function() {
    addEvent(document, 'keydown', this._onkeydown,  false);
    this.initialized = true;
  },
  ready : function(div) {
    this.div = div;
    if(this.initialized == false)
      this.init();
    // append handlers to textarea and inputs - to close on "esc" inside there
    if(div.id == 'pane2') {
      inputs = div.getElementsByTagName('input');
      for(var i = 0; i < inputs.length; i++) {
        if(inputs[i].className == 'input') {// GUI inputs
          addEvent(inputs[i], 'keydown', this._onkeydown,  false);
        }
      }
      var tAreas = div.getElementsByTagName('textarea');
      for(var i = 0; i < tAreas.length; i++)
          addEvent(tAreas[i], 'keydown', this._onkeydown,  false);
    }
  },
  _onkeydown : function(e) {
    e = e || event;
    var div = closingOnEsc.div;
    if(div == null || div.style.visibility == 'hidden')
      return;
   	var charCode = (e.charCode) ? e.charCode : ((e.keyCode) ? e.keyCode : ((e.which) ? e.which : 0));
		if(Browser.s60Browser) {
		  if(charCode != 8)
		    return;
		}
		else if(charCode != 27)
		  return;
    // 1. dialog
    if(div.id == 'pane2')
      PlainDlg.hide(e);
    // 2. popup
    else if(div.className == 'popMenu') {
      Popup.close0(div.id)
   }

    div = null;
    stopEventPropagation(e);
    return false;
  }
}

function addSpellcheck() {
  var ua = navigator.userAgent.toLowerCase();
	var isGecko = (ua.indexOf("gecko") != -1);
  if(!isGecko)
    return;
  document.body.spellcheck = true;
}
/**********************************************************
* ImageAnnotations utilizes PhotoNotes.
***********************************************************/
var ImageAnnotations = {
  notesEngine : null,
  container : null,
  addNoteBtn : null,
  imgUrl : "",
  _isEditMode : false,
  initialized : false,
  // initial function
  init : function(imgUrl, notesDataArr) {
    this.container = document.getElementById('PhotoContainer');
    if(!this.container)
      return;

    this.imgUrl = imgUrl;
    if(this.notesEngine == null) {
      if(typeof PhotoNoteContainer == 'undefined')
        return;
      this.notesEngine = new PhotoNoteContainer(this.container);
    }

    this.addNoteBtn = getChildById(this.container, 'add_note');

    if(typeof notesDataArr != 'undefined' && notesDataArr != null) {
      // append stored notes
      for(var i = 0; i < notesDataArr.length; i++)
        this.addNote(notesDataArr[i]);
     }
     this.initialized = true;
  },

  addNote : function(noteData) {
    if(!noteData) {
      noteData = {left:10, top:10, width:50, height:50, text:"note",resId:null};
    }
    var size = new PhotoNoteRect(noteData.left , noteData.top, noteData.width, noteData.height);
    var note = new PhotoNote(noteData.text, 1, size);

    // unique ID of annotation resource
    note.resId = noteData.resId;
    note.onsave = this.onsave;
    note.ondelete = this.ondelete;

    this.notesEngine.AddNote(note);
    //note.SetEditable(true);
    note.DisableNote();
  },
  onTabSelection : function(selectedDiv) {
    if(ImageAnnotations.initialized == false)
      return;

    if(selectedDiv.id == "div_Edit")
      ImageAnnotations.setEditMode(true);
    else
      ImageAnnotations.setEditMode(false);
  },

  setEditMode : function(isEditMode) {
    this._isEditMode = isEditMode;
    if(isEditMode) {
      this.addNoteBtn.style.visibility = "visible";
    }
    else {
      this.addNoteBtn.style.visibility = "hidden";
      this.notesEngine.switchToViewMode();
    }
  },

  onsave : function(note) {
    var url = ImageAnnotations.getServletUrl();
    var rect = note.rect;

    var parameters = "";
    var isNew = (typeof note.resId == 'undefined' || note.resId == null)
    if(isNew)
      parameters += "action=mkResource";
    else
      parameters += "action=update";

    parameters += "&imageUrl=" + encodeURIComponent(ImageAnnotations.imgUrl);
    parameters += "&left=" + rect.left + "&top=" + rect.top;
    parameters += "&width=" + rect.width + "&height=" + rect.height;
    parameters += "&text=" + note.text;
    if(!isNew)
      parameters += "&resId=" + note.resId;

    postRequest(null, url, parameters, null, null, ImageAnnotations.onsaveCallback);
    return 1;
  },
  // a1, a2, a3 - parameters that are not used here
  onsaveCallback : function(a1, a2, a3, responseText) {
    //alert(responseText);
  },

  ondelete : function(note) {
    if(typeof note.resId == 'undefined' || note.resId == null) // not stored note
      return true;
    var url = ImageAnnotations.getServletUrl();
    var parameters = "action=delete";
    //parameters += "&imageUrl=" + ImageAnnotations.imgUrl;
    parameters += "&resId=" + note.resId;
    postRequest(null, url, parameters, null, null, ImageAnnotations.ondeleteCallback);
    return true;
  },

  ondeleteCallback : function(a1, a2, a3, responseText) {

  },

  getServletUrl : function () {
    var baseUriO = document.getElementsByTagName('base');
    var baseUri = "";
    if (baseUriO) {
      baseUri = baseUriO[0].href;
      if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
        baseUri += "/";
    }
    var url = baseUri + "imageAnnotation";

		return url;
	},

	isEditMode : function() {
	  return this._isEditMode;
	}
}
/*******************************************************
* dictionary handler
********************************************************/
var DictionaryHandler = {
  isDialogJustDisplayed : false,

  init : function() {
    addEvent(document, "mouseup", this._onmouseup, false);
    addEvent(document.body, "keyup", this._onkeyup, false);
  },
  // to handle the event if "Alt" key was pressed
  _onmouseup : function(e) {
    e = e || event;
    var $t = DictionaryHandler;
    if(e.altKey == false)
      return;
    var range;
    var selText = "";
    var hotspot = document.body;
    if (window.getSelection) { // FF, Opera, Safari
      var selection = window.getSelection();
      selText = selection.toString();
      range = selection.getRangeAt(0);
      hotspot = range.startContainer.parentNode;
    }
    else if (document.selection) { // IE
      if(document.selection.type != 'Text')
        return;
      range = document.selection.createRange();
      selText = range.text;
      hotspot = range.parentElement();
    }
    selText = trim(selText);
    if(selText != "") {
      var len = selText.length;
      if (selText.charAt(len - 1) == ')') {
        var idx = selText.lastIndexOf('(');
        if (idx != -1) {
          var s = selText.substring(idx + 1, len - 1);
          if (s == 's')
            selText = selText.substring(0, idx);
          else {
            try {
              var num = parseInt(s);
              if (!isNaN(num))
                selText = trim(selText.substring(0, idx));
            } catch (e) {
            }
          }
        }
      }
      $t.translate(e, hotspot, selText);
      $t.isDialogJustDisplayed = true;
    }
  },

  _onkeyup : function(e) {
    e = e || event;
    var $t = DictionaryHandler;
    if (e.keyCode == 18 && $t.isDialogJustDisplayed) // 18 - "Alt"
      stopEventPropagation(e);
    $t.isDialogJustDisplayed = false;
  },

  translate : function(e, hotspot, text) {
    var baseUriO = document.getElementsByTagName('base');
    var baseUri = "";
    if (baseUriO) {
      baseUri = baseUriO[0].href;
      if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
        baseUri += "/";
    }
		
    var url = encodeURI(baseUri + "mkResource.html")
					 + "?$browser=y"
           + "&displayProps=yes"
           + "&type=http://www.hudsonfog.com/voc/model/portal/Translation"
           + "&-inner=y"
           + "&.source=" + encodeURIComponent(text);

		DataEntry.show(e, url, hotspot);
  }
}
/*
var hideMenu;
function showMenu(e, divId) {
  e = getDocumentEvent(e);
  if (hideMenu) {
    var div = document.getElementById(divId);
    div.style.visibility = Popup.HIDDEN;
    div.style.display = "none";
    hideMenu = false;
  }
  else {
    div = document.getElementById(divId);
    div.style.visibility = Popup.VISIBLE;
    div.style.display = 'inline';
    hideMenu = true;
  }
  return stopEventPropagation(e);
}

function switchMenuMode(e, userUri) {
  e = getDocumentEvent(e);
  if (!e)
    return;
  var elm = getTargetElement(e);
  if (!elm)
    return;
  var uri = 'proppatch';
  var params = '-$action=showPropertiesForEdit&submitUpdate=y&uri=' + encodeURIComponent(userUri);
  if (elm.src.indexOf('showHideMenu.gif') != -1)
    params +='&.dashboardMode=false';
  else
    params +='&.dashboardMode=true';

  var div = document.getElementById('menuBar1');

  var ret = stopEventPropagation(e);
  var href = document.location.href;
  postRequest(e, uri, params, div, elm, menuCallback);
  function menuCallback(e) {
    document.location.href = href + '&-changeMenuMode=y';
  }
  return ret;
}
*/

/*******************************************************
* Dashboard
* (see WidgetRefresher too)
********************************************************/
var Dashboard = {
  MIN_COLUMN_WIDTH : 50,

  PH_BACK_COLOR : "#eee",
  PH_BORDER : "1px dashed #f00",
  DASHBOARD_ID : "dashboard",

  dragBlock : null,
  placeholderDiv : null,
  isDragMode : false,

  widgetsMap : null,
  freeSpacesMap : null,
  tabHeadersMap : null,

  targetTab : null,

  prevY : 0,
  prevX : 0,
  isDirUp : true,

  prevWidgetOld : null,
  isWidgetMoved : false,

  oldWidgetIdx : -1,

  // drag interface functions -----
  getDragBlock : function(dragHandleObj) {
    if(OperaWidget.isWidget()) // it means that we are not in our dashboard.
      return null;

    var widgetDiv = getAncestorByAttribute(dragHandleObj, "className", "widget");
    if(widgetDiv && this.widgetsMap == null) {
      this.initDashboardMap(widgetDiv);
      addEvent(document, "keyup", this.onEsc, false);
    }

    return widgetDiv;
  },
  initDashboardMap : function(theWidget) {
    var dashboard = getAncestorById(theWidget, this.DASHBOARD_ID);
    // 1. widgets
    var divs = dashboard.getElementsByTagName("div");
    this.widgetsMap = new Array();
    for(var i = 0; i < divs.length; i++) {
      if(divs[i].className == "widget") {
        var widgetRect = new Dashboard.WidgetRect(divs[i]);
        this.widgetsMap.push(widgetRect);
      }
    }
    // 2. free spaces
    var cols = dashboard.rows[0].cells;
    this.freeSpacesMap = new Array();
    for(var i = 0; i < cols.length; i++) {
      var freeSpaceRect = new Dashboard.FreeSpaceRect(cols[i], this.widgetsMap);
      this.freeSpacesMap.push(freeSpaceRect);
      // set min column width on case if the column has no widgets.
      if(typeof cols[i].style.minWidth != 'undefined')
        cols[i].style.minWidth = this.MIN_COLUMN_WIDTH
      else
        cols[i].style.width = this.MIN_COLUMN_WIDTH;
    }
    // 3. tab "Header"
    // suppose that position of tab header is constant
    this.tabHeadersMap = new Array();
    var tables = document.body.getElementsByTagName('table');
    for(var i = 0; i < tables.length; i++) {
      if(tables[i].className == 'tabs') {
        var tabHeader = new Dashboard.TabHeaderRect(tables[i]);
        this.tabHeadersMap.push(tabHeader);
      }
    }
  },
  updateDashboardMap : function() {
    // 1. widgets
    for(var i = 0; i < this.widgetsMap.length; i++)
        this.widgetsMap[i].update();
    // 2. free spaces
    for(var i = 0; i < this.freeSpacesMap.length; i++)
        this.freeSpacesMap[i].update();
  },

  onStartDrag : function(dragBlock) {
    this.dragBlock = dragBlock;
    this.isDragMode = true;
    this.isWidgetMoved = false;
    this.oldWidgetIdx = this.getWidgetIndex(dragBlock);

    if(this.placeholderDiv == null)
      this.createPlaceholder();

    var width = dragBlock.offsetWidth;
    var height = dragBlock.offsetHeight;

    var phStyle = this.placeholderDiv.style;
    var dbStyle = dragBlock.style;

//    phStyle.width   = width;
    phStyle.height  = height;
    phStyle.display = "block";

    var x = findPosX(dragBlock);
    var y = findPosY(dragBlock);
    dbStyle.width = width;
    dbStyle.left  = x;
    dbStyle.top   = y;
    dbStyle.position = "absolute";

    this.prevWidgetOld = this.getPrevSibling(dragBlock);
    this.prevY = y;
    this.prevX = x;

    swapNodes(dragBlock, this.placeholderDiv);
  },
  onDrag : function(dragBlock, x, y) {
    if(this.isDragMode == false)
      return;

    // 1. preparing
    // 1.1 "cross-hair" point
    var chX = x + Math.ceil(dragBlock.offsetWidth / 2);
    var chY = y + 15;

    // 1.2
    this.isDirUp = this.detectDirection(y);
    // 1.3 get target widget under "cross-hair" point
    var targetWidget = this.detectTargetWidget(chX, chY, dragBlock.id);
    // 1.4 detect "free space" if targetWidget == null
    var targetFreespace = null;
    if(targetWidget == null)
      targetFreespace = this.detectTargetFreespace(chX, chY);

    // 2. move placeholder if need
    var moved = false;
    if(targetWidget) {
      var isSameColumn = Dashboard.areWidgetsInTheSameColumn(targetWidget, Dashboard.placeholderDiv);

      // 2.1 swap horizontal
      if(isSameColumn == false) {
        this.swapHorizontal(targetWidget);
        moved = true;
      }
      else if(this.needVerticalSwap(targetWidget)){
      // 2.2 swap vertical
        this.swapVertical(targetWidget);
        moved = true;
      }
    }
    // 2.3 free space
    else if(targetFreespace)
      this.setInFreeSpace(targetFreespace);

    if(moved)
      this.updateDashboardMap();

    // 3. over Tab
    this.targetTab = this.detectTargetTabHeader(chX, y);
    var phStyle =  this.placeholderDiv.style;
    if(this.targetTab) {
      if(phStyle.display == 'none') {
        for(var i = 0; i < this.tabHeadersMap.length; i++)
          this.tabHeadersMap[i].setBackgroundAndBorder("", "");
      }
      else {
        phStyle.display = 'none';
      }
      this.targetTab.setBackgroundAndBorder(this.PH_BACK_COLOR, this.PH_BORDER);
    } // 3.2 out without drop.
    else if(phStyle.display == 'none') {
      phStyle.display = '';
      for(var i = 0; i < this.tabHeadersMap.length; i++)
        this.tabHeadersMap[i].setBackgroundAndBorder("", "");
    }

    // check if widget was moved from the place
    if(Math.abs(this.prevX - x) > 2 || Math.abs(this.prevY - y) > 2)
      this.isWidgetMoved = true;
  },

  onStopDrag : function(e, dragBlock) {
    if(this.isDragMode == false)
      return;
    this.isDragMode = false;
    if(!dragBlock)
      return;

    this.compliteGuiDrag(dragBlock);

    // if widget was not moved then maximize it
    // not used now
    /*
    if(this.isWidgetMoved == false) {
      this.maximizeWidget(dragBlock);
        return;
    }
    */

    // 1. move on another tab
    if(this.targetTab) {
      this.targetTab.setBackgroundAndBorder("", "");
      this.onReleaseOverTab(e, dragBlock, this.targetTab.table);
    }

    // 2. move on other place in the current tab
    // 2.1 check if a widget was moved
    if (this.oldWidgetIdx == this.getWidgetIndex(dragBlock))
      return;
    // 2.2 store changed on server
    var prevWidgetNew = this.getPrevSibling(dragBlock);
    this.onWidgetMovement(e, dragBlock, this.prevWidgetOld, prevWidgetNew);
  },
  onMaximizeWidget : function(maxIconObj) {
    widgetDiv = getAncestorByAttribute(maxIconObj, "className", "widget");
    if (!widgetDiv) // on failed html
      widgetDiv = getAncestorByAttribute(maxIconObj, "className", "propertySheet");
    this.maximizeWidget(widgetDiv);
  },
  maximizeWidget : function(widgetDiv) {
    if (!widgetDiv)
      return;
    var maxLink = getChildById(widgetDiv, "w_maximize");
    if(!maxLink)
      return;
    window.location = maxLink.href;
  },
  compliteGuiDrag : function(dragBlock) {
    var dbStyle = dragBlock.style;

    this.placeholderDiv.style.display = "none";
    dbStyle.position = "";
    dbStyle.width = "100%";
    swapNodes(dragBlock, this.placeholderDiv);
    this.updateDashboardMap();
  },
  // stops drag action
  onEsc : function(evt) {
		evt = (evt) ? evt : event;
		var charCode = (evt.charCode) ? evt.charCode : ((evt.keyCode) ? evt.keyCode :
			((evt.which) ? evt.which : 0));
		if (charCode == 27) {
		  var thisObj = Dashboard;
		  thisObj.isDragMode = false;
			thisObj.compliteGuiDrag(thisObj.dragBlock);
		}
	},
  //--------------------------
  createPlaceholder : function() {
    this.placeholderDiv = document.createElement("div");
    var phStyle = this.placeholderDiv.style;
    phStyle.display = "none";
    phStyle.width  = "100%";
    phStyle.margin = 0;
    phStyle.backgroundColor = this.PH_BACK_COLOR;
    phStyle.border = this.PH_BORDER;
    document.body.appendChild(this.placeholderDiv);
  },

  swapVertical : function(targetWidget) {
    swapNodes(targetWidget, Dashboard.placeholderDiv);
  },
  swapHorizontal : function(targetWidget) {
    var parent = targetWidget.parentNode;
    this.placeholderDiv.style.width = targetWidget.offsetWidth;
    parent.insertBefore(this.placeholderDiv, targetWidget);
  },
  setInFreeSpace : function(targetFreespace) {
    var colObj = targetFreespace.getColumn();
    colObj.appendChild(this.placeholderDiv);
  },

  needVerticalSwap : function(targetWidget) {
    var needSwap = false;
    var isWidgetUpper = this.isWidgetUpper(targetWidget);

    if(this.isDirUp == null)
      return false;
    if((isWidgetUpper && this.isDirUp) ||
      (!isWidgetUpper && !this.isDirUp)) {
        needSwap = true;
    }
    return needSwap;
  },

  detectDirection : function(y)  {
    var isDirUp = null;
    if(this.prevY > y)
      isDirUp = true;
    else if(this.prevY < y)
      isDirUp = false;

    this.prevY = y;
    return isDirUp;
  },
  detectTargetWidget : function(chX, chY, dragWidgetId) {
    var targetWidget = null;
    for(var i = 0; i < this.widgetsMap.length; i++) {
      var widgetId = this.widgetsMap[i].getWidgetId();
      if(widgetId != dragWidgetId &&
          this.isPointIn(chX, chY, this.widgetsMap[i])) {
        targetWidget = this.widgetsMap[i].getWidgetDiv();
      }
    }
    return targetWidget;
  },

  detectTargetFreespace : function(midX, midY) {
    var targetFreespace = null;
    for(var i = 0; i < this.freeSpacesMap.length; i++) {
      if(this.isPointIn(midX, midY, this.freeSpacesMap[i])) {
        targetFreespace = this.freeSpacesMap[i];
      }
    }
    return targetFreespace;
  },
  detectTargetTabHeader : function(midX, y) {
    var targetTabHeader = null;
    for(var i = 0; i < this.tabHeadersMap.length; i++) {
      if(this.isPointIn(midX, y, this.tabHeadersMap[i])) {
        targetTabHeader = this.tabHeadersMap[i];
      }
    }
    return targetTabHeader;
  },
  areWidgetsInTheSameColumn : function(widget1, widget2) {
    var parentTD_ID_1 = widget1.parentNode.id;
    var parentTD_ID_2 = widget2.parentNode.id;
    if(parentTD_ID_1 == parentTD_ID_2) {
      return true;
    }
    return false;
  },
  isPointIn : function(x, y, rect) {
    if(rect.left < x &&
      rect.right > x &&
      rect.top < y &&
      rect.bottom > y)
        return true;
      return false;
  },
  // relative to the placeholder
  isWidgetUpper : function(widget) {
    var prev = this.getPrevSibling(this.placeholderDiv); //.previousSibling;
   // while(prev && prev.nodeType != 1) // skip whitespaces
   //   prev = prev.previousSibling;

    if(prev && prev.id == widget.id) {
      return true;
    }
    return false;
  },
  // returns index in form <index of parent column><index of widget in the column> 
  getWidgetIndex : function(widget) {
    var parentTd = widget.parentNode;
    var colIdx = parentTd.id.substring('col_'.length);
    var divs = parentTd.getElementsByTagName("div");
    var idx = 0;
    for (var i = 0; i < divs.length; i++) {
      if (divs[i].className == "widget") {
        if (widget.id == divs[i].id) {
          return (colIdx * 10 + (idx + 1));
        }
        idx++;
      }
    }
    return -1;
  },
  getPrevSibling : function(widgetDiv) {
    var prev = widgetDiv.previousSibling;
    while(prev && prev.nodeType != 1) // skip whitespaces
      prev = prev.previousSibling;

    return prev;
  },
  // WidgetRect subclass --
  WidgetRect : function(widgetDiv) {
    this.widgetDiv = widgetDiv;
    this.left;
    this.top;
    this.right;
    this.bottom;

    this.update = function() {
      this.left   = findPosX(this.widgetDiv);
      this.top    = findPosY(this.widgetDiv);
      this.right  = this.widgetDiv.offsetWidth + this.left;
      this.bottom = this.widgetDiv.offsetHeight + this.top;
    }
    this.getWidgetDiv = function() {
      return this.widgetDiv;
    }
    this.getWidgetId = function() {
      return this.widgetDiv.id;
    }
    this.getColumnId = function() {
      return this.widgetDiv.parentNode.id;
    }
    // "constructor"
    this.update();
  },

  FreeSpaceRect : function(column, widgetsMap) {
    this.column     = column;
    this.widgetsMap = widgetsMap;
    this.left = 0;
    this.top = 0;
    this.right = 0;
    this.bottom = 0;

    this.update = function() {
      // 1. whole column
      this.left   = findPosX(this.column);
      this.top    = findPosY(this.column);
      this.right  = this.column.offsetWidth + this.left;
      this.bottom = this.column.offsetHeight + this.top;
      // 2. exclude children's widgets
      for(var i = 0; i < this.widgetsMap.length; i++) {
        if(this.column.id == this.widgetsMap[i].getColumnId()) {
          this.top = Math.max(this.top, widgetsMap[i].bottom);
        }
      }
    },
    this.getColumn = function() {
      return this.column;
    }
    // "constructor"
    this.update();
  },
  TabHeaderRect : function(table) {
    this.table = table;
    this.left = 0;
    this.top = 0;
    this.right = 0;
    this.bottom = 0;

    this.init = function() {
      this.left   = findPosX(this.table);
      this.top    = findPosY(this.table);
      this.right  = this.table.offsetWidth  + this.left;
      this.bottom = this.table.offsetHeight + this.top;
    }
    this.setBackgroundAndBorder = function(background, border) {
      this.table.style.backgroundColor = background;
      this.table.style.border = border;
    }
    this.init();
  },

  // call a server handler --
  onWidgetMovement : function(e, widget, prevWidgetOld, prevWidgetNew) {
    var ret = stopEventPropagation(e);
    var wLen = 'widget_'.length;

    var widgetUri = widget.id.substring(wLen);
    if (!isNaN(widgetUri)) {
      var bookmarkBase = document.getElementById('bookmarkBlock');
      widgetUri = bookmarkBase.innerHTML + widgetUri;
    }
    var td = getTdNode(widget);
    if(td == null)
      return;
    var newCol = parseInt(td.id.substring('col_'.length));

    var params = 'uri=' + encodeURIComponent(widgetUri) + '&-drag=y&submitUpdate=y&previousInColumn_verified=y&.dashboardColumn=' + newCol;
    if (prevWidgetNew) {
      var newPrevUri = prevWidgetNew.id.substring(wLen);
      if (!isNaN(newPrevUri)) {
        var bookmarkBase = document.getElementById('bookmarkBlock');
        newPrevUri = bookmarkBase.innerHTML + newPrevUri;
      }

      params += '&.previousInColumn_select=' + encodeURIComponent(newPrevUri);
    }
    // set self as prev widget to know that this is the top of the column (till remove prop implemented)
    else
      params += '&.previousInColumn_select=' + encodeURIComponent(widgetUri);
    var target = getTargetElement(e);
    postRequest(e, 'proppatch', params, widget, td, callback);
    function callback() {
    }
    return ret;
  },

  onReleaseOverTab : function(e, widget, table) {
    var elms = table.getElementsByTagName('a');
    var a;
    for (var i=0; i<elms.length; i++) {
      if (!elms[i].id || elms[i].id.indexOf('tab_') != 0)
        continue;
      a = elms[i];
      break;
    }
    var ret = stopEventPropagation(e);
    if (!a)
      return ret;
    var tab = a.id.substring(4);
    var wLen = 'widget_'.length;
    var widgetUri = widget.id.substring(wLen);
    // Trying to drag backlink widget
    if (widgetUri.indexOf("http") == -1) {
      if (!isNaN(widgetUri)) {
        var bookmarkBase = document.getElementById('bookmarkBlock');
        widgetUri = bookmarkBase.innerHTML + widgetUri;
      }
      else {
        widgetUri = null;
        elms = widget.getElementsByTagName('a');
        for (var i=0; i<elms.length; i++) {
          if (!elms[i].id || elms[i].id.indexOf('widget_') != 0)
            continue;
          widgetUri = elms[i].id.substring(wLen);
          if (!isNaN(widgetUri)) {
            var bookmarkBase = document.getElementById('bookmarkBlock');
            widgetUri = bookmarkBase.innerHTML + widgetUri;
          }
          break;
        }
        // bookmark for this widget was not yet created
        if (widgetUri == null) {
          var f = document.getElementById("pref_" + widget.id.substring(wLen));
          if (f) {
            formId = f.id;
            // create backlink bookmark and move it to Tab
            submitWidgetPreferences(e, formId, tab);
            return ret;
          }
        }
      }
    }
    if (widgetUri == null)
      return ret;
    var href = a.href;
    var params = 'uri=' + encodeURIComponent(widgetUri) + '&submitUpdate=y&.parent_verified=y&.parent_select=' + encodeURIComponent(tab);

    postRequest(e, 'proppatch', params, widget, a, callback);
    return ret;

    function callback(event, widget) {
      var hideDivId = widget.id;

      hideDiv(event, hideDivId);
      var idx = widgetUri.lastIndexOf('=');
      var bookmarkId;

      // sidebar widget that is not bookmark yet
      if (idx != -1)
        bookmarkId = widgetUri.substring(idx + 1);

      var tr = document.getElementById('dm_' + bookmarkId);

      idx = tab.lastIndexOf('=');
      var tbody = document.getElementById('menu_' + tab.substring(idx + 1));
      var elms = tbody.getElementsByTagName('tr');
      // Copying widget from one dashboard to another.
      if (tr) {
        var tbodyP = tr.parentNode;
        tbodyP.removeChild(tr);

        if (elms)
          tbody.insertBefore(tr, elms[0]);
        else
          tbody.appendChild(tr);
        return;
      }
      // Copying widget from sidebar to dashboard
      var newTr = document.createElement('tr');
      newTr.setAttribute('id', 'dm_' + bookmarkId);

      var cellI = document.createElement('td');
      cellI.setAttribute('class', 'menuItemIcon');
      newTr.appendChild(cellI);

      var icons = widget.getElementsByTagName('img');
      for (var i=0; i<icons.length; i++) {
        if (icons[i].className  &&  icons[i].className == 'widgetIcon') {
          cellI.appendChild(icons[i]);
          break;
        }
      }
      var cell = document.createElement('td');
      cell.setAttribute('class', 'menuItem');
      newTr.appendChild(cell);
      var aMenu = document.createElement('a');
      cell.appendChild(aMenu);
      aMenu.setAttribute('href', 'l.html?-max=y&-bookmark=' + encodeURIComponent(widgetUri));
      var titles = widget.getElementsByTagName('span');
      for (var i=0; i<titles.length; i++) {
        if (titles[i].className  &&  titles[i].className == 'widgetTitle') {
          aMenu.appendChild(titles[i]);
          break;
        }
      }

      var cellE = document.createElement('td');
      cellE.setAttribute('class', 'menuExpand');
      newTr.appendChild(cellE);
      if (elms)
        tbody.insertBefore(newTr, tbody.rows[0]);
      else
        tbody.appendChild(newTr);

      var errDiv = document.getElementById('errorMessage');
      if (!errDiv)
        return;
      var errIcon = errDiv.getElementsByTagName('img');
      errIcon[0].src = 'icons/info-msg.gif';
      var errMsg = errDiv.getElementsByTagName('span');
      errMsg[0].innerHTML = 'Drag-and-drop was successful';
      errDiv.style.visibility = Popup.VISIBLE;
      errDiv.style.display = 'inline';
//      errDiv.innerHTML = "<table border='0' width='100%' class='commentevent'><tr><td valign='bottom' align='center' width='70'><img src='icons/info-msg.gif' width='64' /></td><td><span class='info'>Drag-and-drop was successful</span></td><td valign='top'><img src='icons/hide.gif' width=16 height=16 onclick='hideDiv(event, \"errorMessage\");'/></td></tr></table>";
    }
  }
}

var WidgetFlip = {
//PREFERENCE BUTTON ANIMATION (- the pref flipper fade in/out)

//mouseexit() is the opposite of mousemove() in that it preps the preferences flipper
//to disappear.  It adds the appropriate values to the animation data structure and sets the animation in motion.

  flipShown : false,    // a flag used to signify if the flipper is currently shown or not.

  // A structure that holds information that is needed for the animation to run.
  fading : {duration:0, starttime:0, end:1.0, now:0.0, start:0.0, firstElement:null, timer:null},
  currentWidgetId : null,
  flipImg : null,
  mousemove : function (e, divId)  {
    if (typeof getDocumentEvent == 'undefined') return;
    e = getDocumentEvent(e); if (!e) return;
    if (this.flipShown)
      return;
    // if the preferences flipper is not already showing...
    if (this.fading.timer != null) {     // reset the fading timer value, in case a value was left behind
      if (this.currentWidgetId  &&  this.currentWidgetId != divId)
        this.hideflip(e, this.currentWidgetId);
      clearInterval (this.fading.timer);
      this.fading.timer  = null;
    }


    this.currentWidgetId = divId;
    var div = document.getElementById(divId);
    this.showflip(e, div);

    var starttime = (new Date).getTime() - 13;    // set it back one frame
    this.fading.duration = 500;                       // fading time, in ms
    this.fading.starttime = starttime;                    // specify the start time
    this.fading.timer = setInterval ("WidgetFlip.fade();", 13);   // set the fading function
    this.fading.start = this.fading.now;                     // beginning opacity (not ness. 0)
    this.fading.end = 1.0;                           // final opacity
    this.fade();                                // begin fading
    this.flipShown = true;                           // mark the flipper as animated

  },

//   mouseexit() is the opposite of mousemove() in that it preps the preferences flipper
//   to disappear.  It adds the appropriate values to the fading data structure and sets the fading in motion.

  mouseexit : function (e, divId)  {
    if (typeof getDocumentEvent == 'undefined') return;
    e = getDocumentEvent(e); if (!e) return;
    if (!this.flipShown)
      return;
    // fade in the flip widget
    if (this.fading.timer != null) {
      clearInterval (this.fading.timer);
      if (this.currentWidgetId  &&  this.currentWidgetId != divId)
        this.hideflip(e, this.currentWidgetId);
      this.fading.timer  = null;
    }

    this.currentWidgetId = divId;
    var starttime = (new Date).getTime() - 13;

    this.fading.duration = 500;
    this.fading.starttime = starttime;
    var div = document.getElementById(divId);
    this.fading.timer = setInterval ("WidgetFlip.fade();", 13);
    this.fading.start = this.fading.now;
    this.fading.end   = 0.0;
    this.fade();
    this.flipShown = false;

  },

  showBackside : function(event, divId) {
    downloadWidget.storeFrontsideSize(divId);
    hideDiv(event, divId);
    activateDiv(event, divId + "_back");
    OperaWidget.resizeOnBackside();
    //displayDiv(event, divId + "_back");
    showDiv1(event, divId + "_back");
  },

  /**
   * fades widget flip image.
   */
  fade : function ()  {
    if(this.flipImg == null)
      return;
    var time = (new Date).getTime();
    var elapsedTime = this.getElapsedTime(time - this.fading.starttime, this.fading.duration);

    if (elapsedTime >= this.fading.duration) {
      clearInterval (this.fading.timer);
      this.fading.timer = null;
      this.fading.now = this.fading.end;
    }
    else {
      var ease = 0.5 - (0.5 * Math.cos(Math.PI * elapsedTime / this.fading.duration));
      this.fading.now = this.getNextFadingNumber(this.fading.start, this.fading.end, ease);
    }
    changeOpacity(this.flipImg, this.fading.now);
    if(this.flipShown == false && this.fading.now == this.fading.end)
      this.hideflip();

  },

  getElapsedTime : function (elapsed, duration)  {
    return elapsed < 0 ? 0 : (elapsed > duration ? duration : elapsed);
  },

  getNextFadingNumber : function (start, end, ease)  {
    return start + (end - start) * ease;
  },

  enterflip : function (event)  {
    if(this.flipImg == null)
      return;
    var baseUri = getBaseUri();
    this.flipImg.src = baseUri + "images/flip_hover.png";
  },

  exitflip : function (event)  {
    if(this.flipImg == null)
      return;

    var baseUri = getBaseUri();
    this.flipImg.src = baseUri + "images/flip.png";
  },

  showflip : function (event, div) {
    if(this.flipShown)
      return;
    var baseUri = getBaseUri();
    this.flipImg = getChildByAttribute(div, "className", "widgetIcon");
    if(this.flipImg == null)
      return;
    if(/_hover.png$/.test(this.flipImg.src))
      return;

    var trueSrc = this.flipImg.getAttribute("true_src");
    if(trueSrc == null)
      this.flipImg.setAttribute("true_src", this.flipImg.src);

    this.flipImg.src = baseUri + "images/flip.png";
    this.flipShown = true;
  },

  hideflip : function (event, divId) {
    if(this.flipImg == null)
      return;
    this.flipShown = false;
    this.flipImg.src = this.flipImg.getAttribute("true_src");
    changeOpacity(this.flipImg, 1.0);
  }
}

/*
 * submits preferences form on the back of the widget and repaints widget
 * tab - is passed only when there need to create bookmark for sidebar widget before
 * moving it to different Tab
 */
function submitWidgetPreferences(event, formId, tab) {
  var ret = stopEventPropagation(event);
  if (formId.indexOf("pref_") == -1)
    return ret;
  var form = document.getElementById(formId);
  if (!form)
    return ret;
//  var refersh = form.elements['.refresh'].value;

  var param = FormProcessor.getFormFilters(form, true) + '&submitUpdate=y';
  if (param.charAt(0) == '&')
    param = param.substring(1);
  var url = form.action;

  var divId =  (formId.indexOf("_http") != -1) ? 'widget_' + formId.substring(5) : 'div_' + formId.substring(5);

  var widgetDiv = document.getElementById(divId);

  var elm = getEventTarget(event); //getTargetElement(event);
//  var div = document.createElement('div');
//  div.style.display = "none";
//  postRequest(event, url, param, div, elm, refreshWidget);
  if (OperaWidget.isWidget()) {
    OperaWidget.resizeOnFrontside();
    // 'formId.substring(5)' - widget type url
    OperaWidget.savePreferencesStr(param);
    WidgetRefresher.updateWidgetByUrl(formId.substring(5));
    return ret;
  }
  else {
    if (tab)
      postRequest(event, url, param, widgetDiv, elm, doCopyToTab);
    else {
      postRequest(event, url, param, widgetDiv, elm, WidgetRefresher.refresh);
      return ret;
    }
  }
  // After sidebar bookmark was created move it to Tab
  function doCopyToTab(event, widget, hotspot, contents) {
    widget.innerHTML = contents;

    var a = document.getElementById('tab_' + tab);
    if (!a)
      return;
    var table;
    var t = a.parentNode;
    while (!table) {
      if (!t) {
        alert('Failed to copy widget in tab')
        return;
      }
      if (t.tagName.toLowerCase() == 'table')
        table = t;
      else
        t = t.parentNode;
    }

    Dashboard.onReleaseOverTab(event, widget, table);
  }
}
function callback(event, widget) {
  hideDiv(event, widget.id);
}

/*********************************************
* Updates all widgets with refresh flag 
*********************************************/
var WidgetRefresher = {
  widgetsArr : new Array(), // member structure { timerId, bookmarkUrl }
  hdnDoc : null, // helps to load refreshed document
	
	// search widget to rotate in dashboard
	// dashboardId: default value "dashboard"
	init : function(dashboardId) {
		// No widget refreshing in edit page mode 
		if (getUrlParam(null, "-editPage") == "y")
			return;
		
		if (typeof dashboardId == 'undefined')
			dashboardId = "dashboard";

		var dashboardTable = document.getElementById(dashboardId);
		if (!dashboardTable)
			return;

		// NOTE: current dashboard structure: one TR!
		var cells = dashboardTable.rows[0].cells;
		for (var i = 0; i < cells.length; i++) {
			var children = cells[i].children;
			for (var n = 0; n < children.length; n++) {
        var clName = children[n].className;
				if (clName  &&  (clName == "widget"  ||  clName == "propertySheet")) {
        	var rel = children[n].getAttribute("rel");
					
					if (rel == null)
						 continue;

					// fix column width then widget keeps its width
					// TODO: append code window.onresize
					cells[i].style.width = cells[i].offsetWidth;

					var idx = rel.indexOf(";");
					var intervalSeconds = (idx == -1) ? rel.substring(8) : rel.substring(8, idx);
					this.setInterval(children[n], intervalSeconds);
					// make 1st preloading
					this._onInterval(children[n].id);
				}
			}
		}
	},

  setInterval : function(widget, intervalSeconds) {
    var divId = widget.id;

		// 1. prepare new "widget member" or stop old one.
    if(typeof this.widgetsArr[divId] == 'undefined')
      this.widgetsArr[divId] = new WidgetSlider(widget);
    else
      clearInterval(this.widgetsArr[divId].timerId); // ?

    // 2. Find the boorkmark url that is a part of "outer" div widget div
    // divId is an widget content div
	  this.widgetsArr[divId].bookmarkUrl = divId.substr(7);

    // 4. launch widget refresh loop.
    var interval;
    // OperaWidget
    if(OperaWidget.isWidget()) {
      OperaWidget.init(widgetDivId);
      interval = OperaWidget.getRefreshInterval();
      if(interval < 0) {
        if(intervalSeconds > 0)
          interval = intervalSeconds * 1000;
        else
          interval = 15 * 60000; // set default
      }
    }
    // our dashboard
    else {
      if(intervalSeconds < 0)
        return; // no update
      interval = intervalSeconds * 1000;
    }
    var timerId = setInterval("WidgetRefresher._onInterval(\"" + divId + "\")", interval);
    this.widgetsArr[divId].timerId = timerId;
  },
	
  updateWidgetByUrl : function(url) {
    for(i in this.widgetsArr) {
      if(this.widgetsArr[i].bookmarkUrl == url) {
        this._onInterval(i);
        break;
      }
    }
  },
	
  _onInterval : function(divId) {
		var $t = WidgetRefresher;
    var url = getBaseUri() + "widget/div/oneWidget.html";
    var bookmarkId = $t.widgetsArr[divId].bookmarkUrl;
    var params = "-refresh=y&-w=y&-b=" + encodeURIComponent(bookmarkId);

    var widgetSlider = WidgetRefresher.widgetsArr[divId];
		// show preloaded slide
		widgetSlider.showNextSlide();
		
		var wdiv = widgetSlider.getWidgetDiv();
    if (wdiv) {
			var recNmb = widgetSlider.getRecNmb();
      params += "&recNmb=" + recNmb;
   }

    var cookieDiv = document.getElementById("ad_session_id");
    if (cookieDiv) {
      xcookie = cookieDiv.innerHTML;
    }

		if (widgetSlider.isSlideLoaded(recNmb))
    	widgetSlider.insetNextSlide(); // slide is in cache
		else	
			postRequest(null, url, params, wdiv, null, WidgetRefresher.refresh, true, true);
  },
	
  // called by postRequest
  refresh : function(event, div, hotSpot, content)  {
		if (content.length == 0)
			return;

    var widgetSlider = WidgetRefresher.widgetsArr[div.id];
		if (widgetSlider)
			widgetSlider.insetNextSlide(content);
		else
			div.innerHTML = content; // widget view (backside options)
			
		//if(OperaWidget.isWidget())
    //  OperaWidget.onWidgetRefresh();
  }
}

/***********************************************
* associated with each widget with REFRESH flag
* NOTE: meanwhile NO stroring of slides because
* no check of secondary content loading! 
************************************************/
function WidgetSlider(widgetDiv) {
	var self = this;
	// used and initialized in WidgetRefresher
	this.timerId; // timer to refresh
	this.interval; // refresh interval
	this.bookmarkUrl;
	this.widgetDiv;
	
	this.nextSlide = null;
	//-------------------
	// fading animation
	this.HALF_STEPS_AMT = 10;
	this.TIMEOUT = 30;
	this.step = 1;
	this.slidesArr = new Array();
	
	// IE's hack for text fading
	this.clrRGB = null;
	this.bgRGB = null;
	
	this.init = function(widgetDiv) {
		this.widgetDiv = widgetDiv;
	},
	
	this.insetNextSlide = function(html) {
		var $t = self;
		var recNmb = this.getRecNmb();
		
		if (!html) {
			$t.nextSlide = $t.slidesArr[recNmb];
		}
		else {
			$t.nextSlide = document.createElement("div");
			$t.nextSlide.innerHTML = html;
			$t.slidesArr[recNmb] = $t.nextSlide;
		}
		
		if (Browser.ie) // IE uses own transition Fade effect
			return;
		
		$t.nextSlide.style.display = "none";
		$t.widgetDiv.appendChild($t.nextSlide);
	}
	
	this.showNextSlide = function(){
		if (this.nextSlide == null)
			return;

		if (Browser.ie) { // IE uses own transition Fade effect
			if (!this.widgetDiv.filters[0]) {	
				this.widgetDiv.style.width = this.widgetDiv.offsetWidth;
				this.widgetDiv.style.height = this.widgetDiv.offsetHeight;
				this.widgetDiv.style.filter = "progid:DXImageTransform.Microsoft.Fade(duration=1)";
			}
	
			this.widgetDiv.filters[0].apply();
			this.widgetDiv.innerHTML = this.nextSlide.innerHTML;
			this.widgetDiv.filters[0].play();
			return;
		}	
		
		// other browsers
		this.fading();
	}
	
	this.fading = function() {
		var $t = self;
		var opacity;

		if ($t.step <= $t.HALF_STEPS_AMT) 
			opacity = ($t.HALF_STEPS_AMT - $t.step) / $t.HALF_STEPS_AMT;
		else if ($t.step == $t.HALF_STEPS_AMT * 2 - 1)
			opacity = 1.0;	
		else
			opacity = ($t.step - $t.HALF_STEPS_AMT) / $t.HALF_STEPS_AMT;

		$t._changeOpacity(opacity);

		// replace slides
		if ($t.step == $t.HALF_STEPS_AMT) {
			removeAllChildren($t.widgetDiv, $t.nextSlide);
			$t.nextSlide.style.display = "";
		}
		
		$t.step++;
		
		if ($t.step < $t.HALF_STEPS_AMT * 2) {
			setTimeout(function(){$t.fading()}, $t.TIMEOUT);
		}
		else {
			$t.step = 1;
		} 
	}
	this._changeOpacity = function(opacity) {
		if (!Browser.ie) {
			changeOpacity(this.widgetDiv, opacity);
			return;
		}
		
/*	not used after	Fade transition was applied
		// IE's problem: 1) need to change opacity for each element
		// 2) color blend with background
		var all = this.widgetDiv.getElementsByTagName("*");
		var color = "";
		if (opacity != 1.0) {
			if (this.clrRGB == null) {
				this.clrRGB = hex2rgb(getElementStyle(this.widgetDiv).color);
				this.bgRGB = hex2rgb(getElementStyle(document.body).backgroundColor);
			}
			
			var r = this.clrRGB[0] * opacity + this.bgRGB[0] * (1.0 - opacity);
			var g = this.clrRGB[1] * opacity + this.bgRGB[1] * (1.0 - opacity);
			var b = this.clrRGB[2] * opacity + this.bgRGB[2] * (1.0 - opacity);
			color = "rgb(" + r + "," + g + "," + b + ")";
		}
		
		for (var i = 0; i < all.length; i++) {
			changeOpacity(all[i], opacity);
			if (all[i].tagName.toLowerCase() == 'div')
				all[i].style.color = color;
		}
*/		
	}
	this.getWidgetDiv = function() {
		return this.widgetDiv;
	}
	this.isSlideLoaded = function(recNmb) {
		if (typeof this.slidesArr[recNmb] == "undefined")
			return false;
		return true;	
	}
	
	// RecNmb is index of next resource
	this.getRecNmb = function() {
		var div = this.nextSlide != null ? this.nextSlide : this.widgetDiv;
		var frontDiv = getChildByClassName(div, "front");
		if (!frontDiv)
			return 1; 
	  var rel = frontDiv.getAttribute("rel");
    if (!rel)
			rel = div.getAttribute("rel"); // on 1st slide
		if (!rel)
			return 1; 
	
    var idx = rel.indexOf("recNmb:");
    if (idx == -1) 
      recNmb = 0;
    else {
      var idx1 = rel.indexOf(";", idx + 1);
      recNmb = (idx1 == -1) ? rel.substring(idx + 7) : rel.substring(idx + 7, idx1);
    }
    var idx11 = rel.indexOf(";nmbOfResources=");
    if (idx11 != -1) {
      var idx12 = rel.indexOf(";", idx11);
      if (idx12 == -1)
        limit = rel.substring(idx11 + 16);
      else
        limit = rel.substring(idx11 + 16, idx12);
      recNmb += limit;
    }

		return parseInt(recNmb);
	}
	
	// ---
	this.init(widgetDiv);
}

function changeSkin(event) {
  var e = getDocumentEvent(event);
  if (!e)
    return;

//  var target = getTargetElement(e);
  var target = getEventTarget(event); //getTargetElement(event);
  var value = target.value;
  var t = target;
  while (true) {
    var parent = t.parentNode;
    if (!parent)
      break;
    if (parent.tagName.toLowerCase() == 'div') {
      var div = parent;
      if (div.id   &&  div.id == 'skin') {
        div.className = value;
        break;
      }
    }
    t = parent;
  }
}

function addthis_click(event, addthis_title) {
  var e = getDocumentEvent(event);
  if (!e)
    return;

  var target = getTargetElement(e);

  window.open(target.href, addthis_title, 'scrollbars=yes,menubar=no,width=620,height=520,resizable=yes,toolbar=no,location=no,status=no,screenX=200,screenY=100,left=200,top=100');
  return stopEventPropagation(event);
}


var OperaWidget = {
  CONTENT_KEY_NAME   : "content",
  PREFS_STR_KEY_NAME : "prefs_str",
  MAX_WND_WIDTH : 600,
  MAX_WND_HEIGHT : 600,
  BACKSIDE_WIDTH  : 305,
  BACKSIDE_HEIGHT : 190,
  widgetDiv : null,
  frontDiv : null,
  backDiv : null,
  prefForm : null,
  widgetWidth  : 0,
  widgetHeight : 0,
  refreshInterval : -1, // default

  init : function(widgetDivId) {
    if(typeof widget == 'undefined')
      return;
    // 1. widget div
    this.widgetDiv = document.getElementById(widgetDivId);
    if(!this.widgetDiv)
      return;
    // 2. front & back children divs
    this.frontDiv = getChildByAttribute(this.widgetDiv, "className", "front");
    var backId =  this.frontDiv.id + "_back";
    this.backDiv = getChildById(this.widgetDiv, backId);
    // 3. restore content from pref
/*
    var content = widget.preferenceForKey(this.CONTENT_KEY_NAME);
    if(typeof content != 'undefined' && content.length != 0) {
      content = content.replace(/\r|\n|\r\n|\s/g, " ");
      this.widgetDiv.innerHTML = content;
    }
*/
    // 3. fitWindowSize does not work on this moment!
    //this.fitWindowSize();
    Debug.setMode(true);
    Debug.log('OperaWidget.init');
    this.resizeOnFrontside();

    // 6. init prefs on the back
    this.applyPrefs();
    // 5.
    this.processWidth();
    // 6.
    resizeHandle.init();
  },

  onWidgetRefresh : function() {
    this.frontDiv = getChildByAttribute(this.widgetDiv, "className", "front");
    var backId =  this.frontDiv.id + "_back";
    this.backDiv = getChildById(this.widgetDiv, backId);
    Debug.setMode(true);
    Debug.log('onWidgetRefresh');
    this.processWidth();
    resizeHandle.init();
    this.applyPrefs();
    this.saveContent();
    this.resizeOnFrontside();
  },
  // stores min size and makes width = 100%
  processWidth : function() {
    this.minWidth = this.widgetDiv.offsetWidth;
    this.minHeight = this.widgetDiv.offsetHeight;
    var parentTable = getAncestorByTagName(this.widgetDiv, "table");
    parentTable.width = "100%";
    // set cellpadding = 0
    parentTable.cellpadding = 0;
  },

  resizeOnFrontside : function() {
    if(typeof widget == 'undefined')
      return;
    //if(this.widgetWidth == 0 || this.widgetHeight == 0)
    //  return;
    //window.resizeTo(this.MAX_WND_WIDTH, this.MAX_WND_HEIGHT);
    //sizeWidget(this.MAX_WND_WIDTH, this.MAX_WND_HEIGHT);
    //displayDiv(null, this.frontDiv.id);
    //var divCoords = getElementDimensions(this.frontDiv);
    //activateDiv(null, this.frontDiv.id);
    //Debug.setMode(true);
    //Debug.log('frontSide: width = ' + divCoords.width + '; height = ' + divCoords.height);
    //Debug.log('frontSide: width = ' + this.frontDiv.clientWidth + '; height = ' + this.frontDiv.clientHeight);

    //sizeWidget(divCoords.width, divCoords.height + 100);
    //window.resizeTo(divCoords.width, divCoords.height);
  },

  resizeOnBackside : function() {
    if(typeof widget == 'undefined')
      return;
    /*
    var wndSize = getWindowSize();
    this.widgetWidth  = wndSize[0];
    this.widgetHeight = wndSize[1];

    window.resizeTo(this.BACKSIDE_WIDTH, this.BACKSIDE_HEIGHT);
    */
    /*
    window.resizeTo(this.MAX_WND_WIDTH, this.MAX_WND_HEIGHT);

    var divCoords = getElementDimensions(this.backDiv);
    Debug.setMode(true);
    Debug.log('backside: width = ' + divCoords.width + '; height = ' + divCoords.height);
    Debug.log('backside: width = ' + this.backDiv.clientWidth + '; height = ' + this.backDiv.clientHeight);

    window.resizeTo(divCoords.width, divCoords.height);
    */
  },
  saveContent : function() {
    if(typeof widget == 'undefined')
      return;
    var content = this.widgetDiv.innerHTML;
    widget.setPreferenceForKey(content, this.CONTENT_KEY_NAME);
  },
  savePreferencesStr : function(preferencesStr) {
    widget.setPreferenceForKey(preferencesStr, this.PREFS_STR_KEY_NAME);
  },
  // 1) restores backside values 2) applies chosen skin
  applyPrefs : function() {
    Debug.restoreLog();
    var prefsStr = widget.preferenceForKey(this.PREFS_STR_KEY_NAME);
    if(typeof prefsStr == 'undefined' || prefsStr.length == 0)
      return;
    // get pref form (on each refresh)
    forms = widgetDiv.getElementsByTagName("form");
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].id) {
        var idx = forms[i].id.indexOf('pref_');
        if (idx == 0) {
          this.prefForm = forms[i];
          break;
        }
      }
    }
    if (this.prefForm == null)
      throw new Error("form pref_ not found");

    //***********************************************
    //* restore form fields from preferences
    //*
    // parameters to calculate refresh in milliseconds.
    var intervalNumber = 15;       // key: "refresh.seconds"
    var intervalType = "minute(s)"; // key: "refresh.durationType"
    var skinName = "";

    var prefPairs = prefsStr.split('&');
    for(var i = 0; i < prefPairs.length; i++) {
      var pair = prefPairs[i].split('=');
      if(typeof pair[1] == 'undefined')
        continue;

      // set <input> values
      if(typeof this.prefForm[pair[0]] != 'undefined')
        this.prefForm[pair[0]].value = decodeURIComponent(pair[1]);

      // interval values
      if(pair[0] == "refresh.seconds")
        intervalNumber = pair[1];
      if(pair[0] == "refresh.durationType")
        intervalType = pair[1];

      if(pair[0] == ".skin")
        skinName = pair[1];
    }
    // 2. calculate refreshInterval
    this.calculateRefreshInterval(intervalNumber, intervalType);
    // 3. restore skin
    var skinDiv = getChildById(widgetDiv, 'skin');
    if(skinDiv)
      skinDiv.className = skinName;

    var pKey = this.prefForm['publicKey'];
    if (!pKey) {
      var pDiv = document.getElementById('publicKey');
      if (pDiv) {
        this.prefForm['publicKey'].value = pDiv.innderHTML;
      }
    }
  },

  calculateRefreshInterval : function(intervalNumber, intervalType) {
      var refreshInterval = 1;
      refreshInterval *= intervalNumber;
      if(intervalType.indexOf("minute(s)") == 0) {
        refreshInterval *= 1000 * 60;
      }
      else if(intervalType == "hour(s)")
        refreshInterval *= 1000 * 360;
      else if(intervalType == "day(s)")
        refreshInterval *= 1000 * 360 * 24;
      else if(intervalType == "week(s)")
        refreshInterval *= 1000 * 360 * 24 * 7;
      else if(intervalType == "month(s)")
        refreshInterval *= 1000 * 360 * 24 * 30;
      else if(intervalType == "years(s)")
        refreshInterval *= 1000 * 360 * 24 * 360;

      this.refreshInterval = refreshInterval;
  },
  getWidgetDiv : function() {
    return this.widgetDiv;
  },
  getWidgetFrontDiv : function() {
    return this.frontDiv;
  },
  getRefreshInterval : function() {
    return this.refreshInterval;
  },
  getMinSize : function() {
    return [this.minWidth, this.minHeight];
  },
  getMaxSize : function() {
    return [this.MAX_WND_WIDTH, this.MAX_WND_HEIGHT];
  },

  isWidget : function() {
//    if(typeof widget != 'undefined')
//      return true;
    return false;
  }
}

// workaround for widget resize bug in Apple dashboard
// http://blog.keilly.com/2007/05/widget-resize.html
function sizeWidget(x,y) {
  if (typeof opera != 'undefined') {
    window.resizeTo(x,y);
    return;
  }
  if (x == window.innerWidth && y == window.innerHeight)
    return;

  // size limiting code
  if (x <= 200)
    x = 200;
  if (x >= 440)
    x = 440;
  if (y <= 130)
    y = 130;
  if (y >= 340)
    y = 340;

    // prevent vertical resize bug
  if (y > 130 && y < 340 && y != window.innerHeight && x == window.innerWidth)
    window.resizeTo(x + 1, y);

  // finally the original resize
  window.resizeTo(x,y);
}

var downloadWidget = {
  sizesArr : new Array(), // member struct: {width, height}
  storeFrontsideSize : function(div){
    if(div == null)
      return;
    if (typeof div == 'string')
      div = document.getElementById(div);
    if(div == null)
      return;
    var size = new Object();
    size.width = div.offsetWidth;
    size.height = div.offsetHeight;
    this.sizesArr[div.id] = size;
  },
  doit : function(imgObj, url) {
    var obj = imgObj;
    // find parent backside div
    var id;

    while(obj != null) {
      id =  obj.id;
		  if (obj.className == "hdn" && id.indexOf("_back") != -1) {
		    widgetDiv = obj;
		    break;
		  }
		  obj = obj.parentNode;
	  }
    // key in sizesArr array is ID of frontsize, so without "_back" (5 letters)
    var key = id.substr(0, id.length - 5);

    // temporary hack; margin = windowSize - sivSize
    var MARGIN_X = 9;
    var MARGIN_Y = 9;
    url += "&-widthFront="  + (this.sizesArr[key].width + MARGIN_X);
    url += "&-heightFront=" + (this.sizesArr[key].height + MARGIN_Y);

    document.location = url;
//    var cookie = window.getElementById('-cookie');
//    alert(cookie);
  }
}

// Write to the debug div or log console.
var Debug = {
  logPref: 'log',
  debugMode: false,

  log: function(str) {
    if (this.debugMode) {
      if (window.widget) {
        alert(str);
        /*
        var div = document.getElementById('debugDiv');
        if (!div) {
          var div = document.createElement('div');
          div.setAttribute('id', 'debugDiv');
        }
        div.appendChild(document.createTextNode(str));
        div.appendChild(document.createElement("br"));
        div.scrollTop = div.scrollHeight;
        var s = widget.preferenceForKey(this.logPref);
        widget.setPreferenceForKey(s + '<br>' + str, this.logPref);
        */
      }
      else {
        if (typeof console != 'undefined')
          console.log(str);
        else if (typeof opera != 'undefined')
          opera.postError(str);
      }
    }
  },

  restoreLog: function(str) {
    return;
    if (this.debugMode) {
      if (window.widget) {
        var div = document.getElementById('debugDiv');
        if (!div) {
          var div = document.createElement('div');
          div.setAttribute('id', 'debugDiv');
        }
        var s = widget.preferenceForKey(this.logPref);
        if (s)
          div.innerHTML = s;
      }
    }
  },

  setMode: function(active) {
    var m = this.debugMode;
    this.debugMode = active;
    if (window.widget) {
      var d = document.getElementById('debugDiv');
      if (!d)
        return;
      if (active)
        d.style.display = 'block';
      else
        d.style.display = 'none';
    }
    return m;
  }
}

var resizeHandle = {
  MIN_WIDTH_PLUS : 0,
  MIN_HEIGHT_PLUS : 0,
  widgetDiv : null,
  handleDiv : null,
  growboxInset : null,
  maxSize : null,
  minSize : null,

  init : function() {
    this.handleDiv = document.createElement('div');
    this.handleDiv.className = 'resize_handle';
    this.handleDiv.onmousedown = this.mouseDown;
    this.widgetDiv = OperaWidget.getWidgetFrontDiv();
    this.widgetDiv.appendChild(this.handleDiv);

    // try to prevent content offset
    addEvent(window, "scroll", this.onScroll, true);
    addEvent(document.body, "scroll", this.onScroll, true);

    this.restoreSize();
  },
  mouseDown : function(event) {
      var thisObj = resizeHandle;
      addEvent(document, "mousemove", thisObj.mouseMove, true);
      addEvent(document, "mouseup", thisObj.mouseUp, true);
      thisObj.growboxInset = {x:(window.innerWidth - event.x), y:(window.innerHeight - event.y)};
      event.stopPropagation();
      event.preventDefault();
  },
  mouseMove : function(event) {
      var thisObj = resizeHandle;
      var width = event.x + thisObj.growboxInset.x;
      var height = event.y + thisObj.growboxInset.y;

      if(this.maxSize == null)
        this.maxSize = OperaWidget.getMaxSize();
      if(this.minSize == null)
        this.minSize = OperaWidget.getMinSize();

      if(width > this.maxSize[0])
        width = this.maxSize[0];
      if(width < this.minSize[0] + this.MIN_WIDTH_PLUS)
        width = this.minSize[0] + this.MIN_WIDTH_PLUS;

      if(height > this.maxSize[1])
        height = this.maxSize[1];
      if(height < this.minSize[1] + this.MIN_HEIGHT_PLUS)
        height = this.minSize[1] + this.MIN_HEIGHT_PLUS;

      event.stopPropagation();
      event.preventDefault();

      window.resizeTo(width, height);

      var scroll = getScrollXY();
      widgetDiv.style.marginLeft = scroll[0];
      widgetDiv.style.marginTop = scroll[1];

      thisObj.handleDiv.style.bottom = 0;
      thisObj.handleDiv.style.right = 0;
  },
  mouseUp : function(event) {
    var thisObj = resizeHandle;
    removeEvent(document, "mousemove", thisObj.mouseMove, true)
    removeEvent(document, "mouseup", thisObj.mouseUp, true);
    event.stopPropagation();
    event.preventDefault();

    var scroll = getScrollXY();
    widgetDiv.style.marginLeft = scroll[0];
    widgetDiv.style.marginTop = scroll[1];

    thisObj.saveSize();
  },
  onScroll : function(event) {
    event.stopPropagation();
    event.preventDefault();
    return false;
  },
  saveSize : function() {
    var wndSize = getWindowSize();
    this.widgetWidth  = wndSize[0];
    this.widgetHeight = wndSize[1];

    widget.setPreferenceForKey(this.widgetWidth,  "width");
    widget.setPreferenceForKey(this.widgetHeight, "height");
  },
  restoreSize : function() {
    this.widgetWidth  = widget.preferenceForKey("width");
    this.widgetHeight = widget.preferenceForKey("height");

    if(!this.widgetWidth)
      return;
    window.resizeTo(this.widgetWidth, this.widgetHeight);
  }
}

var FullScreenPopup = {
  INTERVAL : 10, // ms
  STEPS_NUM : 7,

  wndWidth : null,
  contentDiv : null,
  div : null,
  step : 0,
  toShow : true,
  oldMarginLeft : null,

  submitBtn : null,

  show : function(div, hotspot) {
    if(!Browser.mobile)
      return false;

    this.div = div;
    // suppose that "mainskin" is always applicable
    this.contentDiv = document.getElementById("mainskin");
    this.oldMarginLeft = this.contentDiv.style.marginLeft;

    document.body.style.overflow = "hidden";

    var divStl = div.style;
    div.style.visibility = "visible";
    var wndSize = getWindowSize();
    this.wndWidth = wndSize[0];
    divStl.height = wndSize[1];
    divStl.top = 0;

    var zIndex = 1;
    if (hotspot) {
      var z = hotspot.style.zIndex;
      if (z != null && z != '')
        zIndex = z;
    }
    divStl.zIndex = zIndex + 2;
    this.toShow = true;
    this._prepareDialog();
    this._animate();
    return true;
  },
  hide : function(div) {
    if(typeof div != 'undefined') {
      if(typeof div == 'string')
        div = document.getElementById(div);
      this.div = div;
    }
    this.contentDiv.style.display = "";
    this.toShow = false;
    this._animate();
  },
  _prepareDialog : function() {
    if(this.div.id != 'pane2')
      return;
    this.submitBtn = getChildByAttribute(this.div, "name", "submit");
    if(this.submitBtn != null) {
      this.submitBtn.style.display = "none";
    }
    var cancelBtn = getChildByAttribute(this.div, "name", "cancel");
    if(cancelBtn != null)
      cancelBtn.style.display = "none";
  },
  // replace "dummy" submit image with submit button
  _prepareSubmitButton : function() {
    if(this.submitBtn == null)
      return;
    var submitImg = getChildById(this.div, "submit_img");
    if(submitImg == null)
      return;
    var x = findPosX(submitImg);
    var y = findPosY(submitImg);
    submitImg.style.display = "none";

    var sbStl = this.submitBtn.style;
    sbStl.position = "absolute";
    sbStl.left = x;
    sbStl.top  = y;
    sbStl.borderWidth = 0;
    sbStl.background = "url(images/skin/iphone/submit.png)";
    sbStl.width = 68;
    sbStl.height = 30;
    this.submitBtn.value = "";
    sbStl.display = "";
  },
  _animate : function() {
    var thisObj = FullScreenPopup;
    var divStl = thisObj.div.style;
    var cntDivStl = thisObj.contentDiv.style;
    var x;

    var delta = Math.floor(thisObj.wndWidth / thisObj.STEPS_NUM);

    if(thisObj.toShow) {
      if(thisObj.step == thisObj.STEPS_NUM)
        x = this.wndWidth;
      else
        x = thisObj.step * delta;
    }
    // to hide popup
    else {
      if(thisObj.step == thisObj.STEPS_NUM) {
        divStl.visibility = "hidden";
        x = thisObj.oldMarginLeft;
      }
      else
        x = thisObj.wndWidth - (thisObj.step * delta);
    }

    cntDivStl.marginLeft = x;

    divStl.left  = x - thisObj.div.clientWidth;
    divStl.width =  this.wndWidth;

    if(thisObj.step < thisObj.STEPS_NUM) {
      thisObj.step++;
      setTimeout("FullScreenPopup._animate();", thisObj.INTERVAL);
    }
    else { // stop animation
      if(thisObj.toShow) {
        cntDivStl.display = "none";
        thisObj._prepareSubmitButton();
      }
      else {
        // overflow "auto" did not work in Safari
        var wndSize = getWindowSize();
        if(wndSize[0] < document.body.scrollWidth ||
            wndSize[1] < document.body.scrollHeight)
          document.body.style.overflow = "scroll";
      }
      thisObj.step = 0;
    }
  }
}

// allows reorder table rows
var OrderRows = {
  BG_COLOR : "rgb(172, 210, 226)",
  tbody : null,
  tableTop : null,
  prevY : null,
  prevRowOld : null,
  dragRowIdxOld : null,

  getDragBlock : function(dragHandler) {
    var tr = getAncestorByTagName(dragHandler, "tr");
    return tr;
  },
  onStartDrag : function(dragRow) {
    this.tbody = getAncestorByTagName(dragRow, "tbody");
    this.tableTop = findPosY(this.tbody);
    this.prevRowOld = dragRow.previousSibling;
    dragRow.style.backgroundColor = this.BG_COLOR;

    this.dragRowIdxOld = dragRow.rowIndex;
  },
  onDrag : function(dragBlock, x, y) {
    this.isDirUp = this.detectDirection(y);
    var offsetY = y - this.tableTop;
    var targetRow = this.detectTargetRow(offsetY);
    if(targetRow) {
      var isTargetUpper = (targetRow.offsetTop < dragBlock.offsetTop);
      if((this.isDirUp && isTargetUpper) || (!this.isDirUp && !isTargetUpper))
        if(targetRow.rowIndex != dragBlock.rowIndex)
          swapNodes(targetRow, dragBlock);
    }
    return [false, true];
  },
  onStopDrag : function(e, dragRow) {
    dragRow.style.backgroundColor = "";
    if(this.dragRowIdxOld != dragRow.rowIndex)
      this.onRowMovement(dragRow, this.prevRowOld, dragRow.previousSibling);
  },
  detectDirection : function(y)  {
    var isDirUp = null;
    if(this.prevY > y)
      isDirUp = true;
    else if(this.prevY < y)
      isDirUp = false;

    this.prevY = y;
    return isDirUp;
  },
  detectTargetRow : function(offsetY) {
    var targetRow = null;
    var rows = this.tbody.rows;
    for (var i = 0; i < rows.length; i++) {
      if((offsetY > rows[i].offsetTop) &&
        (offsetY < rows[i].offsetTop + rows[i].offsetHeight))
      return rows[i];
    }
    return null;
  },
  onRowMovement : function(row, prevRowOld, prevRowNew) {

  }
}

// html (img) on disabled Flash
var FlashHandler = {
  emdCodeArr : null,
  embed : function(id, flashCode, htmlCode) {
  
    if (this.emdCodeArr == null) {
      this.emdCodeArr = new Array();
      if (!Browser.ie)
        addEvent(window, "load", this.onload, false);
    }
    this.emdCodeArr.push([id, flashCode, htmlCode]);
  },
  init : function() {
    if (Browser.ie)
      this.onload();
  },
  onload : function() {
    var thisObj = FlashHandler;

    if (thisObj.emdCodeArr == null)
      return;

    var isFlashAvailable = DetectFlashVer(8, 0, 0);

    for(var i = 0; i < thisObj.emdCodeArr.length; i++) {
      var div = document.getElementById(thisObj.emdCodeArr[i][0]);
      if(!div)
        continue;
      if (isFlashAvailable)
        div.innerHTML = thisObj.emdCodeArr[i][1];
      else
        div.innerHTML = thisObj.emdCodeArr[i][2];
    }
  }
}

function startCalendar() {
// calling function in the last file
  var FILES_TO_LOAD = ["calendar/calendar.css", "calendar/calendar.js"];
  startCalendar = null;
  LoadOnDemand.doit(FILES_TO_LOAD, "startCalendar", arguments);
}

function initStyleSheet() {
  var FILES_TO_LOAD = ["style_sheet/style_sheet.js"];
  initStyleSheet = null;
  LoadOnDemand.doit(FILES_TO_LOAD, "initStyleSheet", arguments);
}

// LoadOnDemand
var LoadOnDemand = {
  cbArr : new Array, // structure -> [name: , args: ]
  doit : function(files, callbackName, callbackArgs) {
    var callback = {name: callbackName, args: callbackArgs};
    this.cbArr.push(callback);

    if(typeof files == "string")
      files = new Array(files);

    // add timestamp to on demand file
    // on demand file has its timestamp supplied on server side.
    for (var k = 0; k < files.length; k++) {
      var timestamp = g_onDemandFiles[files[k]];
      if (!timestamp)
        //throw new Error("On demand file was not supplied with timestamp");
        continue;

      files[k] = files[k].replace(/\.css$/, "_" + timestamp + ".css");
      files[k] = files[k].replace(/\.js$/, "_" + timestamp + ".js")
    }

    for(var i = 0; i < files.length; i++) {
      if(/.css$/.test(files[i])) {
        this.includeCSS(files[i]);
      }
      else
        this.includeJS(files[i]);
    }
    setTimeout(this.listener, 100);
  },
  listener : function() {
    var thisObj = LoadOnDemand;
    for(var i = 0; i < thisObj.cbArr.length; i++) {
      var callback = eval(thisObj.cbArr[i].name);
      if(callback != null) {
        var idx = i;
        setTimeout(function() {callback.apply(null, LoadOnDemand.cbArr[idx].args); thisObj.cbArr.splice(idx, 1); }, 10);
      }
    }
    if(thisObj.cbArr.length != 0) {
      setTimeout(thisObj.listener, 50);
    }
  },
  includeJS : function(fileName) {
      var html_doc = document.getElementsByTagName('head')[0];
      var js = document.createElement('script');
      js.setAttribute('type', 'text/javascript');

      // suppress minify
      if(location.href.indexOf("-minify-js=n") != -1)
        fileName = fileName.replace("m.js", ".js")

      js.setAttribute('src', fileName);
      html_doc.appendChild(js);
			
			var keyName = fileName.replace(/_[0-9]*\.js/, ".js");			
      g_loadedJsFiles[keyName] = true;
			
			return false;
  },

  includeCSS : function(fileName) {
      var html_doc = document.getElementsByTagName('head')[0];
      var css = document.createElement('link');
      css.setAttribute('rel', 'stylesheet');
      css.setAttribute('type', 'text/css');
      css.setAttribute('href', fileName);
      html_doc.appendChild(css);
      return false;
  }

}

// TabSwap
var TabSwap = {
  PH_BACK_COLOR : "#eee",
  PH_BORDER : "1px dashed #f00",

  placeHolder : null,
  movedTab : null,
  tabsArr : null,
  isDragMode : false,
  prevX : -1,

  init : function() {
    this.placeHolder = document.createElement("div");
    var phStl = this.placeHolder.style;
    phStl.dispaly = "none";
    phStl.verticalAlign = "bottom";
    phStl.border = this.PH_BORDER;
    phStl.backgroundColor = this.PH_BACK_COLOR;

    document.body.appendChild(this.placeHolder);
    this.prepareTabs();
  },
  getDragBlock : function(dragHandleObj, caughtObj) {
	  // move a tab only caught by icon
	  if(caughtObj.className != 'iinp_move')
		  return null;

    // find moved tab
    var classNameArr = new Array();
    classNameArr.push("tabs");
    classNameArr.push("tabs_current");
    this.movedTab = getAncestorByAttribute(dragHandleObj, "className", classNameArr);

    if(this.placeHolder == null)
      this.init();

    return this.movedTab;
  },

  onStartDrag : function() {
    if(this.isDragMode == false) {
      this.isDragMode = true;
    }
    else
      return;
    var mtStl = this.movedTab.style;
    mtStl.verticalAlign = "top"; // for correct position
    mtStl.left = findPosX(this.movedTab);
    mtStl.top = findPosY(this.movedTab);
    mtStl.position = "absolute";
    var phStl = this.placeHolder.style;
    phStl.width = this.movedTab.offsetWidth;
    phStl.height = this.movedTab.offsetHeight;

    if(Browser.ie)
      phStl.display = "inline";
    else if(Browser.gecko)
      phStl.display = "-moz-inline-box";
    else
      phStl.display = "inline-block";
    swapNodes(this.movedTab, this.placeHolder);
  },
  onDrag : function(dragBlock, x, y) {
    if(!this.isDragMode)
      return;

    this.isDirLeft = this.detectDirection(x);
    var midX = x + Math.ceil(dragBlock.offsetWidth / 2);
    var targetTab = this.detectTargetTab(midX);
    if(targetTab) {
      var isTargetLefter = (targetTab.offsetLeft < dragBlock.offsetLeft);
      if((this.isDirLeft && isTargetLefter) || (!this.isDirLeft && !isTargetLefter)) {
        swapNodes(targetTab, this.placeHolder);
        this.updateAllTabRects();
      }
    }

    return [true, false];
  },
  onStopDrag : function(e, dragBlock) {
    if(!this.isDragMode)
      return;

    this.placeHolder.style.display = "none";
    var mtStl = this.movedTab.style
    mtStl.position = "static";
    mtStl.verticalAlign = "bottom";

    swapNodes(this.placeHolder, this.movedTab);
    this.prevX = -1;
    this.isDragMode = false;
  },
  detectDirection : function(x)  {
    var isDirLeft = null;
    if(this.prevX > x)
      isDirLeft = true;
    else if(this.prevX < x)
      isDirLeft = false;

    this.prevX = x;
    return isDirLeft;
  },

  detectTargetTab : function(x) {
    for (var i = 0; i < this.tabsArr.length; i++) {
      if (this.tabsArr[i].isInside(x)) {
        return this.tabsArr[i].tabObj;
      }
    }
    return null;
  },
  updateAllTabRects : function() {
    for (var i = 0; i < this.tabsArr.length; i++)
      this.tabsArr[i].update();
  },
  prepareTabs : function() {
    this.tabsArr = new Array();
    var tables = this.movedTab.parentNode.getElementsByTagName('table');
    var idx = 0;
    for (var i = 0; i < tables.length; i++)
      if (tables[i].className == "tabs" || tables[i].className == "tabs_current") {
        this.tabsArr[idx] = new TabSwap.TabRect(tables[i], idx);
        idx++;
      }
  },

  TabRect : function(tabObj, idx) {
    this.tabObj = tabObj;
    this.idx = idx;
    this.left;
    this.right;

    this.update = function() {
      this.left = findPosX(this.tabObj);
      this.right = this.left + this.tabObj.offsetWidth;
    }
    this.isInside = function(x) {
      if(this.tabObj.style.position == "absolute")
        return false;
      return (x > this.left && x < this.right);
    }
    this.update();
  }
}

/* table of contents does not work otherwise */
function fixAnchor(anchor) {
  document.location.hash = anchor.href.split('#')[1];
  return false;
 }

function showMobileTab(e, hideDivId, unhideDivId) {
  e = getDocumentEvent(e);

  var hasPrefix;
  if (hideDivId  &&  hideDivId.length != 0) {
    var tokens = hideDivId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var tok = trim(tokens[i]);
      var div = document.getElementById(tok);
      if (!div)
        continue;
      div.style.visibility = Popup.HIDDEN;
      div.style.display = "none";
    }
  }
  if (unhideDivId  &&  unhideDivId.length != 0) {
    var tokens = unhideDivId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var tok = trim(tokens[i]);
      var div = document.getElementById(tok);
      if (!div)
        continue;
      div.style.visibility = Popup.VISIBLE;
      div.style.display = 'inline';
    }
  }
//  ExecJS.runDivCode(curDiv);
//  if(typeof ImageAnnotations != 'undefined')
//    ImageAnnotations.onTabSelection(curDiv);

//  resizeIframeOnTabSelection(curDiv); // IE

  return stopEventPropagation(e);
}

/*******************************************
* ToggleBtnMgr
********************************************/
var ToggleBtnMgr = {
  STEP : 15,
	LIMIT : -45,
  tray : null,
  cur: 0,
  dir: -1,
  
  onclick : function(tray){
	  this.tray = tray;
		var marginLeft = getElementStyle(tray).marginLeft;
    if (marginLeft.length == 0 || parseInt(marginLeft) == 0) {
      this.dir = -1;
      this.cur = 0;
    }
    else {
      this.dir = 1;
      this.cur = this.LIMIT;
    }

		// change state in form, hidden field
		var input = getPreviousSibling(tray.parentNode);
		input.value = (input.value == "No") ? "Yes" : "No";
    
		// animation
		this._step();  
  },
  
  _step : function() {
    var $t = ToggleBtnMgr;

    $t.tray.style.marginLeft = ($t.cur + $t.STEP * $t.dir + "px");
    $t.cur += $t.STEP * $t.dir;

    var left = getChildByClassName($t.tray, "left");
    var right = getChildByClassName($t.tray, "right");

    if ($t.dir == -1) {
      if ($t.cur == -$t.STEP)
        right.style.visibility = "visible";
      else if ($t.cur == -$t.STEP * 3)  
        left.style.visibility = "hidden";
    }
    else {
      if ($t.cur == -$t.STEP * 2)
        left.style.visibility = "visible";
      else if($t.cur == 0)
        right.style.visibility = "hidden";
    }
   
    if (($t.cur > $t.LIMIT && $t.dir == -1) || ($t.cur < 0 && $t.dir == 1))
      setTimeout("ToggleBtnMgr._step()", 20);
  }
}

/*******************************************
* CheckButtonMgr
* curently, it has one style
********************************************/
var CheckButtonMgr = {
  classes : new Array("iphone_checkbox"),
  
  substitute : function(div) {
    if (div == null)
      return;

    if (typeof div == 'undefined')
      div = document.body;
    
    var inputs = div.getElementsByTagName('input');
    for(var i=0; i < inputs.length; i++) {
			var stlIdx;
			if (inputs[i].getAttribute('type') == 'checkbox')
				stlIdx = 0;
			else continue;		
			
			var isSubstituted = false;
	  	var nextElem = getNextSibling(inputs[i])
			if (nextElem && isElemOfClass(nextElem, ["iphone_checkbox"]))
				isSubstituted = true; // this element was already subsituted in JAVA or JS

			// no need to process hidden checkboxes that were not substituted on server-side
			if (stlIdx == 0 && !isSubstituted && getElementStyle(inputs[i]).display == 'none')
    		continue;

			// native element was substituted in JAVA or JS
			if (isSubstituted) {
				if (!nextElem.onclick) // assign handler if need
					nextElem.onclick = this.onClick;
				continue; 
			}
				
			// create checkbox
			var div = document.createElement('div');
      div.className = this.classes[stlIdx];
      div.onclick = this.onClick;
  
      // change initial state if need
      if(inputs[i].checked || inputs[i].value.toLowerCase() == "yes")
        this.setState(div, inputs[i], true);

       // replace a checkbox with div
      inputs[i].parentNode.insertBefore(div, inputs[i].nextSibling);
      inputs[i].style.display = 'none';
    }
  },
  
  onClick : function(event) {
    var $t = CheckButtonMgr;
    var btn = this;
    var checkbox = getPreviousSibling(btn);
    $t._switchState(btn, checkbox);

		if (checkbox.onclick)
			checkbox.onclick(event);
			
		stopEventPropagation(event);
  },

  _switchState : function(btn, input) {
		var stl = getElementStyle(btn);
    var xPos = stl.backgroundPosition || stl.backgroundPositionX;
    var isChecked = (xPos && xPos.length != 0 && xPos.indexOf("0") != 0);
    this.setState(btn, input, !isChecked);
  },

	// toSetCheckboxValue is not required; used for hidden or text field
	// to set pair "on"/"" instead "Yes"/"No"; default: false
  setState : function(btn, input, checkState, toSetCheckboxValue) {
 		if (input.type == "checkbox") 
			input.checked = checkState;
		else { // hidden or text field
			var checkStateStr;
			if (typeof toSetCheckboxValue != 'undefine' && toSetCheckboxValue) 
				checkStateStr = checkState ? "on" : "";
			else 
				checkStateStr = checkState ? "Yes" : "No";
			
			input.value = checkStateStr;	
		}
    
    if (checkState) {
      btn.style.backgroundPosition = "100% 0%";
    }
    else
      btn.style.backgroundPosition = "0% 0%"
  }
}

//******************************************
// BrowserDialog
// obtains callback or form to send
// optional parameters: this and arguments to invoke a callback
//******************************************
var BrowserDialog = {
	div : null,
	textDiv : null,
	okBtnDiv : null,
	cancelBtnDiv : null,
	promptInp : null,
	
	callbackOrForm : null,
	callbackThis : null,
	callbackParamsArr : new Array(),
	
	isPrompt : false,
	
	init : function() {
		this.div = document.createElement("div");
		this.div.id = "browser_dlg";
		
		this.div.innerHTML = 
			"<table cellspacing=\"0\" cellpadding=\"0\">"
			+ "<tr class=\"top\"><td>"
			+ "</td></tr>"
			+ "<tr align=\"center\" class=\"content\"><td>"
			+ "<div class=\"statement\"></div>"
			+ "<input class=\"prompt_text\" type=\"text\">"
			+ "<div align=\"center\">"
			+ "<table class=\"btns_panel\"><tr><td>"
			+ "<div class=\"iphone_dlg_btn\">Ok</div>"
			+ "</td><td>"
			+ "<div class=\"iphone_dlg_btn\">Cancel</div>"
			+ "</td></tr></table>"
			+ "</div>"
			+ "</td></tr>"
			+ "<tr class=\"bottom\"><td>"
			+ "</td></tr>";

		document.body.appendChild(this.div);
		this.textDiv = getChildByClassName(this.div, "statement");
		var btnsPanel = getChildByClassName(this.div, "btns_panel");
		var btns = btnsPanel.getElementsByTagName("div");
		this.okBtnDiv = btns[0];
		this.okBtnDiv.onclick = this.onok;
		this.cancelBtnDiv = btns[1];
		this.cancelBtnDiv.onclick = this.oncancel;
		this.promptInp = getChildByClassName(this.div, "prompt_text");
  },
	
	// okBtnLabel, cancelBtnLabel are not required parameters
	// in all 3 following functions	
	alert : function(msg, okBtnLabel) {
		this.show("alert", msg, null, okBtnLabel, null);
	},
	
	confirm : function(msg, callbackOrForm, okBtnLabel, cancelBtnLabel) {
		this.show("confirm", msg, callbackOrForm, okBtnLabel, cancelBtnLabel);
	},
	
	prompt : function(msg, callbackOrForm, okBtnLabel, cancelBtnLabel) {
		this.show("prompt", msg, callbackOrForm, okBtnLabel, cancelBtnLabel);
	},
	
	// setCallbackThis allows to provide callback with this object
	setCallbackThis : function(thisObj) {
		this.callbackThis = thisObj;
	},
	
	// setCallbackArguments allows to provide callback with needed arguments
	setCallbackArguments : function(/* arguments */) {
		// reserve 1st index for return value of the dialog
		this.callbackParamsArr[0] = null;
		for (i = 0; i < arguments.length; i++)
			this.callbackParamsArr[i + 1] = arguments[i]; 
	},
	
	show : function(type, msg, callbackOrForm, okBtnLabel, cancelBtnLabel) {
		if (this.div == null)
			this.init();
		
		// set at window center
	  var wndSize = getWindowSize();
		var dlgWidth = this.div.clientWidth;
		var dlgHeight = this.div.clientHeight;

	  var scroll = getScrollXY();
		var style = this.div.style;
		if (wndSize[0] > dlgWidth)
		  style.left = Math.ceil((wndSize[0] - dlgWidth) / 2)  + scroll[0];
		else
		  style.left = scroll[0] + 2;
		
		if (wndSize[1] > dlgHeight)  
		  style.top = Math.ceil((wndSize[1] - dlgHeight) / 2)  + scroll[1];
    else
      style.top = scroll[1] + 2;

		this.textDiv.innerHTML = msg;
		if (!okBtnLabel)
			okBtnLabel = "OK";
		if (!cancelBtnLabel)
			cancelBtnLabel = "Cancel";
		
		this.okBtnDiv.innerHTML = okBtnLabel;
		if (type != 'alert') {
			this.cancelBtnDiv.innerHTML = cancelBtnLabel;
			this.cancelBtnDiv.style.display = "";
		}
		else 
			this.cancelBtnDiv.style.display = "none";

		this.promptInp.style.display = (type == "prompt") ? "block" : "none";
		this.div.style.visibility = "visible";	
		
		if (type == "prompt") {
			this.promptInp.focus();
			this.isPrompt = true;
		}
		else
			this.isPrompt = false;

		this.callbackOrForm = callbackOrForm;
	},
	
	onok : function() {
		var $t = BrowserDialog;
		if ($t.callbackOrForm) {
			if (typeof $t.callbackOrForm == 'function') {
		  	if ($t.isPrompt) {
		  		$t.callbackParamsArr[0] = $t.promptInp.value;
		  		$t.callbackOrForm.apply($t.callbackThis, $t.callbackParamsArr);
		  	}
		  	else {
		  		$t.callbackParamsArr[0] = true;
		  		$t.callbackOrForm.apply($t.callbackThis, $t.callbackParamsArr);
		  	}
		  }
			// submit form
		  else {
				if (Browser.mobile) {
					var url = FormProcessor.onSubmitProcess(null, $t.callbackOrForm);
					Mobile.getPage(null, url, false); // 'false' - response to show in a new "mobile" page
				}
				else
		  		$t.callbackOrForm.submit();
		  }
		}

		$t.hide();
	},
	
	oncancel : function() {
		var $t = BrowserDialog;
		if ($t.callback) {
			if (!$t.isPrompt) {
				// confirm
				$t.callbackParamsArr[0] = false;
				$t.callbackOrForm.apply($t.callbackThis, $t.callbackParamsArr);
			}
		}
		$t.hide();
	},
	
	hide : function() {
		var $t = BrowserDialog;
		$t.div.style.visibility = "hidden";
		$t.promptInp.style.display = "none";
		$t.callbackThis = null;
		$t.callbackParamsArr = new Array();
	}
}

// ?
function addOnClickToProfiling() {
  var div = document.getElementById('viewSource');
	if (!div)
		return;
  var elms = div.getElementsByTagName('a');
  var cnt = 0;
  for (var i=0; i<elms.length  &&  cnt < 2; i++) {
    var a = elms[i];
    if (a.href == 'about:blank') {
      var imgs = a.getElementsByTagName('img');
      if (imgs == null  ||  imgs.length == 0)
        continue;
      if (imgs[0].src.indexOf('profiling') != -1) { 
      addEvent(a, 'click',  function (event) {PlainDlg.showPreloaded(event, 'profiling'); return stopEventPropagation(event);},  false);
        cnt++;
      }
      else if (imgs[0].src.indexOf('PropertyDeveloper') != -1) { 
        addEvent(a, 'click',  function (event) {PlainDlg.showPreloaded(event, 'devZone'); return stopEventPropagation(event);},  false);
        cnt++;
      }
    }
  }
}

// replace css with 'cssTitle' with the css from 'file' 
function changeCss(cssTitle, file) {
  var i;
  var done = false;
  var linkTag = document.getElementsByTagName("link");
  if (!linkTag)
    return;
  for (i = 0; i < linkTag.length ; i++ ) {
    var link = linkTag[i];
    var title = link.title;
    
    if (title  &&  link.rel.indexOf("stylesheet") != -1 && title == cssTitle) {
      var href = link.getAttribute("href");
      if (href == file) { 
        if (link.disabled) {
          link.disabled = false; // enable and continue looping so that we can disable another css which is active now
          done = true;
        }  
        else
          return; // same css is already set and enabled
      }  
      
      if (link.disabled == true) // skip disabled css
        continue;
      
      link.disabled = false; // do nto remove, just disable so that we can switch back to this quickly
      if (done)
        return;
      
      var ref = document.createElement('link');
      ref.setAttribute("rel", "stylesheet");
      ref.setAttribute("type", "text/css");
      ref.setAttribute("title", cssTitle);
      ref.setAttribute("href", file);
      document.getElementsByTagName("head")[0].appendChild(ref);
      /*      
      if(!!(window.attachEvent && !window.opera)) ref.styleSheet.cssText = asd;//this one's for ie
      else ref.appendChild(document.createTextNode(asd));
      */
      return;
    }
  }
}
// FTS improvements
function showHide(id, event) {
  var tt = document.getElementById(id);
  if (tt.className  &&  tt.className == 'hdn')
    tt.className = '';
  else
    tt.className = 'hdn';
  
  return stopEventPropagation(event);
}

function showHideDidYouMean(event) {
  showHide('didYouMean', event);
  var img = document.getElementById('fts_arrow'); 
  if (img.src.indexOf('icons/sortedDescending.png') != -1) 
    img.src = 'icons/sortedAscending.png'; 
  else 
    img.src = 'icons/sortedDescending.png'; 
}
// redefines standart alert() function
function alert(text) {
	BrowserDialog.alert(text, null ,"yes");
}
// displays description in full after clicking on '>>' in RL
function displayInFull(e) {
  var a = getTargetElement(e);
  var id = a.id;
  var div = document.getElementById(id.substring(0, id.length - 5)); 
  document.getElementById(id).style.display='none'; 
	// insert TR and move there text
	var parentTable = getAncestorByTagName(a, "table");
	var propsTR = getAncestorByTagName(parentTable, "tr");
	var id = propsTR.id; 
    var newTR = document.createElement("tr");
	if (id  &&  id.indexOf("uri") == 0  &&  isDigit(id.charAt(3)))
      newTR.id = id + "_displayInFull";    	  
	newTR.className = propsTR.className; 
	var newTD = document.createElement("td");
	newTD.setAttribute("colspan", 50); // use colspan pretty big
	newTD.appendChild(div);
	div.className = "";
	div.innerHTML = div.innerHTML.replace(/\n/g, "<br />");
	newTR.appendChild(newTD);
	insertAfter(propsTR.parentNode, newTR, propsTR);
	
  return stopEventPropagation(e);
}
// flag that menu.js was parsed
g_loadedJsFiles["menu.js"] = true;