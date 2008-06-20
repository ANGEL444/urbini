    // cross-browser - getCurrentTarget
    /*
     * Cross-browser method of adding event handlers.
     * If useCapture is true - handler is registered for 'capture phase', otherwise for 'bubbling phase'.
     * Although IE6- does not support capture - so we always pass false.
     */
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

    function removeEvent(obj, evType, fn, useCapture) {
      if (obj.removeEventListener) {
        obj.removeEventListener(evType, fn, useCapture);
        return true;
      }
      else if (obj.detachEvent) {
        var r = obj.detachEvent("on" + evType, fn);
        return r;
      }
      else {
        alert("You need to upgrade to a newer browser. Error: 'event handler could not be removed'");
      }
    }

    //***** upon iframe loading inform the parent
    function onLoadPopup() {
      if (parent && parent.frameLoaded)
        parent.frameLoaded[window.name] = true;
    }

    //***** Add smartlistbox handlers
    function addHandlers(event) {
      if (window.parent != window) {
        onLoadPopup();
        return;
      }

      if (typeof Mobile != 'undefined') {
        Boost.init(event);
        Mobile.init(event);
		    MobilePageAnimation.init();
        MobileMenuAnimation.init();
      } else {
        FormProcessor.initForms();
        DragEngine.initialize();
        
		    addSpellcheck();
		    dictionaryHandler.init();
		    Tooltip.init();

        if (typeof addEventOnSchedule != 'undefined')
          addEventOnSchedule();
      }

        
//      Packages.java.lang.System.out.println('onLoad 4: ' + new Date());
//      if (typeof searchHighlighting != 'undefined')
//        searchHighlighting();
//      if (typeof replaceAllTooltips != 'undefined')
//        replaceAllTooltips();
		// initialize the drag & drop engine.

		  // The URL bar is hidden when running on the iPhone.
		  if (navigator.userAgent.indexOf('iPhone') != -1) {
		    window.scrollTo(0, 1);
		  }
    }

    /*
    function resourceListEdit(div) {
      var elements;
      if (div)
        elements = div.getElementsByTagName('img');
      else
        elements = document.getElementsByTagName('img');
      llen = elements.length;
      for (var i=0;i<llen; i++) {
        var elem = elements[i];
        addBooleanToggle(elem);
      }
    }
    */

    /****************** launch JS on "DOM ready" ****************/
    var agent = navigator.userAgent;
    var isGecko  = (agent.indexOf("Gecko") != -1 && agent.indexOf("Safari") == -1 && agent.indexOf("Konqueror") == -1);
    var versionindex = agent.indexOf("Opera") + 6;
    var ver = agent.substring(versionindex);
    var v = parseFloat(ver);
    var isOpera9 = (typeof opera != 'undefined') && (v >= 9);

    if (isOpera9 || isGecko)
      document.addEventListener("DOMContentLoaded", addHandlers, false);
    else if (typeof document.readyState != 'undefined') { // WebKit & IE
      var _timer = setInterval(function() {
          if (/loaded|complete/.test(document.readyState)) {
              clearInterval(_timer);
              addHandlers();
          }
      }, 10);
    }
    else
      addEvent(window, 'load', addHandlers, false);
