<div>
<hideBlock id="hideBlock">
  <watchNote/>
</hideBlock>
<getResource/>

<div id="gallery" class = "box" style="width:auto !important; width:1px;height:auto !important; height:1px;display:none;position:absolute;" itype="http://www.hudsonfog.com/voc/model/portal/ImageResource">
  <table bgcolor="#ffffff" cellpadding="0" cellspacing="0">
  	<tr><td>
	    <div id="titleBar" class="drag" dragcontainer="gallery"></div>
    </td></tr>
    <tr valign="top"><td class="largeImage" style="padding:5px;" valign="top"><img id="galleryImage" src="javascript: ;"></img></td></tr>
    <!--tr valign="top"><td class="largeImageWithHide" valign="top"><img id="galleryImage" src="javascript: ;"></img><img src="icons/hide.gif" border="0" width="16" height="16" align="top" onclick="return hide('gallery')" style="cursor: pointer;" title="click to close"></img></td></tr-->
  </table>
</div>

<errorMessage />


	<table id="resourceList" width="100%" cellspacing="0" cellpadding="0" border="0">
	<tr noInner="y" class="fts" valign="bottom">
  	<td><fullTextSearchChoice/></td><td><filter/></td><td align="right"><pagingResources /></td>
	</tr>
  <tr itype="http://www.hudsonfog.com/voc/system/designer/WebClass">    
    <td colspan="3" align="center"><filter addToTab="y"/></td>
  </tr>
  <tr height="5" colspan="3"><td></td></tr>
  <tr valign="top">
  <td width="100%" colspan="3">
		<div>
		  <searchHistory/>
		  <resourcesSearch resourcesUri = "text/search/resources" />
		  <filesSearch     filesUri     = "text/search/files" />
      <excelsSearch    excelsUri    = "text/search/excels" />
		</div>
    <taskTreeControl/>
    <div id="siteResourceList">
      <categories/>
      <errorMessage additems="y"/>
      <siteResourceList />
      <br/>
  	  <uploadAttachment/>
      <createResources/><br/>
    </div>
    <div align="right"><measurement/></div>
    <readOtherSiteInfo />
<hideBlock>
    <br/>
    <uploadMsProject/>
    <uploadToDelegatedFileSystem/>
<br/><br/>
    <pieChart/>
	<filterUrl />
</hideBlock>
  </td>
  </tr>
</table>
 
</div>
