<div>
<div nonPda="T">
<font color="red"><b><errorMessage /></b></font>
<hideBlock id="hideBlock">
<watchNote/>
</hideBlock>
<a target="pane2"> </a>
<div id="pane2" />

<table width="100%" cellspacing="0" cellpadding="0" border="0">
<tr valign="top">
  <td width="110%" colspan="2"><!--br/-->
<form name="categoryTextSearch">
  <searchHistory/>
  <categoryTextSearch />
  <resourcesSearch resourcesUri="/sql/text/search/resources" />
  <filesSearch filesUri="text/search/files" />
</form>
    <taskTreeControl/>
    <siteResourceList />
    <div align="right"><measurement/></div>
    <readOtherSiteInfo />
    <br/>
<hideBlock>
    <div id="pane3">
    <br/>
    <uploadMsProject/>
    <createResources/><br/>
<br/><br/>
      <pieChart/>
    </div>

    <script language="JavaScript">
      var horizontalFilter_FIELDS = new Array();
    </script>
    <form name="horizontalFilter" id="filter" method="POST">
      <br/>
      <horizontalFilter />
    </form>
</hideBlock>
  </td>
  <td width="5%" id="rightPanelPropertySheet" valign="top" align="left">
<hideBlock>
    <br/>
    <menu toolbar="filterLocal" type="onpage" title="false"/>
</hideBlock>
  </td>
  </tr>
</table>
<br />
</div>

<div pda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr valign="top">
  <td valign="top" align="middle" width="100%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top">
      <td valign="top">
        <img src="icons/icon.gif" width="16" height="16" align="middle"/>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>

        <!-- Auto-generated menus -->
        <menu toolbar="toolbar1"/>
        <menu toolbar="transport"/>
        <menu toolbar="search"/>
        <menu toolbar="filterLocal"/>
        <menu toolbar="toolbar2"/>
        <menu toolbar="support" allow="admin"/>
        <menu toolbar="personalization"/>

        <menu toolbar="calendarAndChart"/>

        <print image="icons/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/>
        <showHideWindows/>
        <pdaToPc image="icons/pda.gif"/><changePassword/><userLogOff html="user-login.html"/>
      </td>
      <form name="searchForm" method="GET" action="searchResult.html" valign="middle">
        <td valign="top" align="right" width="10%"><include name="searchText.jsp"/></td>
      </form>

    </tr>
    <tr valign="top"><td colspan="2">
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <taskTreeControl/>
      <siteResourceList />
      <createResources/>
      <div align="right"><measurement/></div>
    </form>
    </td></tr>

    </table>
</td></tr></table>
<br />

<table border="0" cellspacing="0" cellpadding="0">
  <tr><td><pieChart/></td></tr>
</table>
<script language="JavaScript">
  var horizontalFilter_FIELDS = new Array();
</script>
<form name="horizontalFilter" id="filter" method="POST">
  <br/>
    <horizontalFilter />
</form>
</div>
<br/>


<!--div align="left"><span class="xs"><hudsonFog /></span></div-->   <!-- link to Portal page for current category -->
<iframe name="bottomFrame" id="bottomFrame" src="about:blank" scrolling="no" frameborder="0" style="overflow:visible; width:0;height:0"> </iframe>

</div>
