<div>
<!-- Attributions>
  Font Awesome - http://fortawesome.github.com/Font-Awesome
</Attributions-->

<!-- Templates --> 
<script type="text/template" id="resource">
  <!-- Single resource view -->  
  <section id="{{= viewId }}" data-type="sidebar"></section>
  <section id="{{= viewId + 'r' }}"></section> 

  <!-- div id="headerMessageBar"></div -->
  <div id="headerDiv"></div>
  <div id="resourceViewHolder">
    <div style="width: 100%;position:relative;min-height:40px;overflow:hidden">
      {{ if (this.isImageCover) { }} 
        <div id="resourceImage" style="position:absolute;z-index:1"></div>
        <div data-role="footer" class="thumb-gal-header hidden" 
          style="opacity:0.7;position:absolute;top:312px;width:100%;background:#eee;text-shadow:none;color:{{= G.coverImage ? G.coverImage.background : '#eeeeee;'}}"><h3></h3></div>    
        <div id="mainGroup" style="top:120px;right:1.3rem;position:absolute;"></div>
      {{ } }}
      {{ if (!this.isImageCover) { }}
        <div id="resourceImage" style="margin:0; padding:0;{{= U.getArrayOfPropertiesWith(this.vocModel.properties, "mainGroup") &&  U.isA(this.vocModel, 'ImageResource') ? 'min-height:110px;' : ''}}" ><!-- style="width:auto" --></div>
        <div id="mainGroup" style="right:1.3rem;position:absolute;"></div>
      {{ } }}
      <!--div id="buyGroup" class="ui-block-b" style="width:50%; min-width: 130px"></div-->
    </div>
    <div id="resourceImageGrid" data-role="content" style="padding: 2px;" class="grid-listview hidden"></div>
    
    <div class="thumb-gal-header hidden"><h3></h3></div>
    <!--div id="photogrid" style="padding: 7px;" data-role="content" class="grid-listview hidden">
    </div-->
    
    <div id="photogrid" data-inset="true" data-filter="false" class="thumb-gal hidden">
    </div>
    <br/>
    {{ if (this.vocModel.type.endsWith("Impersonations")) { }}
       <div style="padding:10px;"><a data-role="button" class="ui-btn-hover-c" data-icon="heart" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/model/portal/Comment', {$editCols: 'description', forum: this.resource.get('_uri'), '-makeId': G.nextId()}) }}">{{= loc('wooMe') }}</a></div>
    {{ } }}
    
    <section data-type="list">
      <ul class="list-group" id="resourceView" style="padding:10px;">
      </ul>
    </section>
    <div id="about" class="hidden" style="padding: 7px;"></div>
    
    {{ if ($('#other')) { }}
      <!--br/>
      <br/-->
    {{ } }}
    <section data-type="list">
      <ul class="list-group" id="cpView" style="padding: 10px;">
      </ul>
    </section>
  </div>
  <!--div data-role="footer" class="ui-bar">
     <a data-role="button" data-shadow="false" data-icon="repeat" id="homeBtn" target="#">Home</a>
     <a data-role="button" data-shadow="false" data-icon="edit" id="edit" target="#" style="float:right;" id="edit">{{= loc('edit') }}</a>
  </div-->
  <br/>
</script>  

<script type="text/template" id="inlineListItemTemplate">
<!-- one row of an inline backlink in view mode -->
<li class="list-group-item" data-viewid="{{= viewId }}" {{= obj.img ? 'style="padding:0"' : '' }}>
  <a href="{{= _uri }}" {{= obj._problematic ? 'class="problematic"' : '' }}>
    {{ if (obj.img) { }}
      <img data-lazy-src="{{= img.indexOf('/Image') == 0 ? img.slice(6) : img }}" 
      {{ if (obj.top) { }}  
      style="max-height:none;max-width:none;
        height:{{= height }}px;
        left:-{{= left }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);"
      {{ } }}
      {{ if (!obj.top) { }}  
        style="max-height:80px;max-width:80px;"
      {{ } }}
      
      data-for="{{= U.getImageAttribute(resource, imageProperty) }}"
      class="lazyImage" />
    {{ } }}
  </a>
  <span style="position:absolute;padding:1rem;font-size:1.6rem;font-weight:bold;">{{= name }}{{= obj.gridCols ? '<br/>' + gridCols : '' }}</span>
  
  {{ if (typeof comment != 'undefined') { }}
    <p>{{= comment }}</p>
  {{ } }}
  </a>
