<html>
<siteTitle />
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="90%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <colgroup>
      <col width="90%" /> 
      <col width="10%" />
    </colgroup>
    <tr valign="top">
      <td valign="top" width="90%"><span class="xs"><language/><print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/></span></td>
      <td valign="top" align="right" width="10%"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <!--div align="left"><siteHistory/></div-->
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <div align="right"><measurement/></div>
      <addNewResource html="mkResource.html"/> 
      <showSetProperties />
    </form>
    </td>
    <td valign="top" align="left" bgcolor="eeeeee">

    <include name="searchText.jsp" />
    
    <form name="rightPanelPropertySheet" method="POST" action="FormRedirect">
      <rightPanelPropertySheet />
      <br></br>
      <center><input type="submit" name="submit" value="locate"></input></center>
      <input type="hidden" name="action" value="searchLocal"></input>
      <br></br>
      <!--showSetProperties /-->
    </form>
  </td>
</tr></table>
</td></tr></table>
<br />
<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
</html>

