function copyToClipboard(text2copy) {
  var FLASHCOPIER_ID = 'flashcopier';
  if (window.clipboardData) {
    window.clipboardData.setData("Text",text2copy);
  } else {
    if(!document.getElementById(FLASHCOPIER_ID)) {
      var flashcopier = document.createElement('div');
      flashcopier.id = FLASHCOPIER_ID;
      document.body.appendChild(flashcopier);
    }
    if(typeof flashcopier == 'undefined')
      var flashcopier = document.getElementById(FLASHCOPIER_ID);
    flashcopier.innerHTML = '';
    var divinfo = '<embed src="_clipboard.swf" FlashVars="clipboard='+escape(text2copy)+'" width="0" height="0" type="application/x-shockwave-flash"></embed>';
    flashcopier.innerHTML = divinfo;
  }
}

/*************************************************
*	RteEngine
**************************************************/
function initRTE(iframeId, rteDataFieldId, rtePref) {
  setTimeout(function() { RteEngine.register(iframeId, rteDataFieldId, rtePref); }, 200);
}

var RteEngine = {

	// RTE types description
	simpleRTE : {
		autoClose:true,
		isFewFonts:true,
		buttons:{
			style:true,	font:true, decoration:true,	align:true,	dent:true,
			list:true, text_color: true, bg_color: true, link: true,
			image: true, object: true, smile:false, line: true, table:false, supsub:true, reundo:true, html:true
		}
	},
	chatRTE : {
		autoClose:false,
		isFewFonts:true,
		buttons:{
			style:false, font:true, decoration:true, align:true, dent:true,
			list:true, text_color: true, bg_color: true, link: true,
			image: true, object: true, smile:true, line: true, table:false, supsub:false, reundo:true, html:false
		}
	},
	advancedRTE : {
		autoClose:false,
		isFewFonts:false,
		buttons:{
			style:true,	font:true, decoration:true,	align:true,	dent:true,
			list:true, text_color: true, bg_color: true, link: true,
			image: true, smile:false, line: true, table:true, supsub:true, reundo:true, html:true
		}
	},
	// ----------------------------

	IMAGES_FOLDER : "images/wysiwyg/",
	STYLES : [{name:"Paragraph", value:"<p>"}, {name:"Heading 1", value:"<h1>"}, {name:"Heading 2", value:"<h2>"}, {name:"Heading 3", value:"<h3>"}, {name:"Heading 4", value:"<h4>"},
		{name:"Heading 5", value:"<h5>"}, {name:"Heading 6", value:"<h6>"}, {name:"Address", value:"<address>"}, {name:"Formatted", value:"<pre>"}],
	FONTS : ["arial", "arial black", "comic sans ms", "courier", "courier new", "georgia", "helvetica", "impact", "palatino", "times new roman", "trebuchet ms", "verdana"],
	FONTS_FEW : ["arial", "arial black", "comic sans ms", "courier new", "helvetica", "times new roman", "verdana"],
	FONT_SIZE : [{name:"0.6em", value:"lz_xx_small"}, {name:"0.75em",value:"lz_x_small"}, {
  	name: "0.89em",	value: "lz_small"}, {name:"1em",value:"lz_medium"}, {name:"1.2em",value:"lz_large"}, {name:"1.5em",value:"lz_x_large"}, {name:"2em",value:"lz_xx_large"}, {name:"3em",value:"lz_xxx_large"}],

  IMG_ATTRIBS_TO_DELETE : ["className", "class", "handler_mouseout", "handler_mouseover",
     "onclick", "allow", "tooltip", "id", "title"],

	rteArr : new Array(), // objects
	uploadForm : null,

	// POPUPs; globals for all rte objects --
	stylePopup : null,
	fontPopup : null,
	fewFontPopup : null, // short list of fonts
	sizePopup : null,
	smilePopup : null,
	textColorPopup : null,
	bgColorPopup : null,
	linkPopup : null,
	imagePopup : null,
	objectPopup : null,
	imagePastePopup : null,
	tablePopup : null,

  toUseTArea : false,

  curRteId : -1,
  
	//register the RTEs.
	register : function(iframeId, rteDataFieldId, rtePref) {
    var iframeObj = document.getElementById(iframeId);

		if(typeof rtePref == 'undefined')
			rtePref = this.simpleRTE;

		if(iframeObj.id	== "")
			iframeObj.id = new Date().getTime();

		var rteObj = null;
		if(this.toUseTArea == false) {
		  try {
			  rteObj = new Rte(iframeObj, rteDataFieldId, rtePref);
		  }catch(e) {	this.toUseTArea = true;}
		}
    
    if(this.toUseTArea)
  	  rteObj = new TArea(iframeObj, rteDataFieldId, rtePref);

		if(rteObj != null)
			this.rteArr.push(rteObj);
	},

	// put RTE data into a hidden field
	// keepRte means that RTE object is keeping for further use.
	// by default the RTE object will be removed from  RteEngine.
	putRteDataOfForm : function(formObj, keepRte) {
		var iframes;
		if(this.toUseTArea == false)
		  iframes = formObj.getElementsByTagName('iframe');
		else
		  iframes = formObj.getElementsByTagName('textarea');
		  
		for(var i = 0; i < iframes.length; i++) {
			var idx = RteEngine.getRteIndex(iframes[i])
			if(idx != -1) {
				RteEngine.rteArr[idx].putRteData();

				// delete rte from the RteEngine
				if(typeof keepRte == 'undefined' || keepRte == false) {
					RteEngine.rteArr.splice(idx, 1);
				}
			}
		}
	},
	// param: obj is rte-object or its id
	getRteIndex : function(obj) {
	  var id;
	  if(typeof obj == "string")
	    id = obj;
	  else
      id = obj.id;
 
		for(var i = 0; i < this.rteArr.length; i++) {
			if(this.rteArr[i].getId() == id)
				return i;
		}
		return -1; // iframe is not a RTE
	},
	getRteById : function(id) {
	  var index = this.getRteIndex(id);
	  if(index == -1)
	    return null;
	  return this.rteArr[index];
	},
	// close all disactived except in html preview mode
	closeAllDisactived : function(activeId) {
		for(var i = 0; i < this.rteArr.length; i++)
			if(this.rteArr[i].iframeObj.id != activeId)
				this.rteArr[i].onlosefocus();
	},

	getHostUrl : function() {
		var url = window.location.protocol + "//" + window.location.host + "/";
		return url;
	},

	// launch popups (create a popup on 1st demand) --------
	launchStylePopup : function(btnObj, callback) {
		if(this.stylePopup == null)
			this.createStylePopup();
		var parentDlg = getParentDialog(btnObj.div);
		this.stylePopup.show(btnObj, 'left', callback, parentDlg);
		return this.stylePopup.div;
	},
	launchFontPopup : function(btnObj, callback, isFewFonts) {
		if(typeof isFewFonts != 'undefined' && isFewFonts == true) {
			return	this._launchFewFontPopup(btnObj, callback);
		}
		if(this.fontPopup == null)
			this.createFontPopup();
		var parentDlg = getParentDialog(btnObj.div);
		this.fontPopup.show(btnObj, 'left', callback, parentDlg);
		return this.fontPopup.div;
	},
	_launchFewFontPopup : function(btnObj, callback) {
		if(this.fewFontPopup == null)
			this.createFewFontPopup();
		var parentDlg = getParentDialog(btnObj.div);
		this.fewFontPopup.show(btnObj, 'left', callback, parentDlg);
		return this.fewFontPopup.div;
	},
	launchSizePopup : function(btnObj, callback) {
		if(this.sizePopup == null)
			this.createSizePopup();
		var parentDlg = getParentDialog(btnObj.div);
		this.sizePopup.show(btnObj, 'left', callback, parentDlg);
		return this.sizePopup.div;
	},
	launchSmilePopup : function(btnObj, callback) {
		if(this.smilePopup == null)
			this.createSmilePopup();
		var parentDlg = getParentDialog(btnObj.div);
		this.smilePopup.show(btnObj, 'right', callback, parentDlg);
		return this.smilePopup.div;
	},
	launchTextColorPopup : function(btnObj, callback, chosenTextClr) {
		var parentDlg = getParentDialog(btnObj.div);
		PalettePopup.show(btnObj, 'center', callback, parentDlg, null, chosenTextClr);
		return PalettePopup.div;
	},
	launchBgColorPopup : function(btnObj, callback, chosenBgClr) {
		var parentDlg = getParentDialog(btnObj.div);
		PalettePopup.show(btnObj, 'center', callback, parentDlg, null, chosenBgClr);
		return PalettePopup.div;
	},
	launchLinkPopup : function(btnObj, callback, cancelCallback, href) {
		if(this.linkPopup == null)
			this.createLinkPopup();
		var parentDlg = getParentDialog(btnObj.div);
		
		this.linkPopup.show(btnObj, 'center', callback, parentDlg, cancelCallback);
		var div = this.linkPopup.div;
		// set url field value
		if (href)
		  getChildById(div, "url").value = href;
		return div;
	},
	launchImagePopup : function(btnObj, callback, rteId, cancelCallback) {
		if(this.imagePopup == null)
			this.createImagePopup();
		else {
		  var innerFormHtml = ImageUploader.getUploadImageFormContent("RteEngine.onImageFormSubmit(event)", "insert");
		  this.imagePopup.changeContent(innerFormHtml);
		}	
	  
	  this.curRteId = rteId;
	  
	  var form = this.imagePopup.getForm();
	  ImageUploader.putRteIdInForm(form, rteId);		
		var parentDlg = getParentDialog(btnObj.div);
		this.imagePopup.show(btnObj, 'center', callback, parentDlg, cancelCallback);
		return this.imagePopup.div;
	},
	launchObjectPopup : function(btnObj, callback, cancelCallback) {
		if(this.objectPopup == null)
			this.createObjectPopup();
		var parentDlg = getParentDialog(btnObj.div);
		this.objectPopup.show(btnObj, 'center', callback, parentDlg, cancelCallback);
		return this.objectPopup.div;
	},
	launchImagePastePopup : function(rteId) {
		if(this.imagePastePopup == null)
			this.createImagePastePopup();
		else { // need to "reload" form content, because input file is read-only
		  var innerFormHtml = "<div style=\"font-family:verdana; font-size:12px\">"
        + "You pasted image that requires uploading.<br />Press \"Ctrl\" + \"V\" and then submit.</div>"
		    + ImageUploader.getUploadImageFormContent("RteEngine.onImagePasteFormSubmit(event)", "submit");
		  this.imagePastePopup.changeContent(innerFormHtml);
	  }
	  
	  this.curRteId = rteId;
	  
 	  var form = this.imagePastePopup.getForm();
	  ImageUploader.putRteIdInForm(form, rteId);		

    var rteObj = this.getRteById(rteId);
    var rteIframe = rteObj.getIframe();
 		var parentDlg = getParentDialog(btnObj.div);
    this.imagePastePopup.show(rteIframe, "inside", null, parentDlg, this.onCanceledUploadPastedImage);
		
		return this.imagePastePopup.div;
	},
	launchTablePopup : function(btnObj, callback, cancelCallback) {
		if(this.tablePopup == null)
			this.createTablePopup();
		var parentDlg = getParentDialog(btnObj.div);
		this.tablePopup.show(btnObj, 'center', callback, parentDlg, cancelCallback);
		return this.tablePopup.div;
	},

	// create popup --------------
	// possible the style popup should be unique for each RTE (documend)
	// on this moment it uses 1st RTE onject
	createStylePopup : function() {
		this.stylePopup = new MyDropdownList();
		var len = this.STYLES.length;
		for(var i = 0; i < len; i++) {
		
  		var itemDiv;	
  		var userAgent = navigator.userAgent.toLowerCase();
	  	 // Opera & Safari do not want to work with font directly
	  	if(userAgent.indexOf('opera') != -1 || userAgent.indexOf('safari') != -1 )
		  	itemDiv = document.createElement('div');
			else
			  itemDiv = document.createElement(this.STYLES[i].value);
			
			itemDiv.style.margin = 0;
			itemDiv.innerHTML = this.STYLES[i].name;
			this.stylePopup.appendItem(itemDiv);
		}
	},
	createFontPopup : function() {
		var FONT_SIZE = 14;
		this.fontPopup = new MyDropdownList();
		var len = this.FONTS.length;
		for(var i = 0; i < len; i++) {
			var itemDiv = document.createElement('div');
			itemDiv.innerHTML = this.FONTS[i];
			itemDiv.style.fontFamily = this.FONTS[i];
			itemDiv.style.fontSize = FONT_SIZE;
			this.fontPopup.appendItem(itemDiv);
		}
	},
	createFewFontPopup : function() {
		var FONT_SIZE = 14;
		this.fewFontPopup = new MyDropdownList();
		var len = this.FONTS_FEW.length;
		for(var i = 0; i < len; i++) {
			var itemDiv = document.createElement('div');
			itemDiv.innerHTML = this.FONTS_FEW[i];
			itemDiv.style.fontFamily = this.FONTS_FEW[i];
			itemDiv.style.fontSize = FONT_SIZE;
			this.fewFontPopup.appendItem(itemDiv);
		}
	},
	createSizePopup : function() {
		this.sizePopup = new MyDropdownList();
		for(var i = 0; i < this.FONT_SIZE.length; i++) {
			var itemDiv = document.createElement('div');
			itemDiv.innerHTML = "<NOBR><span class='" + this.FONT_SIZE[i].value + "'>" + (i + 1) + "</span>"
				+ " (" + this.FONT_SIZE[i].name + ")</NOBR>";
			this.sizePopup.appendItem(itemDiv);
		}
		this.sizePopup.setWidth(50);
	},
	createObjectPopup : function() {
		var innerFormHtml = '<table style="font-family:verdana; font-size:12px" cellpadding="4" cellspacing="0" border="0">'
			+ ' <tr>'
			+ ' <td align="left">Paste html code:</td>'
			+ ' </tr><tr>'
			+ ' <td><textarea name="html" type="text" id="html" rows="4" cols="50"></textarea></td>'
      + ' </tr>'
			+ '</table>';
		this.objectPopup = new FormPopup(innerFormHtml);
	},
	createSmilePopup : function() {
		var SMILES_AMT = 30;
		var PADDING = 5;
		var SMILE_SIZE = 19;
		this.smilePopup = new MyDropdownList(5);
		for(var i = 0; i < SMILES_AMT; i++) {
			var itemDiv = document.createElement('div');
			var imgPath = this.IMAGES_FOLDER + "smiles/" + (i + 1) + ".gif";
			itemDiv.innerHTML =
			  "<img src=" + imgPath + " width=" + SMILE_SIZE + " height=" + SMILE_SIZE + ">";

			itemDiv.style.padding = PADDING;
			this.smilePopup.appendItem(itemDiv);
		}
	},

	createLinkPopup : function() {
		var innerFormHtml = '<table style="font-family:verdana; font-size:12px" cellpadding="4" cellspacing="0" border="0">'
			+ ' <tr>'
			+ ' <td align="left">Enter URL:</td>'
			+ ' </tr><tr>'
			+ ' <td><input name="url" type="text" id="url" value="" size="35"></td>'
			+ ' </tr><tr>'
  		+ ' <td><input name="is_blank" type="checkbox" id="is_blank">load into a new window</td>'
      + ' </tr>'
			+ '</table>';
		this.linkPopup = new FormPopup(innerFormHtml);
	},
	createImagePopup : function() {
		var innerFormHtml = ImageUploader.getUploadImageFormContent("RteEngine.onImageFormSubmit(event)", "insert");
		this.imagePopup = new FormPopup(innerFormHtml, "USE_SUBMIT_BTN");
	},
  createImagePastePopup : function() {
  	var innerFormHtml = "<div style=\"font-family:verdana; font-size:12px\">"
    + "You pasted image that requires uploading.<br />Press \"Ctrl\" + \"V\" and then submit.</div>"
		+ ImageUploader.getUploadImageFormContent("RteEngine.onImagePasteFormSubmit(event)", "submit");
		this.imagePastePopup = new FormPopup(innerFormHtml, "USE_SUBMIT_BTN");
  },
	createTablePopup : function() {
		var innerFormHtml = this.getInsertTableHtml();
		this.tablePopup = new FormPopup(innerFormHtml);
	},
  
  // create END --------------------------------
	getInsertTableHtml : function() {
		var tblInsertHtml = '<table style="font-family:verdana; font-size:12px" cellpadding="4" cellspacing="0" border="0">'
			+ ' <tr>'
			+ ' <td align="left">Table width:</td>'
			+ ' <td><input name="width" type="text" id="width" value="90" size="4"></td>'
			+ ' <td align="left">'
				+ ' <select name="widthType" id="widthType">'
					+ ' <option value="px">pixels</option>' // value="pixels"
					+ ' <option value="%" selected>percent</option>' //value="percent"
					+ ' </select>'
				+ ' </td>'
			+ ' <tr>'
			+	' <td align="left">Rows:</td>'
			+	' <td><input name="rows" type="text" id="rows" value="2" size="4"></td>'
			+ ' </tr>'
			+	' <td align="left">Columns:</td>'
			+ ' <td><input name="columns" type="text" id="columns" value="2" size="4"></td>'
			+ ' </tr>'
			+ ' <tr>'
			+ ' </tr>'
			+ ' <tr>'
				+ ' <td align="left">Border thickness:</td>'
				+ ' <td><input name="border" type="text" id="border" value="1" size="4"></td>'
				+ ' <td align="left">pixels</td>'
			+ ' </tr>'
			+ ' <tr>'
				+ ' <td align="left">Cell padding:</td>'
				+ ' <td><input name="padding" type="text" id="padding" value="0" size="4"></td>'
				+ ' </tr>'
				+ ' <tr>'
				+ ' <td>Cell spacing:</td>'
				+' <td><input name="spacing" type="text" id="0" value="0" size="4"></td>'
			+ ' </tr>'
		+ ' </table>';

		return tblInsertHtml;
	},
	
	// ------------------------------------------
	// onPasteHandler - (entersepts image paste only)
	onPasteHandler : function(rteId) {
    var rteObj = RteEngine.getRteById(rteId);
    if(rteObj == null)
      return;

    var rteDoc = rteObj.getDocument();
    
    var imgUrlsArr = rteObj.getImgUrlsArray();
    this.currentImgUrlsArr = imgUrlsArr;
    
    var images = rteDoc.getElementsByTagName("img");
    if(images.length == 0)
      return;
 
    // loop all images
    for(var i = 0; i < images.length; i++) {
      var src = images[i].src;
      // 1. skip already loaded and waiting for responce images
      if(ImageUploader.isImageHandled(imgUrlsArr, src))
        continue;
      // cleanup: remove inserted image attributes
      for(var atrIdx = 0; atrIdx < this.IMG_ATTRIBS_TO_DELETE.length; atrIdx++) {
        images[i].removeAttribute(this.IMG_ATTRIBS_TO_DELETE[atrIdx]);
      }
      // skip web-images
      if(ImageUploader.isImageLocal(images[i]) == false)
        continue;

      // 2. check if it is copy of already loaded image
      var uplUrlOfCopy = ImageUploader.getUploadedUrlOfCopy(imgUrlsArr, src);
      if(uplUrlOfCopy != null) {
        images[i].src = uplUrlOfCopy;
        continue;
      } 

      // 3. required uploading
      // 3.2 copy to clipboard
      src = decodeURI(src); // IE
      
      var ua = navigator.userAgent.toLowerCase();
      var isGecko = (ua.indexOf("gecko") != -1);
      if(src.indexOf("file:///") == 0 && !isGecko) // IE
        src = src.substr(8);
      
      copyToClipboard(src);
      // 3.2.3 show the dialog
      this.launchImagePastePopup(rteId);
    }
  },
  
  onImageFormSubmit : function() {
  	var $t = ImageUploader;

  	var imgUrl = null;
	  var form = RteEngine.imagePopup.getForm();
	  imgUrl = ImageUploader.getImagePathFromForm(form);
	  if(imgUrl == null)
	    return false;
	  
		var sel = getChildById(form, $t.IMG_ALIGN_ID);
		var align = sel.options[sel.selectedIndex].value;
	  var margin = getChildById(form, $t.MARGIN_ID).value; 
		
	  RteEngine.imagePopup.hide();
	  var rteObj = RteEngine.getRteById(RteEngine.curRteId);

    var selRadioIdx = $t.getSelectedRadioBtnIdx(form);
	  // insert image
	  var encImgUrl = encodeURI(imgUrl);
	  rteObj.setImage(encImgUrl, align, margin, selRadioIdx);

	  // URL - no uploading
	  if($t.isImageLocal(imgUrl) == false || selRadioIdx == 1) {
	    return false;
	  }
	  
	  // mark image as waiting
	  var urlPairsArr = rteObj.getImgUrlsArray();
	  $t.markImageAsWaiting(urlPairsArr, encImgUrl);
	  
    $t.onHdnDocLoad(RteEngine.curRteId, encImgUrl);
	  
	  return true;
	},
	onImagePasteFormSubmit : function() {
	  var thisObj = ImageUploader;
	  var imgUrl = null;
	  var form = RteEngine.imagePastePopup.getForm();
	  imgUrl = thisObj.getImagePathFromForm(form);
	  if(imgUrl == null)
	    return false;
	
	  copyToClipboard(" ");
    RteEngine.imagePastePopup.hide();
	  
	  // not upload web-image
	  if(ImageUploader.isImageLocal(imgUrl) == false)
	    return false;
	  
	  // mark image as waiting
	  var rteObj = RteEngine.getRteById(RteEngine.curRteId);
	  var urlPairsArr = rteObj.getImgUrlsArray();
	  thisObj.markImageAsWaiting(urlPairsArr, imgUrl);
	  
	  //set align
	  var align = thisObj.getImageAlignFromForm(form);
    var image = thisObj.getImageByOrigUrl(rteObj, imgUrl);
    if(image)
      image.setAttribute("align", align);
	  
	  thisObj.onHdnDocLoad(RteEngine.curRteId, imgUrl);
	  return true;
	}, 
  onCanceledUploadPastedImage : function() {
    var rteObj = RteEngine.getRteById(RteEngine.curRteId);
    rteObj.onUndo(); // does not work with IE!
  }

}