</li>
</script>


<script type="text/template" id="cpTemplate">
<!-- readwrite backlink in resource view -->
<li class="list-group-item" data-propName="{{= shortName }}">
  {{ if (obj.prop && prop.where) _.extend(params, U.getQueryParams(prop.where)); }}
  <p>
    <a {{= prop.lookupFrom ? 'data-lookupFrom=' + prop.lookupFrom : '' }} data-shortName="{{= shortName }}" href="{{= U.makePageUrl(action, range, params) }}" class="cpA">{{= name }}</a>
    <div style="color:{{= G.lightColor }};font-weight:bold;background:{{= G.darkColor }};display:inline;position:absolute;right:1rem;font-size: 1.5rem;border-radius:1rem;border: 1px solid {{= G.darkColor }};padding: 0.1rem 0.3rem;">{{= value }}</div>
  </p>     
  {{ if (typeof comment != 'undefined') { }}
    <br/><p style="padding: 0.7rem 0;font-size:1.3rem;color:#808080; line-height:1.5rem;">{{= comment }}</p>
  {{ } }}
  </li>
</script>

<script type="text/template" id="cpTemplateNoAdd">
<!-- readonly backlink in resource view -->
<li class="list-group-item" data-propName="{{= shortName }}">
<p>
     {{ var params = {}; }}
     {{ params[backlink] = _uri; }}
     <a href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title, '$orderBy': obj.$order, '$asc': obj.$asc})) }}" class="cpA">{{= name }}
     
     <!--span class="ui-li-count">{{= value }}</span></a><a target="#" data-icon="chevron-right" data-iconshadow="false" class="cp" -->
     </a>
     <div style="{{= G.darkColor }}display:inline;position:absolute;right:1rem;font-size: 1.5rem;border-radius:1rem;border: 1px solid {{= G.darkColor }};padding: 0.1rem 0.3rem;">{{= value }}</div>
</p>     
   </li>
</script>

<script type="text/template" id="cpMainGroupTemplate">
<!-- button for an important backlink on a resource on the resource's view page -->
<button class="btn"  style="border:1px solid {{= borderColor }}; background: {{= color }}">
 {{ var params = {}; }}
 {{ params[backlink] = _uri; }}
 {{ if (!obj.value  &&  !obj.chat) { }}  
   <a data-shortName="{{= shortName }}" data-title="{{= title }}" href="#">
     <span><i class="{{= icon }}"></i>&#160;{{= name }}</span>
   </a>
 {{ } }}
 {{ if (obj.value || obj.chat) { }}  
   <a data-propName="{{= shortName }}" href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}" style="width:95%;">
     <span><i class="{{= icon }}"></i>&#160;{{= name }}</span>
     
     {{= obj.value ? '<div style="display:inline-block;position:absolute;top:-35%;right:1px"><span class="counter" style="padding:1px 5px;background:#EEF;border-radius:1rem;font-size:1.2rem;">' + value + '</span></div>' :  ''  }}
   </a>
 {{ } }}
 </button>
</script>

<script type="text/template" id="cpMainGroupTemplateH">
<!-- button for an important backlink on a resource on the resource's view page (horizontal mode) -->
 {{ var params = {}; }}
 {{ params[backlink] = _uri; }}
 {{ if (!value) { }}  
   <button class="btn" data-shortName="{{= shortName }}" style="text-shadow:0 1px 0 {{= borderColor }}; background: {{= color }}; border:1px solid {{= borderColor }};" href="#" data-title="{{= title }}">
      <span>{{= obj.icon ? '<i class="' + icon + '" style="margin-left:-5px;"></i>' : '' }} {{= name }}</span> 
   </button>
 {{ } }}
 {{ if (typeof value != 'undefined') { }}  
   <button class="btn" data-propName="{{= shortName }}"  style="text-shadow:0 1px 0 {{= borderColor }}; background: {{= color }}; border:1px solid {{= borderColor }};" href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}">
     <!-- {{= obj.icon ? '<i class="' + icon + '" style="font-size:20px;top:35%"></i>' : '' }} -->
     <span>{{= obj.icon ? '<i class="ui-icon-star" style="font-size:20px;top:35%"></i>' : '' }} {{= name }}{{= value != 0 ? '<span style="float: right;position:relative;margin: -17px;" class="ui-li-count ui-btn-up-c ui-btn-corner-all">' + value + '</span>' : ''  }}</span>
   </button>
 {{ } }}
