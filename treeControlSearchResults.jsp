<div>
<div nonPda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr valign="top">
  <td valign="top" align="middle" width="100%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr valign="top">
        <td valign="top" width="110%" colspan="2">
          <menu toolbar="toolbar1"  activate="onMouseOver"/>
          <menu toolbar="transport" activate="onMouseOver"/>
          <menu toolbar="search"    activate="onMouseOver"/>
          <menu toolbar="toolbar2"  activate="onMouseOver"/>
          <menu toolbar="toolbar3"  activate="onMouseOver"/>
          <menu toolbar="calendarAndChart" itype="http://www.hudsonfog.com/voc/model/recurrence/ScheduledItem" activate="onMouseOver"/>
          <print image="images/printerIcon.gif"/>
          <saveInExcel allow="owner" image="images/excel.gif"/>
          <pdaToPc image="images/pda.gif"/>
          <showHideWindows/>
        </td>
      </tr>

      <tr valign="top">
      <td width="100%">
        <form action="list.html" name="siteResourceList">
          <div align="left"><backLink /></div>
          <table width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td width="20%" valign="top"><folderTreeControl/></td>
            <td width="80%" valign="top"><siteResourceList /></td>
          </tr>
          </table>
          <div align="right"><measurement/></div>
          <addNewResource html="mkResource.html"/> 
          <delete/> 
          <reloadDocuments/>
          <createResources/>
          <showSetProperties />
        </form>
        <br/><pieChart/>
        <script language="JavaScript">
          var horizontalFilter_FIELDS = new Array();
	function disableSubmitButtonH(form) {
	  if (document.all || document.getElementById) {
            form.submit.disabled = true; 
            form.submit.value = 'Please wait';
            form.submit.style.cursor = 'wait'; 
            form.clear.style.visibility = 'hidden'; 
          }
	}
        </script>
        <form name="horizontalFilter" method="POST" action="FormRedirect" onSubmit="disableSubmitButtonH(this)"><!-- onsubmit="clearUnModifiedFields(horizontalFilter_FIELDS)"-->
          <br/>
          <horizontalFilter />
        </form>
      </td>
      <td width="10%" id="rightPanelPropertySheet" valign="top" align="left">
        <br/>
        <menu toolbar="filterLocal" type="onpage" title="false"/>
      </td>
      </tr>
    </table>
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
    <tr valign="top"><td valign="top">
      <img src="icons/icon.gif" width="16" height="16" align="middle"/>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>

        <!-- Auto-generated menus -->
        <menu toolbar="toolbar1"/>
        <menu toolbar="transport"/>
        <menu toolbar="search"/>
        <menu toolbar="filterLocal"/>
        <menu toolbar="toolbar2"/>
        <menu toolbar="toolbar3"/>
        <menu toolbar="calendarAndChart"/>
      
        <print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/>
        <pdaToPc image="images/pda.gif"/><changePassword/><userLogOff html="user-login.html"/>
        <showHideWindows/>
      </td>
    </tr>
    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
 
      <table width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td width="20%" valign="top"><folderTreeControl/></td>
          <td width="80%" valign="top"><siteResourceList /></td>
        </tr>
      </table>

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
	function disableSubmitButtonH(form) {
	  if (document.all || document.getElementById) {
            form.submit.disabled = true; 
            form.submit.value = 'Please wait';
            form.submit.style.cursor = 'wait'; 
            form.clear.style.visibility = 'hidden'; 
          }
	}
</script>
<form name="horizontalFilter" method="POST" action="FormRedirect" onSubmit="disableSubmitButtonH(this)"><!-- onsubmit="clearUnModifiedFields(horizontalFilter_FIELDS)"-->
  <br/>
    <horizontalFilter />
</form>
</div>
<br/>


<!--div align="left"><span class="xs"><hudsonFog /></span></div-->      <!-- link to Portal page for current category -->
</div>