/***********************************************
* ImageUploader
*
* only local user's images need to be loaded
************************************************/
var ImageUploader = {
  // image uploading (insertion) dialog
  FORM_NAME         : "image_uploading",
  ACTION_URL        : "mkresource", // TODO:
  FILE_INPUT_NAME   : "file",
  RTE_ID_INPUT_NAME : "rte_id",
  IMG_ALIGN_ID      : "img_align",
	MARGIN_ID         : "img_margin",

  HDN_IFRAME_NAME   : "imageUploadingIframe",
  WAIT_FLAG : "waiting",
 
  newImgPair : null,
  
  getUploadImageFormContent : function(submitCallbackName, submitBtnText) {
		var forms = document.forms;
    var resourceUri;
    for (var i=0; i<forms.length; i++) {
      if(forms[i].name  &&  forms[i].name.indexOf('tablePropertyList$') == 0
          && forms[i].elements['uri']) {
        resourceUri = forms[i].elements['uri'].value;
        break;
      }
    }

    var formStr = "<form name=\"" + this.FORM_NAME + "\""
      + " target=\"" + this.HDN_IFRAME_NAME + "\""
      + " method=\"post\""
      + " enctype=\"multipart/form-data\""
      + " action=\"" + this.ACTION_URL + "\""
      + " onsubmit=\"return " + submitCallbackName + "\""
      + ">"
      
      + " <table style=\"font-family:verdana; font-size:12px;\"><tr><td>" 
      
      + "<input type=\"radio\" name=\"radio\" onclick=\"ImageUploader.imageLocationSwitch(0)\" checked>upload image"
      + "&nbsp;&nbsp;"
      + "<input type=\"radio\" name=\"radio\" onclick=\"ImageUploader.imageLocationSwitch(1)\">URL of image"
      + "<br/><br/>"
      
      // two fields with the same name:
      // 1) image uploading
      // 2) URL of image
      + " <input type=\"file\" name=\"" + this.FILE_INPUT_NAME + "\""
      + " style=\"font-family:verdana; font-size:12px\""
      + " size=\"40\" onkeyup=\"ImageUploader.enterCatcher(event);\"  style=\"margin-top:20px;\">"
      
      + " <input type=\"text\" name=\"" + this.FILE_INPUT_NAME + "\""
      + " style=\"display: none; font-family:verdana; font-size:12px\""
      + " size=\"45\"  style=\"margin-top:20px;\">"

      + " <input type=\"hidden\" name=\"" + this.RTE_ID_INPUT_NAME + "\""
      + " id=\"" + this.RTE_ID_INPUT_NAME + "\">"
      + " </td></tr>"
      
      + " <tr><td><br/>align:&nbsp;<select id=\"" + this.IMG_ALIGN_ID + "\""
      + " style=\"font-family:verdana; font-size:12px\">"
      + " <option value=\"left\">left</option>"
      + " <option value=\"middle\">middle</option>"
      + " <option value=\"right\">right</option>"
      + " <option value=\"bottom\">bottom</option>"
      + " <option value=\"top\">top</option>"
      + " </select>"
			+ "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;margin:&nbsp;<input value=\"30px\" size=\"12\" type=\"text\" id=\"" + this.MARGIN_ID + "\">"
			+ "</td></tr>"
			
      + " <tr><td align=\"center\"><br/>"
      + " <input type=\"submit\" value=\"" + submitBtnText + "\">"

      + " <input type=\"hidden\" name=\"-$action\" value=\"upload\">"
      + " <input type=\"hidden\" name=\"uri\" value=\""
      + resourceUri      
      + "\">"

      + " </td></tr><table>"
    + " </form>";
    
    return formStr;
  },
  
  imageLocationSwitch : function(idx) {
    var form = RteEngine.imagePopup.getForm();
    var inputs = form[this.FILE_INPUT_NAME];
    var radios = form["radio"];
    
    inputs[idx].style.display = "";
    radios[idx].checked = true;
    
    var idx2 = (idx + 1) % 2; 
    inputs[idx2].style.display = "none";
    radios[idx2].checked = false;
  },
  
  putRteIdInForm : function(form, rteId) {
    var rteIdEnc = encodeURIComponent(rteId);
    var inpObj = getChildById(form, this.RTE_ID_INPUT_NAME); 
    inpObj.value = rteIdEnc;
  },
  
  // radio buttons : // 0) upload 1)URL
  getSelectedRadioBtnIdx : function(form) {
    var radios = form["radio"];
    var selIdx = radios[0].checked ? 0 : 1;
    return selIdx;
  },
  
  getImagePathFromForm : function(form) {
    var selIdx = this.getSelectedRadioBtnIdx(form);
    var inputs = form[ImageUploader.FILE_INPUT_NAME]
    var value = inputs[selIdx].value;
    if (value.length == 0) {
      if (selIdx == 0) 
        alert("No image selected to upload!");
      else
        alert("No URL of image!");
      return null;
    }
    
    // not needed <input>
    var notSelIdx = (selIdx == 0) ? 1 : 0;
    var parent = inputs[notSelIdx].parentNode;
    parent.removeChild(inputs[notSelIdx]);
    
    return value; 
  },
  
  // failed to get correct current value from
  // select in "image paste dialog", so onchange of the select was used.
  // mark image as waiting on the server response
  markImageAsWaiting : function(urlPairsArr, originalUrl) {
    var pair = new ImageUploader.UrlPair(originalUrl, ImageUploader.WAIT_FLAG);
    urlPairsArr.push(pair);
  },

  // callback on the server response.
  onHdnDocLoad : function(rteId, originalUrl) {
		// loop to wait on server response
    var thisObj = ImageUploader;
    var frameId = thisObj.HDN_IFRAME_NAME;
    if (!frameLoaded[frameId]) {
      var timeOutFunction = function () { ImageUploader.onHdnDocLoad(rteId, originalUrl) };
      setTimeout(timeOutFunction, 50);
      return;
    }

    // process the server response.
    frameLoaded[frameId] = false;
    
    // TODO: there is a problem to upload image in Safari and Chrome
    // it looks like those browsers return content not of the hidden iframe but of the main window (?!)
    var frame = window.frames[frameId];
		var frameDoc  = frame.document;
    var frameBody = frameDoc.body;
    var d = frameDoc.getElementById("location");
    if (d)
      frameBody = d;

    uploadedUrl = frameBody.innerHTML;
    
    uploadedUrl = decodeURI( uploadedUrl );

		// reset hidden frame
		frame.location.replace("about:blank");
    // 2. replace url with the uploaded one.  
    // 2.1 get rte object
    var rteObj = RteEngine.getRteById(rteId);
    if(rteObj == null)
      return; // this RTE was canceled.
      // TODO: SUBMISION should be suspended while uploading.

    // 2.2 uploade URL to the images array
    var imgUrlsArr = rteObj.getImgUrlsArray();
    for(var i = 0; i < imgUrlsArr.length; i++) {
      if(imgUrlsArr[i].originalUrl == originalUrl) {
        imgUrlsArr[i].uploadedUrl = uploadedUrl;
      }
    }

    // 2.3 replace URL of the image in the document
    var image = thisObj.getImageByFilePath(rteObj, originalUrl);
    if(image)
      image.src = uploadedUrl;
  },
  
  // "original" means inserted url before replace with uploaded url
  getImageByOrigUrl : function(rteObj, originalUrl) {
    var rteDoc = rteObj.getDocument();
    var images = rteDoc.getElementsByTagName("img");
    originalUrl = originalUrl.toLowerCase();
    for(var i = 0; i < images.length; i++) {
      var src = images[i].src.toLowerCase();
      var decSrc = decodeURI(src);
      if(src.indexOf(originalUrl) != -1 ||
          decSrc.indexOf(originalUrl) != -1) {
        return images[i];
      }
    }
    return null;
  },
  
  getImageByFilePath : function(rteObj, filePath) {
    var rteDoc = rteObj.getDocument();
    var images = rteDoc.getElementsByTagName("img");
    
		// Note: use "class" to identify image to set src=URL returned from server
		// new FF's RTE does not accept cusom parameter like "file_path"
		for(var i = 0; i < images.length; i++) {
      var filePathAttr = images[i].getAttribute("class");
      if(filePathAttr != null &&
          filePathAttr == filePath) {
        images[i].removeAttribute("class");
        return images[i];
      }
    }
    return null;
  },
  
  // image object or its src
  isImageLocal : function(imgObj) {
    var src;
    if(typeof imgObj == 'string')
      src = imgObj;
    else
      src = imgObj.src;
    
    src = src.toLowerCase();
    if(src.indexOf("http") == 0 || src.indexOf("https") == 0)
      return false;

    return true;
  },

  // UrlPair -------------
  UrlPair : function(originalUrl, uploadedUrl) {
    this.originalUrl = originalUrl;
    this.uploadedUrl = uploadedUrl;
  },
  // uploaded or waiting on response
  isImageHandled : function(imgUrlsArr, imgUrl) {
    var isUploaded = this.isImageUploaded(imgUrlsArr, imgUrl);
    var isWaiting = this.isImageWaitingResponse(imgUrlsArr, imgUrl);
    return (isUploaded && isWaiting);
  },
  isImageUploaded : function(imgUrlsArr, src) {
    for(var i = 0; i < imgUrlsArr.length; i++) {
      if(imgUrlsArr[i].uploadedUrl == src)
        return true;
    }
    return false;
  },
  isImageWaitingResponse : function(imgUrlsArr, src) {
    for(var i = 0; i < imgUrlsArr.length; i++) {
      if((imgUrlsArr[i].originalUrl == src) &&
          imgUrlsArr[i].uploadedUrl == this.WAIT_FLAG)
        return true;
    }
    return false;
  },

  getUploadedUrlOfCopy : function(imgUrlsArr, imgUrl) {
  for(var i = 0; i < imgUrlsArr.length; i++) {
      if(imgUrlsArr[i].originalUrl == imgUrl)
        return imgUrlsArr[i].uploadedUrl;
    }
    return null;
  },
	
	enterCatcher : function(event) {
		var code = getKeyCode(event);
		if (code == 13)
			stopEventPropagation(event);
	}
}