</script>

<script type="text/template" id="listItemTemplate">
  <!-- bb one row on a list page -->
  {{ var action = action ? action : 'view' }}
  <div style="margin:0" data-viewid="{{= viewId }}">
  {{ if (!obj.v_submitToTournament) { }}
    <div style="padding:.7em 10px 10px 90px; {{= obj.image ? 'min-height:59px;' : '' }}" data-uri="{{= U.makePageUrl(action, _uri) }}">
  {{ } }}
  {{ if (obj.v_submitToTournament) { }}
    <div style="padding:.7em 10px 0 90px; min-height:59px;" data-uri="{{= U.makePageUrl(action, _uri, {'-tournament': v_submitToTournament.uri, '-tournamentName': v_submitToTournament.name}) }}">
  {{ } }}
    <img data-lazysrc="{{= typeof image != 'undefined' ? (image.indexOf('/Image') == 0 ? image.slice(6) : image) : G.getBlankImgSrc() }}" 
    {{ if (obj.right) { }}  
      style="position:absolute;
        left:-{{= left }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px); {{= obj.mH ? 'max-height:' + mH + 'px;' : '' }} {{= obj.mW ? 'max-width:' + mW + 'px;' : '' }}"
    {{ } }}
    {{ if (!obj.right && obj.image) { }}
      style="max-height: 80px;position:absolute;max-height: 80px;max-width: 80px;margin-left:-90px; margin-top:-0.7em"
    {{ } }}  
    data-for="{{= U.getImageAttribute(this.resource, this.imageProperty) }}" class="lazyImage" />
    {{= viewCols }}
  </div>
  </div>
</script>

<script type="text/template" id="listItemTemplateNoImage">
  <!-- one row on a list page (no image) -->
  <div data-viewid="{{= viewId }}">
  {{ if (!obj.v_submitToTournament) { }}  
    <div
    {{ if (obj.isJst) { }}
      style="padding: .7em 10px 10px 0px;"
    {{ } }}
    {{ if (!obj.isJst  &&  (obj._hasSubmittedBy || !obj.v_submitToTournament)) { }}
      {{= obj.image ? 'style="min-height:59px;"' : '' }}
    {{ } }}
  {{ } }}
  {{ if (obj.v_submitToTournament) { }}
    style="padding:.7em 10px 10px 0px;min-height:39px;"
  {{ } }}
  >
  {{= viewCols }}
  {{ if (U.isAssignableFrom(this.vocModel, 'model/study/QuizQuestion')  &&  obj.alreadyAnsweredByMe) { }}
    <div style="position:relative;float:right;margin-right:10px;"><i class="ui-icon-check" style="font-size:25px;color:red;"></i></div>
  {{ } }}
  
  {{ if (this.resource.isA('Buyable')  &&  price  &&  price.value) { }}
   <div class="buyButton" id="{{= G.nextId() }}" data-role="button" style="margin-top:15px;" data-icon="shopping-cart" data-iconpos="right" data-mini="true">
     {{= price.currency + price.value }}
     {{= price.value < 10 ? '&nbsp;&nbsp;&nbsp;' : price.value < 100 ? '&nbsp;&nbsp;' : price.value < 1000 ? '&nbsp;' : ''}}
   </div>
  {{ } }}  
  {{ if (this.resource.isA('Distance')  &&  obj.distance) { }}
    <span class="ui-li-count">{{= distance + ' mi' }}</span>
  {{ } }}
  {{= obj.showCount ? '<span class="ui-li-count">' + obj.showCount.count + '</span>' : '' }} 
  {{ if (obj.comment) { }}
    <p style="padding-top:0.5rem;">{{= comment }}</p>
  {{ } }}
  </div>
  </div>
</script>

<script type="text/template" id="propGroupsDividerTemplate">
  <!-- row divider / property group header in resource view -->
  <li class="list-group-item active" {{= G.coverImage ? 'style="background:' + G.coverImage.background + ';color:' + G.coverImage.color + ';"' : '' }}>{{= value }}</li>
</script>

