<html>
<script language="JavaScript">
<include name="calendar/calendar1.html"/>
</script>
<pda nonPda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="95%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <colgroup>
      <col width="90%" /> 
      <col width="10%" />
    </colgroup>
    <tr valign="top">
      <td valign="top" width="90%"><span class="xs"><language/> <print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/></span><pdaToPc image="images/pda.gif"/></td>
      <td valign="top" align="right" width="10%"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <parallelResourceList />
      <div align="right"><measurement/></div>
      <addNewResource html="mkResource.html"/> 
      <showSetProperties />
    </form>
    </td>
    <td valign="top" align="left" bgcolor="eeeeee">

    <include name="searchText.jsp" />
    
    <form name="rightPanelPropertySheet" method="POST" action="remoteSearchResults.html">
      <table border="1" cellpadding="3" cellspacing="0"><tr><td align="middle" class="title">
        <input type="submit" name="submit" class="button1" value="filter"></input>
        <input type="submit" name="clear" class="button1" value="clear"></input>
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
        <input type="submit" name="submit" class="button1" value="filter"></input>
        <input type="submit" name="clear" class="button1" value="clear"></input>
        <input type="hidden" name="action" value="searchParallel"></input>
        <input type="hidden" name="site" value=""></input>
      </td></tr></table>   
    </form>
  </td>
</tr></table>
</td></tr></table>
</pda>
<pda pda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="95%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top">
      <td valign="top"><img src="icons/icon.gif"/><span class="xs"><language/> <print image="images/printerIcon.gif"/> <saveInExcel allow="owner" image="images/excel.gif"/></span><pdaToPc image="images/pda.gif"/><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <parallelResourceList />
      <div align="right"><measurement/></div>
      <addNewResource html="mkResource.html"/> 
      <showSetProperties />
    </form>
  </td></tr></table>
 </td></tr></table>   

<br />

<table border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top"><include name="searchText.jsp" /></td>
</tr>
<tr><td>    
    
    <form name="rightPanelPropertySheet" method="POST" action="remoteSearchResults.html">
      <table border="1" cellpadding="3" cellspacing="0"><tr><td align="middle" class="title">
      <input type="submit" name="submit" class="button1" value="filter"></input>
      <input type="submit" name="clear" class="button1" value="clear"></input>
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
      <input type="submit" name="submit" class="button1" value="filter"></input>
      <input type="submit" name="clear" class="button1" value="clear"></input>
      <input type="hidden" name="action" value="searchParallel"></input>
      <input type="hidden" name="site" value=""></input>
      </td></tr></table>   
    </form>
  </td>
</tr></table>
</td></tr></table>
</pda>
<br />
<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
</html>