/**********************************
* Rte - single rte elemnt.
* toInit used for IE and to prevent initialization before document complitly loaded
***********************************/
function Rte(iframeObj, dataFieldId, rtePref) {
	var i_am = this;
	this.iframeObj = iframeObj;
	this.dataFieldId = dataFieldId;
	this.rtePref = rtePref;
	this.window = null; // window of the iframe
	this.document = null; // document of the iframe
	this.toolbar = null;
	this.parentDiv = this.iframeObj.parentNode;
	this.dataField = null; // hidden field to transfer data
	this.curRange = null;
	this.isSourceView = false;
	this.initFrameHeight = null;

  this.initHtml = ""; // initial content to prevent hisstory change
  
	this.isIE = false;
	this.isOpera = false;
	this.isNetscape = false;

	this.skipClose = false;
	this.FFhacked = false;
  
	this.currentPopup = null; // prevents closing on popup opening
	this.openedAtTime = 0;    // hack: prevents simultaneous openning and toolbar button execution

	// buttons objects
	this.styleBtn = null;
	this.fontBtn = null;
	this.sizeBtn = null;
	this.textColorBtn = null;
	this.bgColorBtn = null;
	this.smileBtn = null;
	this.linkBtn = null;
	this.imageBtn = null;
	this.objectBtn = null;
	this.tableBtn = null;
	this.htmlBtn = null;

  this.chosenTextClr = null; // last chosen colors
  this.chosenBgClr   = null; 
  
  this.imgUrlsArr = new Array(); // pairs of url: 1)orig; 2)uploaded
  
	this.isInitialized = false;

	// init
	this.init = function() {
		if(this.isInitialized)
			return;
		else
			this.isInitialized = true;

		// browser detection
		this.browserDetection();

		// set text and edit mode
		this.window = this.iframeObj.contentWindow;
		this.document = this.window.document;
		if(typeof this.document.designMode == 'undefined') {
		  throw new Error("designMode is not supported");
		}

    if (this.isIE) {
			this.document.designMode = "On";
		}
		
		this.initFrameHeight = this.iframeObj.clientHeight;
		this.initContent();

	  
    if (!this.isIE)
	    this.document.designMode = "On";

		// create toolbar if it is not autoClose
		// else create it on 1st click in - (onfocus handler)
		if(!this.rtePref.autoClose) {
				this.toolbar = this.createToolbar();
				this.iframeObj.style.marginTop = this.toolbar.getHeight() + 1;
		}
		// set handlers
		this.setHandlers();
	  
	  if(this.isNetscape) // turn on Mozila's spellcheck
      this.document.body.spellcheck = true;
    
    if(typeof Browser != 'undefined' && Browser.iPhone)
      this.document.body.style.webkitUserModify = "read-write";
		
		// attempt to overcome black background in Crome.
		this.document.body.style.backgroundColor = "transparent";	
		
		// load css of the parent page
    this.loadCSS();
	}
	
	this.browserDetection = function() {
		if(Browser.ie)
			this.isIE = true;
		else if(Browser.opera)
			this.isOpera = true;
		else if(Browser.gecko)
		  this.isNetscape = true;
	}
	this.setHandlers = function() {
		addEvent(this.iframeObj, "deactivate", this._ondeactivate, false);
		addEvent(this.document, 'keyup', this._onkeyup, false);
		// shows "Link" dialog on double click on a link
		// possible in the futer more actions on double click
		addEvent(this.document, 'dblclick', this._ondblclick, false);
		
		// IE, FF3, Safari: onpaste
		addEvent(this.document.body, 'paste', this._onpaste, false);

		if(this.rtePref.autoClose) {
      addEvent(document, 'click', this.onlosefocus, false);

      if(Browser.ie )
		    addEvent(this.iframeObj, 'focus', this.onfocus, false);
			else if(Browser.safari|| Browser.opera)
			  addEvent(this.window, 'focus', this.onfocus, false);
			else // FF
			  addEvent(this.document, 'focus', this.onfocus, false);
		}
    // to prevent Ctrl + b,i,u,t in FF
  	addEvent(this.document, "keydown", this._onkeydown, false);
	}
  
	this.loadCSS = function() {
		var cssFiles = new Array();
		var sheets = document.styleSheets;
		for (var i = 0; i < sheets.length; i++) {
			if (sheets[i] && sheets[i].href && sheets[i].href.indexOf("common") != -1) {
		  	cssFiles.push(sheets[i].href); // insert only common_****.css file
		  }
		}
		
		for(var i = 0; i < cssFiles.length; i++) {
		  if(this.document.createStyleSheet) {
        this.document.createStyleSheet(cssFiles[i]);
      }
      else {
        var head = this.document.getElementsByTagName('head')[0];
        var css = document.createElement('link');
        css.setAttribute('rel', 'stylesheet');
        css.setAttribute('type', 'text/css');
        css.setAttribute('href', cssFiles[i]);
        head.appendChild(css);
      } 
    }
  }
	
	this.createToolbar = function() {
		// Note: after second insertion of a dialog on mobile, RTE requires new initialization (?!)
		// need to remove old, not effective toolbar (!) 
		// (TODO: to investigate it more)
		var oldToolbar = getChildByClassName(this.iframeObj.parentNode, 'ctrl_toolbar');
		if (oldToolbar != null)
			oldToolbar.parentNode.removeChild(oldToolbar);
		
		// 1.
		var toolBar = new Toolbar(this.parentDiv, this, 32, false, this.iframeObj);
		// 2. add buttons
		if(this.rtePref.buttons.style) // style
			this.styleBtn = toolBar.appendButton(this.onStyle, false, RteEngine.IMAGES_FOLDER + "style.png", "style");
		if(this.rtePref.buttons.font) { // font + size
			this.fontBtn = toolBar.appendButton(this.onFont, false, RteEngine.IMAGES_FOLDER + "font.png", "font");
			this.sizeBtn = toolBar.appendButton(this.onSize, false, RteEngine.IMAGES_FOLDER + "size.png", "size");
		}
		if(this.rtePref.buttons.decoration) { // bold + italic + underline
			toolBar.appendButton(this.onBold, false, RteEngine.IMAGES_FOLDER + "bold.png", "bold"); // bold.gif
			toolBar.appendButton(this.onItalic, false, RteEngine.IMAGES_FOLDER + "italic.png", "italic");
			toolBar.appendButton(this.onUnderline, false, RteEngine.IMAGES_FOLDER + "underline.png", "underline");
		}
		
		if(this.rtePref.buttons.text_color)  // text color
			this.textColorBtn = toolBar.appendButton(this.onTextColor, false, RteEngine.IMAGES_FOLDER + "font_color.png", "text color");
		if(this.rtePref.buttons.bg_color)  // background color
			this.bgColorBtn = toolBar.appendButton(this.onBackgroundColor, false, RteEngine.IMAGES_FOLDER + "background_color.png", "background color");
		if(this.rtePref.buttons.link) // hyperlink
			this.linkBtn = toolBar.appendButton(this.onLink, false, RteEngine.IMAGES_FOLDER + "hyperlink.png", "hyperlink");
		if(this.rtePref.buttons.image) // image
			this.imageBtn = toolBar.appendButton(this.onImage, false, RteEngine.IMAGES_FOLDER + "image.png", "image");
		if(this.rtePref.buttons.object) // object/embed; widget
			this.objectBtn = toolBar.appendButton(this.onObject, false, "icons/addThirdPartyWidget.png", "embeded object or widget");

		if(this.rtePref.buttons.list) { // list: ordered + unordered
			toolBar.appendButton(this.onOrderedList, false, RteEngine.IMAGES_FOLDER + "list_num.png", "ordered list");
			toolBar.appendButton(this.onUnorderedList, false, RteEngine.IMAGES_FOLDER + "list_bullet.png", "unordered list");
		}
		if(this.rtePref.buttons.reundo) { // undo (redo bellow)
			toolBar.appendButton(this.onUndo, false, RteEngine.IMAGES_FOLDER + "undo.png", "undo");
		}
		if(this.rtePref.buttons.align) { // align: left + centre + right + justifyfull
			toolBar.appendButton(this.onAlignLeft, false, RteEngine.IMAGES_FOLDER + "align_left.png", "align left");
			toolBar.appendButton(this.onAlignCenter, false, RteEngine.IMAGES_FOLDER + "align_center.png", "align center");
			toolBar.appendButton(this.onAlignRight, false, RteEngine.IMAGES_FOLDER + "align_right.png", "align right");
			toolBar.appendButton(this.onAlignJustify, false, RteEngine.IMAGES_FOLDER + "justifyfull.png", "justify");
		}
		if(this.rtePref.buttons.dent) { // outdent + indent
			toolBar.appendButton(this.onOutdent, false, RteEngine.IMAGES_FOLDER + "outdent.png", "outdent");
			toolBar.appendButton(this.onIndent, false, RteEngine.IMAGES_FOLDER + "indent.png", "indent");
		}
		if(this.rtePref.buttons.supsub) { // superscript + subscript
			toolBar.appendButton(this.onSuperscript, false, RteEngine.IMAGES_FOLDER + "superscript.png", "superscript");
			toolBar.appendButton(this.onSubscript, false, RteEngine.IMAGES_FOLDER + "subscript.png", "subscript");
		}
		if(this.rtePref.buttons.smile) // smile
			this.smileBtn = toolBar.appendButton(this.onSmile, false, RteEngine.IMAGES_FOLDER + "smile.gif", "smile");
		if(this.rtePref.buttons.line) // line
			toolBar.appendButton(this.onHorizontalRule, false, RteEngine.IMAGES_FOLDER + "hr.png", "horizontal line");
		if(this.rtePref.buttons.table) // table
			this.tableBtn = toolBar.appendButton(this.onTable, false, RteEngine.IMAGES_FOLDER + "table.png", "table");
		if(this.rtePref.buttons.reundo) { // redo
			toolBar.appendButton(this.onRedo, false, RteEngine.IMAGES_FOLDER + "redo.png", "redo");
		}
		if(this.rtePref.buttons.html) // html
			this.htmlBtn = toolBar.appendButton(this.onSource, true, RteEngine.IMAGES_FOLDER + "html.png", "html view mode", "edit mode");
		
		return toolBar;
	}

	// interface function which be called by the toolbar
	// "onOverflowBtn"
	this.onOverflowBtn = function() {
		this.skipClose = true;
	}
	this.initContent = function() {
		var text = this.getDataField().value;

		this.putContent(text);
		this.initHtml = this.getHtmlContent(false);
	}
	
	// putContent
	this.putContent = function(text) {
	  if(this.isNetscape || this.isOpera) {
			var head = this.document.getElementsByTagName('head')[0];
      var base = document.createElement('base');
      base.setAttribute('href', getBaseUri());
      head.appendChild(base);
	   
			this.document.body.innerHTML = text;
			this.document.body.style.fontFamily = "Helvetica, arial";
			this.document.body.style.fontSize = "16px";
			this.document.body.style.margin = 5;
	  }
	  else {
		  var frameHtml = "<html>\n";
		  frameHtml += "<head>";
			frameHtml += "<base href=\"" + getBaseUri() + "\" />";
		  frameHtml += "</head>";
		  frameHtml += "<body style=\"font-family:Helvetica,arial; font-size:16px; margin: 5px;\">";
		  frameHtml += text + "";
		  frameHtml += "</body>";
		  frameHtml += "</html>";

		  this.document.open();
		  this.document.write(frameHtml);
		  this.document.close();
		}
	}
	// it used for a non standart command like a table insert.
	this.insertHTML = function(html) {
		try {
			this.document.execCommand('insertHTML', false, html);
		}
		catch(e) { // for IE
			if(this.curRange == null)
				return;
			this.curRange.pasteHTML(html);
			this.curRange.collapse(false);
			this.curRange.select();
		}
		this.skipClose = true;
	}
	
	//********************************************************
	// wrapSelection utility
	// wraps selection with some tag
	// obtains wrapObj = document.createElement
	//******************************************************** 
	this.wrapSelection = function(wrapObj) {
		if (typeof window.getSelection != "undefined") { // Gecko
 	  	var selection = this.window.getSelection();
    	if (selection.rangeCount < 1)
      	return; // no selection

	    var range = selection.getRangeAt(0);
	    if (range.startContainer != range.endContainer)
	      return;  // reject case when selection contains different paragraphs (?)
	
	    wrapObj.appendChild(this.document.createTextNode(range.toString()));
	    range.deleteContents();
	    range.insertNode(wrapObj);
	  }
	  else { // IE - not implemented
			this.curRange.select();
			var tn = this.document.createTextNode(this.curRange.text);
			wrapObj.appendChild(tn);
			this.curRange.pasteHTML(wrapObj.outerHTML);
	  }
	}
	
	// not source view & (hack:) not immediate execution that autoclose the RTE
	this.isAllowedToExecute = function() {
		if(this.isSourceView)
			return false;
		var curTime = new Date().getTime();
		if(curTime - this.openedAtTime < 500) // 500 ms
			return false;

		return true;
	}
	this.getHtmlContent = function(toCheckOnEmty) {
	  var content = "";
		if(this.isSourceView) {
				if(typeof this.document.body.innerText == 'undefined')
					content =  this.document.body.textContent;
				else
					content =  this.document.body.innerText;
			}
		else {
 			content =  this.document.body.innerHTML;
	  }

		var images = this.document.body.getElementsByTagName("img");
		var hasImages = (images && images.length > 0);

		var objects = this.document.body.getElementsByTagName("object");
		var hasObjects = (objects && objects.length > 0);

    // if there is no text (only tags and invisible symbols) then return empty string.
		// returns html if there are <img>s or <object>s
  	if (hasImages == false && hasObjects == false && (typeof toCheckOnEmty == 'undefined' || toCheckOnEmty)) {
  	  var tmp = content.plainText();
	    tmp = tmp.replace(/&nbsp;| |\t|\n|\f|\r|\x0B]/g, "");
	    if(tmp.length == 0)
	      return "";
    }
    
		return content;
	}

	this.getId = function() {
    return this.iframeObj.id;
  }
  this.getIframe = function() {
    return this.iframeObj;
  }
  this.getDocument = function() {
    return this.document;
  }
  this.getImgUrlsArray = function() {
    return this.imgUrlsArr;
  }
  this.getWidth = function() {
    return this.iframeObj.offsetWidth;  
  }
  
	this.getDataField = function() {
		if(this.dataField == null) {
			this.dataField = getChildById(this.parentDiv, this.dataFieldId);
		    if (this.dataField == null)
		      throw new Error("form field " + this.dataFieldId + " not found");
		}
		return this.dataField;
	}
	this.putRteData = function() {
	  // not use detection of a document changing.
	  // probably it invokes error when document is not stored.
	  //if(this.isChanged == false)
	  //  return;
		var text = this.getHtmlContent();
		// compare with initial RTE content
		// then no need to change.
		if (text == this.initHtml)
		  return;
		
		// some html cleanup --
	  // 1. \n
	  // 1.1 remove \n if sibling symbol is space
		text = text.replace(/\s\n|\n\s/g, " ");
		// 1.2 replace \n with space if sybling is not space (rest from previous command)
		text = text.replace(/\n/g, " ");

		// 2. trim.
		text = trim(text);
		// 3. convert all tags to lower case
		// - no need because we check if document was changed.
		// IE (Opera) returns in uppercase; FF in lower case. It can change RTE resource.
		/*
		var upTags = text.match(/<.[A-Z]*.>/g);
		if(upTags != null) {
		  for(var i = 0; i < upTags.length; i++)
        text = text.replace(upTags[i], upTags[i].toLowerCase());
		}
		*/
		// set value in hidden data field.
		this.getDataField().value = text;
	}
	
  // get highlighted element
  // it is used for link handling in the dialog
  this.getSelectedElement = function() {
    var elm = null;
    if (typeof this.document.selection != 'undefined') {
      // curRange - did not work in Opera
      var range = this.document.selection.createRange();
      var elm = range.parentElement();
    }
    else if (typeof this.window.getSelection != 'undefined') {
      var selection = this.window.getSelection();
      var childNodesAmt = selection.focusNode.childNodes.length;
      if (childNodesAmt == 0) {
        elm = selection.focusNode.parentNode;
      }
      else if(childNodesAmt >= selection.focusOffset) {
        var idx = (selection.focusOffset > 0) ? selection.focusOffset - 1 : 0;
				elm = selection.focusNode.childNodes[idx];
      }
    }
    return elm;
  }

	// event handlers --------------
	this.onfocus = function() {
	  if(i_am.toolbar == null)
	    i_am.toolbar = i_am.createToolbar();

    if(i_am.toolbar.isVisible())
      return;
    

		i_am.fitHeightToVisible();
		
		
		// makes toolbar 100% in IE
//		if (i_am.isIE) {
//			var label = getPreviousSibling(i_am.toolbar.div.parentNode);
//			label.style.styleFloat = "none";
//		}

		// make offset for toolbar over the iframe
		i_am.iframeObj.style.marginTop = 7; //i_am.toolbar.getHeight() + 1;
		
		i_am.toolbar.div.style.top =  5; // i_am.toolbar.getHeight() +
		//////i_am.toolbar.div.style.left = 7; // RTE offset in Touch UI dialogs ~"hack" 
			
		i_am.toolbar.show();
		
		// prevents from more than 1 opened RTE.
		RteEngine.closeAllDisactived(i_am.iframeObj.id);
		i_am.openedAtTime = new Date().getTime();
	}
	// "closes" an active RTE
	this.onlosefocus = function(e) {
		if(!i_am.isAllowedToExecute()) // not source view & not immediate execution
			return;
		if(i_am.currentPopup != null && i_am.currentPopup.style.visibility == "visible")
			return;

		if(i_am.skipClose) {
			i_am.skipClose = false;
			return;
		}

		// FF: prevents toolbar close on scrolling
    if(e && e.target && e.target.nodeName == "HTML")
      return;

		i_am.iframeObj.style.height = i_am.initFrameHeight;
		if (i_am.toolbar)
			i_am.iframeObj.style.marginTop = -i_am.toolbar.getHeight() + 5; 
    if (i_am.toolbar)
		  i_am.toolbar.hide();
		
		i_am.iframeObj.setAttribute("scrolling", "no");   
	}

	// IE's hack
	// to store the current range to which to apply the command
	this._ondeactivate = function() {
		if (!i_am.isIE)
		  return;
		if(i_am.document.selection)
		  i_am.curRange = i_am.document.selection.createRange();
		/*
		else if(i_am.window.getSelection) {
		  var selection = i_am.window.getSelection();
      i_am.curRange = selection.getRangeAt(0);
		} 
		*/
	}
	
	this._onkeyup = function(e) {
		i_am.fitHeightToVisible();
    
		// FF2 and Opera onpaste
		e = getDocumentEvent(e);
    if((e.ctrlKey && e.keyCode == 86) // e.DOM_VK_V
         || (e.shiftKey && e.keyCode == 45)) /* e.DOM_VK_INSERT */ {
     RteEngine.onPasteHandler(i_am.iframeObj.id); 
    }

    // FF: ctrl + b - bold (in other browsers it works by default)
    if(i_am.isNetscape && e.ctrlKey && (e.keyCode == 66)) {
  	  i_am.performCommand("bold", null, true);
  	}
  	// FF: ctrl + i - italic
    if(i_am.isNetscape && e.ctrlKey && (e.keyCode == 73)) {
  	  i_am.performCommand("italic", null, true);
  	}
  	// FF: ctrl + u - underline
    if(i_am.isNetscape && e.ctrlKey && (e.keyCode == 85)) {
  	  i_am.performCommand("underline", null, true);
  	}
    // ctrl + t - monospace
    if(e.ctrlKey && (e.keyCode == 84)) {
  	  i_am.setMonospace();
  	}
	}
	// prevents default Ctrl+b behaviour in FF.
  this._onkeydown = function(e) {
    if(i_am.isNetscape == false)
      return;
    // prevent for ctrl+b, ctrl+i, ctrl+u, ctrl+t  
    if (e.ctrlKey && (e.keyCode == 66 || e.keyCode == 73 || 
            e.keyCode == 85 || e.keyCode == 84)) {
      e.preventDefault();
    }
  }
  
	this.fitHeightToVisible = function() {
		// apply it if no scrolling
		if(this.iframeObj.scrolling != 'no')
			return;
	
		var lastChild = getLastChild(i_am.document.body);
		if (!lastChild)
			return;
		// NOte: FF increases  i_am.document.body.scrollHeight;	on each key down
		var docH = lastChild.offsetTop + lastChild.offsetHeight; 
		if(docH < i_am.initFrameHeight)
			return;

    // FF: limit max RTE height
    // IE & Opera: failed to turn on a scrollbar in JS.
    // So, on this moment, in IE & Opera no height limitation. 
		
		// New FF has problem with switching of scrollbar as well!!!
		
		var frmH = i_am.iframeObj.clientHeight;
		var maxHeight = getWindowSize()[1] * 0.9;
		if(docH > maxHeight && this.isNetscape) {
		  i_am.iframeObj.setAttribute("scrolling", "auto"); 
		  i_am.iframeObj.style.height = maxHeight;
		}
		else {
		  if(frmH != docH)
			  i_am.iframeObj.style.height = docH;
   		i_am.iframeObj.setAttribute("scrolling", "no"); 
		}
	}
  
  this._onpaste = function(e) {
     var execCode = "RteEngine.onPasteHandler('" + i_am.iframeObj.id + "')"
     setTimeout(execCode, 1);
  }
  
  this._ondblclick = function(e) {
    i_am.onLink(true);
  }
  
	// --------------------------------------
	// 1
	this.onStyle = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchStylePopup(i_am.styleBtn, i_am.setStyle);
	}
	// 2
	this.onFont = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchFontPopup(i_am.fontBtn, i_am.setFont, i_am.rtePref.isFewFonts);
	}
	// 3
	this.onSize = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchSizePopup(i_am.sizeBtn, i_am.setSize);
	}
	// 4
	this.onSmile = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchSmilePopup(i_am.smileBtn, i_am.setSmile);
	}
	// 5
	// return true - to close the overflow popup if the button is overflowed.
	this.onBold = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("bold", null, true);
		return true;
	}
	// 6
	this.onItalic = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("italic", null, true);
		return true;
	}
	// 7
	this.onUnderline = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("underline", null, true);
		return true;
	}
	// 8
	this.onAlignLeft = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("justifyleft", null, true);
		return true;
	}
	// 9
	this.onAlignCenter = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("justifycenter", null, true);
		return true;
	}
	// 10
	this.onAlignRight = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("justifyright", null, true);
		return true;
	}
	// 11
	this.onAlignJustify = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("justifyfull", null, true);
		return true;
	}
	// 12
	this.onHorizontalRule = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("inserthorizontalrule", null, true);
		return true;
	}
	// 13
	this.onOrderedList = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("insertorderedlist", null, true);
		return true;
	}
	// 14
	this.onUnorderedList = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("insertunorderedlist", null, true);
		return true;
	}
	// 15
	this.onOutdent = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("outdent", null, true);
		return true;
	}
	// 16
	this.onIndent = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("indent", null, true);
		return true;
	}
	// 17
	this.onTextColor = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchTextColorPopup(i_am.textColorBtn, i_am.setTextColor,  i_am.chosenTextClr);
	}
	// 18
	this.onBackgroundColor = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchBgColorPopup(i_am.bgColorBtn, i_am.setBackgroundColor, i_am.chosenBgClr);
	}
	// 19
	this.onLink = function(onDblClick) {
    if (typeof onDblClick == 'undefined')
      onDblClick = false;

		if(!i_am.isAllowedToExecute())
			return;
    var href = "";

    var a = i_am.getSelectedElement();
    if (a && a.tagName && a.tagName.toLowerCase() == "a") {
      href = a.href;
    }
    // not show the dialog on double click on not link 
    if (onDblClick && href.length == 0)
      return;
    
    if (href.endsWith("/")) 
      href = href.substr(0, href.length - 1);
    
    // show dialog  
		i_am.currentPopup = RteEngine.launchLinkPopup(i_am.linkBtn, i_am.setLink, i_am.cancelLink, href);
	}
	// 20
	this.onImage = function() {
		if(!i_am.isAllowedToExecute())
			return;
		
		i_am.currentPopup = RteEngine.launchImagePopup(i_am.imageBtn, i_am.setImage, i_am.iframeObj.id, i_am.cancelImage);
	}
	// object; widget
	this.onObject = function() {
		if(!i_am.isAllowedToExecute())
			return;
		
		i_am.currentPopup = RteEngine.launchObjectPopup(i_am.objectBtn, i_am.setObject, i_am.iframeObj.id, i_am.cancelImage);
	}
	// 21
	this.onTable = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchTablePopup(i_am.tableBtn, i_am.setTable, i_am.cancelImage);
	}
	this.onSuperscript = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("superscript", null, true);
		return true;
	}
	this.onSubscript = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("subscript", null, true);
		return true;
	}
	this.onRedo = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("redo", null, true);
		return true;
	}
	this.onUndo = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("undo", null, true);
		return true;
	}
	
	// 0 allowToEdit if Ctrl key was pressed while mouseUp
	this.onSource = function(pressed, allowToEdit) {
		var html;
		if(i_am.document.importNode) { // FF --
			if(pressed) {
				html = document.createTextNode(i_am.document.body.innerHTML);
				i_am.document.body.innerHTML = "";
				html = i_am.document.importNode(html,false);
				i_am.document.body.appendChild(html);
				if (!allowToEdit)
					i_am.document.designMode = "Off";
			}
			else {
				html = i_am.document.body.ownerDocument.createRange();
				html.selectNodeContents(i_am.document.body);
				i_am.document.body.innerHTML = html.toString();
				i_am.document.designMode = "On";
			}
		}
		else {
			if(pressed) { // IE --
				var iHTML = i_am.document.body.innerHTML;
				if (!allowToEdit)
					i_am.document.designMode = "Off";
				i_am.putContent(iHTML); // hack: restore the document after designMode = "Off"
				i_am.document.body.innerText = iHTML;
			}
			else {
				var iText = i_am.document.body.innerText;
				//i_am.document.body.innerHTML = iText;
				i_am.document.designMode = "On";
				i_am.putContent(iText);
			}
		}
		i_am.isSourceView = pressed;

		if(i_am.isSourceView)
			i_am.toolbar.disableAllControls(i_am.htmlBtn);
		else
			i_am.toolbar.enableAllControls();

		// prevent a closing
		i_am.skipClose = true;
		return true;
	}

	// "setters" (on selection in a popup) ----------
	// 1
	this.setStyle = function(idx) {
		var value = RteEngine.STYLES[idx].value;
		i_am.performCommand("formatblock", value);
		return true;
	}
	// 2
	this.setFont = function(idx) {
		if(i_am.rtePref.isFewFonts)
			var value = RteEngine.FONTS[idx];
		else
			var value = RteEngine.FONTS_FEW[idx];
		i_am.performCommand("fontname", value);
		return true;
	}
	// 3
	this.setSize = function(idx) {
		var value = idx + 1;
		var span = i_am.document.createElement("span");
		span.className = RteEngine.FONT_SIZE[idx].value;
		i_am.wrapSelection(span);
		i_am.skipClose = true;
		return true;
	}
	// 4
	this.setSmile = function(idx) {
		var hostUrl = RteEngine.getHostUrl();
		var imgPath = hostUrl + RteEngine.IMAGES_FOLDER + "smiles/" + (idx + 1) + ".gif";
		i_am.insertHTML("<img src=" + imgPath + ">");
	}
	// 5
	this.setTextColor = function(color) {
		i_am.performCommand("forecolor", color);
		i_am.chosenTextClr = color;
		return true;
	}
	// 6
	this.setBackgroundColor = function(color) {
		if(i_am.performCommand("hilitecolor", color) == false) { // FF
			i_am.performCommand("backcolor", color) // IE
		}
		i_am.chosenBgClr = color;
		return true;
	}
	// 7
	this.setLink = function(params) {
    var newHref = params.url;
    if(newHref.length == 0) {
      // if new href is blank - replace link with its inner HTML
      // does not work in IE
      var a = i_am.getSelectedElement();
      var oldHref = null;
      if (a && a.tagName && a.tagName.toLowerCase() == "a") {
        oldHref = a.href;
      }
      if (!oldHref)
        return;
      
      var parent = a.parentNode;
      
      if (i_am.isNetscape) { // FF
        parent.removeChild(a);
        i_am.insertHTML(a.innerHTML);
      }
      else { // Safari, Opera
        i_am.insertHTML(a.innerHTML);
        parent.removeChild(a);
      }

      return;  
    }
		
		
		if(params.is_blank)
		  newHref += "__$blank__";
		
		i_am.performCommand("createlink", newHref);
		
		if(params.is_blank) {
		  var links = i_am.document.body.getElementsByTagName("a");
		  for(var i = 0; i < links.length; i++) {
		    if(links[i].href.indexOf("__$blank__") != -1) {
		      links[i].setAttribute("target", "_blank");
		      links[i].href = links[i].href.replace(/__\$blank__/, "");
		    }
		  }
		}

		return true;
	}
	// 8
	this.setImage = function(url, align, margin, selRadioIdx) {
		if(url.length != 0) {
		  // check on double encoding (for space only for now)
		  if(url.indexOf("%2520") != -1)
		    url = decodeURI(url);
			
			// Note: use "class" to identify image to set src=URL returned from server
			// new FF's RTE does not accept cusom parameter like "file_path"
			var param = (selRadioIdx == 0) ? "class" : "src";
			var html = "<img " + param + "=\"" + url + "\" align=\"" + align + "\"";
			if (margin)
				html += " style=\"margin:" + margin + ";\"";

			html += " />";
		  this.insertHTML(html);
		}
		return true;
	}
	
	// setObject
	this.setObject = function(params) {
		// hack: hailed to insert <object>/<embed> directlly thru insertHTML
		// so substitute some mark with the code
		var mark = "[!object]";
		i_am.insertHTML(mark);
		var docHtml = i_am.document.body.innerHTML;
		docHtml = docHtml.replace(mark, params.html);
		// note: putContent "failed" to launch object
		i_am.document.body.innerHTML = docHtml;
		// inserted object is not loaded immediately
		// to run it with turn on and then off of source
		i_am.onSource(true);
		i_am.onSource(false);
	}
	
	// 9
	this.setTable = function(params) {
	// names of parameters are from the corresponding form
		var html =
		'<table width=' + params.width + params.widthType
		+ ' cellpadding=' + params.padding + ' cellspacing=' + params.spacing
		+ ' border=' + params.border + '> ';

		for(var r = 0; r < params.rows; r++) {
			html += ' <tr>';
			for(var c = 0; c < params.columns; c++)
				html += ' <td></td>';
			html += ' </tr>';
		}
		html += ' </table>';

		i_am.insertHTML(html);
	}
	
	this.setMonospace = function() {
	  // IE
	  if(typeof i_am.document.selection != 'undefined') {
	    var ranges = i_am.document.selection.createRangeCollection();
	    for(var i = 0; i < ranges.length; i++) {
	      var html = "<span style=\"font-family: monospace;\">" +  ranges[i].htmlText + "</span>";
	      ranges[i].pasteHTML(html);
	    }
	  }
	  // FF - does not work!
	  else if (typeof i_am.window.getSelection != 'undefined') {
      var selection = window.getSelection();
      if (typeof selection.rangeCount != 'undefined' &&
            selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        if (typeof range.surroundContents != 'undefined') {
          var span = i_am.document.createElement('div');
          span.style.fontFamily = "monospace";
          range.surroundContents(span);
        }
      }
    }
	}
	
	// cancel ------------------------------
	this.cancelLink = function() {
	  i_am.skipClose = true;
	}
	this.cancelImage = function() {
    i_am.skipClose = true;
	}
	this.cancelTable = function() {
    i_am.skipClose = true;
	}
		
	// -------------------------------------
	// execute a command
	this.performCommand = function(command, value, skipClose) {
		this.window.focus();
		if(this.isSourceView)
			return;
		try {
		var performed = false;
		if(this.curRange != null) { // for IE
			this.curRange.select();
			performed = this.curRange.execCommand(command, false, value);
		}
		if(performed == false)
			this.document.execCommand(command, false, value);
		}catch(e) {
			return false;
		}
		this.window.focus();

	  this.skipClose = true;
		return true;
	}

	// constructor body --
	this.init();
}