<script type="text/template" id="headerTemplate">
  <!-- the page header, including buttons and the page title, used for all pages except the home page -->
  <div id="callInProgress"></div>
  <div class="header" {{= obj.style ? style : 'style="background:' + G.lightColor + ';color:' + G.darkColor + '"' }} {{= obj.more || '' }} >
    <nav  class="headerUl navbar navbar-default" role="navigation">
    </nav>      
  </div>
  <div id="buttons" style="white-space: nowrap; position:relative; height: 48px; background:{{= G.darkColor }};color:{{= G.lightColor }}">
    <div class="cf vcentered" style="z-index:1; width:20%;float:left;background:inherit;">
      <span class="placeholder"></span>
      {{ if (this.categories) { }}
         <div style="position:absolute;top:14px;padding-left:10px;"><a id="categories" class="lightDark" href="#">
         <i class="ui-icon-tags"></i></a></div> 
      {{ } }} 
      {{= this.moreRanges ? '<div style="margin:10px 0 0 10px; float:left"><a id="moreRanges" data-mini="true" href="#">' + this.moreRangesTitle + '<i class="ui-icon-tags"></i></a></div>' : '' }}
      {{ if (folder) { }}
        <a class="rootFolder actionBtn" style="display: none; padding: 4px 10px; margin-left: 5px; font-size: 1.5rem;" href="#">
          <i class="ui-icon-chevron-left" style="padding: 0px 3px 0px 0px"></i>
          <span>{{= folder.name }}</span>
        </a>
      {{ }                     }}
    </div>
    <div id="name" class="cf vcentered resTitle" style="z-index:0; width:60%;float:left;background:inherit; {{= this.categories ? 'width: 100%;' :  'min-height: 20px;' }}" align="center">
      <h4 id="pageTitle" style="text-overflow: ellipsis; font-weight:normal;color:{{= G.lightColor }};">{{= this.title }}</h4>
      {{= this.filter ? "<div class='filter'></div>" : "" }}
      <div align="center" {{= obj.className ? 'class="' + className + '"' : '' }} id="headerButtons">
        <button style="max-width:200px; display: inline-block;" id="doTryBtn">
          {{ if (obj.tryApp) { }}
              {{= tryApp }}
          {{ } }}
        </button>
        <button style="max-width:200px; display: inline-block;" id="forkMeBtn">
          {{ if (obj.forkMeApp) { }}
              {{= forkMeApp }}
          {{ } }}
        </button>
        <button style="max-width:400px;" id="publishBtn" class="headerSpecialBtn">
          {{ if (obj.publishApp) { }}
              {{= publish }}
          {{ } }}
        </button>
        <button style="max-width:200px;" id="testPlugBtn" class="headerSpecialBtn">
          {{ if (obj.testPlug) { }}
              {{= testPlug }}
          {{ } }}
        </button>
        <button style="max-width:200px;" id="installAppBtn"  class="headerSpecialBtn">
          {{ if (obj.installApp) { }}
            {{= installApp }}
          {{ } }}
        </button>
        <button style="max-width:320px;" id="enterTournamentBtn" class="headerSpecialBtn">
          {{ if (obj.enterTournament) { }}
              {{= enterTournament }}
          {{ } }}
        </button>
        <button style="max-width:320px;" id="resetTemplateBtn" class="headerSpecialBtn">
          {{ if (obj.resetTemplate) { }}
              {{= resetTemplate }}
          {{ } }}
        </button>
      </div>
      <div style="clear:both"></div>
    </div>
    <div class="cf vcentered" style="z-index:1; width:20%;float:left;background:inherit;">
      {{ if (activatedProp) { }}
        <section class="activatable" style="float: right; display: none;">
          <label class="pack-switch" style="float: right; right: 2rem; height: 2rem; vertical-align:inherit; color:{{= G.darkColor }};">
            <input type="checkbox" name="{{= activatedProp.shortName }}" class="formElement boolean" {{= this.resource.get(activatedProp.shortName) ? 'checked="checked"' : '' }} />
            <span></span>
          </label>
        </section>
      {{ }                     }}
      {{ if (this.filter) { }}
        <div style="margin-right: 5px; display:inline-block; float: right;"><a class="filterToggle lightText" href="#"><i class="ui-icon-fasearch"></i></a></div> 
      {{ }                  }}
      <div style="clear:both"></div>
    </div>
  </div>
  <div class="physicsConstants" style="display:none; background-color: #606060; color:#FFFFFF; display:none;"></div>
  <div class="categories" style="display:none; padding: 5px; background-color:#ddd; display:none;"></div>
</script>

<script type="text/template" id="menuP">
  <!-- Left-side slide-out menu panel -->
  <ul class="menuItems list-group" id="menuItems">
  </ul>
