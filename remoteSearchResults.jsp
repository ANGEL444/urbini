<html>
<script language="JavaScript" src="calendar/calendar1.html"></script>
<siteTitle />

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
      <createResources/>
      <showSetProperties />
    </form>
    </td>
    <td valign="top" align="left" bgcolor="eeeeee">

    <include name="searchText.jsp" />
    
    <form name="rightPanelPropertySheet" method="POST" action="remoteSearchResults.html">
      <table border="1" cellpadding="3" cellspacing="0"><tr><td align="middle" class="title">
        <input type="submit" name="submit" class="button1" value="Filter"></input>
        <input type="submit" name="clear" class="button1" value="Clear"></input>
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
        <input type="submit" name="submit" class="button1" value="Filter"></input>
        <input type="submit" name="clear" class="button1" value="Clear"></input>
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
      <td valign="top">
        <img src="icons/icon.gif" width="16" height="16" align="middle"/>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>

        <!-- Auto-generated menus -->
        <menu additionalDivs="textdiv1 textdiv2 textdiv3 textdiv4 menudiv_language"/>

        <img src="icons/icon_divider.gif" align="middle" border="0"></img>
        <A title="Search"    href="javascript://" onClick="menuOpenClose('textdiv1', 'searchImg')"><IMG id="searchImg" src="images/search.gif"  width="16" height="16" align="middle" border="0"/></A>
        <A title="Filter"    href="javascript://" onClick="menuOpenClose('textdiv2', 'filterImg')"><IMG id="filterImg" src="images/filter.gif"  width="16" height="16" align="middle" border="0"/></A>
        <A title="Email"     href="javascript://" onClick="menuOpenClose('textdiv3', 'emailImg')"><IMG id="emailImg" src="images/email.gif"  width="16" height="16" align="middle" border="0"/></A>
        <A title="Schedule"  href="javascript://" onClick="menuOpenClose('textdiv4', 'scheduleImg')"><IMG id="scheduleImg" src="images/calendar.gif"  width="16" height="16" align="middle" border="0"/></A>
        <A title="Languages"  href="javascript://" onClick="menuOpenClose('menudiv_language', 'menuicon_language')"><IMG id="menuicon_language" src="images/globus.gif" align="middle" border="0"/></A>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>
        <print image="images/printerIcon.gif"/>
        <saveInExcel allow="owner" image="images/excel.gif"/>
        <pdaToPc image="images/pda.gif"/>
        <changePassword/>
        <userLogOff html="user-login.html"/>
        <language/>
      </td>
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
<div>
<div>

<table border="0" cellspacing="0" cellpadding="0" nonPda="T">
<tr  valign="top">
  <td valign="top"><br/><include name="searchText.jsp" /></td>
</tr>
<tr><td>    
    
    <form name="rightPanelPropertySheet" method="POST" action="remoteSearchResults.html">
      <table border="1" cellpadding="3" cellspacing="0">
        <tr><td align="middle" class="title">
          <input type="submit" name="submit" class="button1" value="Filter"></input>
          <input type="submit" name="clear" class="button1" value="Clear"></input>
        </td></tr>
        <tr><td><rightPanelPropertySheet /></td></tr>
        <tr><td align="middle" class="title">
          <input type="submit" name="submit" class="button1" value="Filter"></input>
          <input type="submit" name="clear" class="button1" value="Clear"></input>
          <input type="hidden" name="action" value="searchParallel"></input>
          <input type="hidden" name="site" value=""></input>
        </td></tr>
      </table>   
    </form>
  </td>
</tr></table>

  <div id="textdiv2" class="popMenu" pda="T">
<table bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0">
<tr><td>
<div style="border-style:solid; border-width: 1px; border-color:#666666 #666666 #666666 #666666">
<div style="border-style:solid; border-width: 1px; border-color:#F9F8F7 #F9F8F7 #F9F8F7 #F9F8F7">
<table border="0" cellpadding="0" cellspacing="0">
<tr>
  <td unselectable="on" bgcolor="#0055e6" class="cswmItem" style="padding-left:3">
    <b><font color="FFFFFF">Filter</font></b>
  </td>
  <td unselectable="on" bgcolor="#0055e6" style="padding-right:3; padding-top:3; padding-bottom:3" align="right">
    <A title="Close" onclick="menuOpenClose('textdiv2')" 
       href="javascript://"><IMG alt="Click here to close" 
       src="images/button_popup_close.gif" 
       border="0" style="display:block"></IMG>
    </A>
  </td>
</tr>
<tr>  
  <td bgcolor="#FFFFFF" colspan="2">
      <table width="100%" cellspacing="0" cellpadding="5" border="0">
        <tbody>
          <tr>
            <td>
<table border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top"><include name="searchText.jsp" /></td>
</tr>
<tr><td>
    <form name="rightPanelPropertySheet" method="POST" action="remoteSearchResults.html">
      <table border="1" cellpadding="3" cellspacing="0">
        <tr><td align="middle" class="title">
          <input type="submit" name="submit" class="button1" value="Filter"></input>
          <input type="submit" name="clear" class="button1" value="Clear"></input>
        </td></tr>
        <tr><td><rightPanelPropertySheet /></td></tr>
        <tr><td align="middle" class="title">
          <input type="submit" name="submit" class="button1" value="Filter"></input>
          <input type="submit" name="clear" class="button1" value="Clear"></input>
          <input type="hidden" name="action" value="searchParallel"></input>
          <input type="hidden" name="site" value=""></input>
        </td></tr>
      </table>   
    </form>
  </td>
</tr></table>
</td></tr></table>
</td></tr>
</table>
</div></div>
</td></tr>
  </table>
</div>

</div>
</div>
</pda>
<br />
<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
</html>