/********   TArea used instead RTE if the last imposible to create   *********/
function TArea(iframeObj, dataFieldId, rtePref) {
	var i_am = this;

  this.textArea = null;
	this.iframeObj = iframeObj;
	this.dataFieldId = dataFieldId;
	this.parentDiv = this.iframeObj.parentNode;
	this.dataField = null; // hidden field to transfer data
  this.initHeight = null;

  // substitute iframe with a text area
  this.init = function() {
    this.textArea = document.createElement('textarea');
    this.textArea.style.width = "100%";
    this.textArea.style.height = this.iframeObj.clientHeight;
    this.initHeight = this.iframeObj.clientHeight;
    this.textArea.style.fontSize = "14px";
    this.textArea.id = this.iframeObj.id;

    // convert html into a plain text.
    // remove tags (alternative is to replace with " ")
    var text = this.getDataField().value;
    var plainText = text.replace(/<\/?[^>]+(>|$)/g, "")
    this.textArea.innerText = plainText;
    
    // set handlers
    addEvent(this.textArea, 'keyup', this._onkeyup, false);
		addEvent(this.textArea, 'focus', this.onfocus, false);
    addEvent(document, 'mouseup', this.onlosefocus, false);

    this.parentDiv.replaceChild(this.textArea, this.iframeObj);
  }
  this.getId = function() {
    return this.textArea.id;
  }
  this.getDataField = function() {
		if(this.dataField == null) {
			this.dataField = getChildById(this.parentDiv, this.dataFieldId);
		    if (this.dataField == null)
		      throw new Error("form field " + this.dataFieldId + " not found");
		}
		return this.dataField;
  }

  this.putRteData = function() {
		this.getDataField().value = this.textArea.value;
  }

  // focus
  this. onfocus = function() {
    i_am.fitHeightToVisible();
	  RteEngine.closeAllDisactived(i_am.iframeObj.id);
  }
  // losefocus
  this.onlosefocus = function(e) {
    i_am.textArea.style.height = i_am.initHeight;
  }

  // resize
  this._onkeyup = function(evt) {
		i_am.fitHeightToVisible();
	}

	this.fitHeightToVisible = function() {
		var scrlH = i_am.textArea.scrollHeight; // not work with Opera 8.54
		if(scrlH < i_am.initHeight)
			return;

		var taH = i_am.textArea.clientHeight;
		if(taH != scrlH) {
			i_am.textArea.height = scrlH;
		}
	}

  // constructor body
  this.init();
}

// flag that richtext.js was parsed
g_loadedJsFiles["richtext.js"] = true;