</script>  

<script type="text/template" id="rightMenuP">
  <!-- Right-side slide-out menu panel -->
  <ul id="rightMenuItems" class="menuItems list-group">
  </ul>
</script>  

<script type="text/template" id="menuItemTemplate">
  <!-- one item on the left-side slide-out menu panel -->
  <li  style="{{= obj.image ? 'padding-top: 0;padding-right:0px;padding-bottom: 7px;' : 'padding-bottom:0px;' }}"  id="{{= obj.id ? obj.id : G.nextId() }}" class="list-group-item{{= obj.cssClass ? ' ' + cssClass : '' }}" 
      {{= (obj.mobileUrl || obj.pageUrl) ? ' data-href="' + (obj.mobileUrl ? G.pageRoot + '#' + mobileUrl : pageUrl) + '"' : '' }} >
    {{ if (obj.icon  &&  !obj.homePage) { }}
      <i style="" class="ui-icon-{{= icon }} home"></i>
    {{ }               }}
    
    {{ if (!obj.homePage  &&  obj.image) { }}   
      <img src="{{= obj.image || 'icons/blank.png'}}" class="thumb" 
      {{ if (typeof obj.width != 'undefined'  &&  obj.width.length) { }}  
        style="
          width:{{= width }}px; height:{{= height }}px;
          left:-{{= left }}px; top:-{{= top }}px;
          clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);"
      {{ } }}
      /> 
    {{ } }}
    <div class="gradientEllipsis" style="min-height:38px;max-width:100%;font-size:18px;{{= obj.image ? 'padding-top:10px;' : '' }}" 
      {{ if (obj.data) {                              }}
      {{   for (var d in data) {                      }}
      {{=    ' data-{0}="{1}"'.format(d, data[d])     }}
      {{   }                                          }}
      {{ }                                            }}
    >
    
    {{ if (obj.icon  &&  obj.homePage) { }}
      <i class="ui-icon-{{= icon }}" style="float-left; font-size: 20px; padding-right: 5px;"></i>
    {{ }               }}
      {{= title }}
      {{= obj.image || title.length < 20 ? '' : '<div class="dimmer">' }}
    </div>
    
  </li>
</script>

<script type="text/template" id="menuItemNewAlertsTemplate">
  <!-- Notifications item on the left-side slide-out menu panel -->
  <li class="list-group-item{{= typeof cssClass == 'undefined' ? '' : ' ' + cssClass }}" data-href="{{= pageUrl }}">
    <div style="padding:0 0 1rem 0; font-size:18px" class="gradientEllipsis" id="{{= typeof id === 'undefined' ? G.nextId() : id}}">
      {{= title }}   {{= obj.newAlerts ? '<span class="badge pull-right">' +  newAlerts + '</span>' : '' }} 
    </div>
  </li>
</script>

<script type="text/template" id="homeMenuItemTemplate">
  <!-- app home page menu item -->
  <li class="list-group-item{{= typeof cssClass == 'undefined' ? '' : ' ' + cssClass }}"  id="{{= typeof id == 'undefined' ? 'home123' : id }}">
    <img src="{{= typeof image != 'undefined' ? image : G.getBlankImgSrc() }}" style="float: right;" />
    {{= obj.icon ? '<i class="ui-icon' + icon + ' style="float:right""></i>' : ''}} 
    <a {{= typeof image != 'undefined' ? 'style="margin-left:35px;"' : '' }} target="#">
      {{= title }}
    </a>
  </li>
</script>

<script type="text/template" id="propRowTemplate">
  <!-- wrapper for one row on a list page (short) -->
  <li class="list-group-item" data-shortname="{{= shortName }}" {{= obj.rules || '' }}>{{= name }}<div style="float: right; font-weight: normal;">{{= value }}</div></li>
</script>
<script type="text/template" id="propRowTemplate2">
  <!-- wrapper for one row on a list page (long) -->
  <li class="list-group-item" data-shortname="{{= shortName }}" {{= obj.rules || '' }}>{{= name }}<div style="font-weight: normal;">{{= value }}</div></li>
</script>

<script type="text/template" id="propRowTemplate21">
  <!-- wrapper for one row on a list page (long) -->
  <li class="list-group-item" data-shortname="{{= shortName }}" {{= obj.rules || '' }}>{{= name }}<div style="float: right; font-weight: normal;">{{= value }}</div></li>
</script>

<script type="text/template" id="menuHeaderTemplate">
  <!-- menu header -->
  <li class="list-group-item{{= obj.cssClass ? ' ' + cssClass : '' }}"><i class="ui-icon-" + {{= icon }}"></i>
    {{= title }}
  </li>
</script>

<!-- EDIT TEMPLATES -->
<script type="text/template" id="resourceEdit">
<!-- the edit page for any particular resource -->
  <section id="{{= viewId }}" data-type="sidebar"></section>
  <section id="{{= viewId + 'r' }}"></section> 
<!--div id="headerMessageBar"></div-->
  <div id="headerDiv"></div>
  <div id="resourceEditView">
  <div id="resourceImage"></div>
  <form data-ajax="false" id="{{= viewId + '_editForm'}}" action="#">
  <section data-type="list">
    <ul id="fieldsList" class="editList">
    </ul>
  </section>
    <div name="errors" style="float:left"></div>
    {{ if (this.resource.isAssignableFrom("InterfaceImplementor")) { }}
    <div data-role="fieldcontain" id="ip">
      <fieldset class="ui-grid-a">
        <div class="ui-block-a"><a target="#" id="check-all" data-icon="check" data-role="button" data-mini="true">{{= loc('checkAll') }}</a></div>
        <div class="ui-block-b"><a target="#" id="uncheck-all" data-icon="sign-blank" data-role="button" data-mini="true">{{= loc('uncheckAll') }}</a></div>
      </fieldset>
      <fieldset id="interfaceProps">
      </fieldset>
    </div>
    {{ }                                                             }}    
  </form>
  <br/>
  {{ if (U.isAssignableFrom(this.vocModel, U.getLongUri1("model/portal/Comment"))) { }}
    <table class="ui-btn-up-g" width="100%" style="padding: 5px" id="comments">
    </table>
  {{ } }}
</div>
</script>

<script type="text/template" id="mvListItem">
  <!-- a multivalue input for edit forms -->
  {{ var id = G.nextId() }}
  <div class="checkboxFive">
    <input type="checkbox" name="{{= davDisplayName }}" id="{{= id }}" value="{{= _uri }}" {{= obj._checked ? 'checked="checked"' : '' }} />
    <label for="{{= id }}" style="margin-left:-2.5rem;"><!-- {{= obj._thumb ? '<img src="' + _thumb + '" style="float:right;max-height:40px;" />' : '' }}--></label>
    <span style="padding-left:1rem;vertical-align:top;">{{= davDisplayName }}</span>
  </div>
</script>


<script type="text/template" id="editRowTemplate">
  <!-- one property row in edit mode -->
  <li class="list-group-item" data-role="fieldcontain">{{= value }}</li>
</script>

<script type="text/template" id="stringPET">
<div class="_prim">
  {{ var isInput =  _.isUndefined(prop.maxSize) ||  prop.maxSize < 100; }}
  {{ if (name) { }}
    <label for="{{= id }}" class="ui-input-text" {{= isInput ? '' : 'style="vertical-align:top"' }}>{{= name }}</label>
    <{{= isInput ? 'input type="text"' : 'textarea rows="3" cols="20" ' }} name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : _.htmlEscape(value) }}" {{= rules }}  class="ui-input-text form-control">{{= typeof value != 'undefined' && !isInput ? value : '' }}</{{= isInput  ? 'input' :  'textarea' }}>
  {{ } }} 
  {{ if (!name) { }}
  <div> 
    <{{= isInput ? 'input type="text"' : 'textarea  rows="10"' }} name="{{= shortName }}" id="{{= id }}"  value="{{= typeof value === 'undefined' ? '' : _.htmlEscape(value) }}" {{= rules }} class="form-control">{{= typeof value != 'undefined' && !isInput ? value : '' }}</{{= isInput  ? 'input' :  'textarea' }}>
  </div>
  {{ } }} 
</div>
</script>

<script type="text/template" id="booleanPET">
<div class="_prim">
   <input type="checkbox" name="{{= shortName }}" id="{{= id }}" style="border:none;" class="formElement boolean form-control effeckt-ckbox-ios7 pull-right" {{= obj.value ? 'checked' : '' }}/>
  {{ if (name && name.length > 0) { }}
    <label for="{{= id }}">{{= name }}</label>
    {{= typeof comment == 'undefined' ? '' : '<br/><span class="comment">' + comment + '</span>' }} 
  {{ } }}
<!--  {{= typeof comment == 'undefined' ? '' : '<span class="comment">' + comment + '</span>' }} -->
</div>
</script>

<script type="text/template" id="resourcePET">
  {{ if (prop.range && ((isImage && prop.camera) || isVideo || isAudio)) { }}
    <a href="#cameraPopup" class="cameraCapture" target="#" data-prop="video">
      <i class="{{= isVideo ? 'ui-icon-facetime-video' : isAudio ? 'ui-icon-circle' : 'ui-icon-camera' }}" style="float:right;font-size:2.3rem;"></i>
    </a>
    {{ if (!G.canWebcam) { }}
      <input data-role="none" type="file" class="cameraCapture" accept="{{= isVideo ? 'video/*' : isAudio ? 'audio/*' : 'image/*' }};capture=camera;" style="visibility:hidden; display:none;" data-prop="{{= shortName }}" />
    {{ }                   }}
  {{ }                                                                                                                                                                                        }}
  <a target="#"  name="{{= shortName }}" class="resourceProp" id="{{= id }}" {{= obj.img ? 'style="padding: 0 1.5rem"' : ''}} {{= rules }}> 
    {{ if (obj.img) { }}    
      <img name="{{= shortName }}" src="{{= img }}" style="
      
      {{ if (typeof obj.width != 'undefined') { }}  
          height:{{= height }}px;
          left:-{{= left }}px; top:-{{= top }}px;
          clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);vertical-align:middle;"
      {{ } }}
      {{ if (typeof obj.width == 'undefined') { }}  
          max-height: 50px;
      {{ } }}
      
      "/>
    {{ }              }}
    
    <label for="{{= id }}" style="font-weight:normal">{{= name }}</label>
    {{= typeof displayName === 'undefined' || !displayName ? (typeof value === 'undefined' ||  value.length == 0 ? '' : value) : displayName }}
    {{ if (!obj.value) { }}
      {{= typeof comment == 'undefined' ? '' : '<br/><span class="comment">' + comment + '</span>' }}
    {{ } }} 
    <div class="triangle"></div>
  </a>
  
  <!-- {{= typeof multiValue === 'undefined' ? '' : value }} -->
</script>
<script type="text/template" id="telPET">
<div class="_prim">
  <label for="{{= id }}" class="ui-input-text">{{= name }}</label>
  <input type="tel" name="{{= shortName }}" id="{{= id }}" class="ui-input-text" value="{{= typeof value === 'undefined' ? '' : value }}" />
</div>
</script>

<script type="text/template" id="emailPET">
<div class="_prim">
  <label for="{{= id }}" class="ui-input-text">{{= name }}</label>
  <input type="email" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" class="form-control ui-input-text{{= ' formElement' }}" {{= rules }} />
</div>
</script>

<script type="text/template" id="hiddenPET">
  <input type="hidden" name="{{= shortName }}" id="{{= id }}" value="{{= value }}" class="{{= 'formElement ' }}ui-input-text form-control" {{= rules }} />
</script>

<script type="text/template" id="cameraPopupTemplate">
  <div id="cameraPopup" class="cameraPopup">
    <div style="position:relative">
    <a href="#" data-rel="back" id="cameraCancelBtn">
      <i class="ui-icon-remove-sign"></i>
    </a>
    {{ if (obj.video || obj.image) { }}
      <video id="camVideo" autoplay="autoplay"></video>
      <canvas id="canvas" width="100%" height="0"></canvas>
    {{ }                }}
    {{ if (obj.video || obj.audio) { }}
      <div id="camPreview">
      </div>
    {{ }                }}
    </div>
    <div style="text-align:center; padding:1rem 0;">
    <button class="btn btn-default" style="width:30%;">
      <a id="cameraShootBtn" target="#" class="ui-disabled" data-inline="true" data-mini="true" style="margin: 0 auto;">
        <i class="{{= obj.video || obj.audio ? 'icon-circle' : 'icon-camera' }}"></i>
        
        {{= obj.video || obj.audio ? 'Record' : 'Shoot' }}
      </a>
    </button>  
    <button class="btn btn-default" style="width:30%;">
      <a data-icon="ok" id="cameraSubmitBtn" target="#" class="ui-disabled" data-inline="true" data-mini="true" style="margin: 0 auto;">
        <i class="ui-icon-ok"></i>
        I'll take it
      </a>
    </button>  
    </div>
  </div>
</script>

</div>


