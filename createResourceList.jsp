<html>
<siteTitle />

<pda nonPda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td>

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="90%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <colgroup>
      <col width="90%" /> 
      <col width="10%" />
    </colgroup>
    <tr valign="top">
      <td valign="top" width="90%"><span class="xs"><language/><print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/><pdaToPc image="images/pda.gif"/></span></td>
      <td valign="top" width="10%"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>

    <tr valign="top"><td>
    <form action="editList.html" name="siteResourceList" method="POST">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <div align="right"><measurement/></div>
      <input type="hidden" name="action" value="createResources" />
      <input type="hidden" name="create"  value="1"/>
      <input type="submit" name="submit"/>
    </form>
    </td>
    <td valign="top" align="left" bgcolor="eeeeee">

    <include name="searchText.jsp" />
    
    <form name="rightPanelPropertySheet" method="POST" action="FormRedirect">
      <table border="1" cellpadding="3" cellspacing="0"><tr><td align="middle" class="title">
      <input type="submit" name="submit"  class="button1" value="Filter"></input>
      <input type="submit" name="clear"  class="button1" value="Clear"></input>
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
      <input type="submit" name="submit" class="button1" value="Filter"></input>
      <input type="submit" name="clear"  class="button1" value="Clear"></input>
      <input type="hidden" name="action" value="searchLocal"></input>
      <input type="hidden" name="action1" value="createResources"/>
      <input type="hidden" name="create"  value="1"/>
      </td></tr></table>   
    </form>
  </td>
</tr>

</table>
</td></tr>
</table>
</td></tr>
</table>
<br />
</pda>

<pda pda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="100%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top"><td valign="top">
      <img src="icons/icon.gif" width="16" height="16" align="middle"/>
      <img src="icons/icon_divider.gif" align="middle" border="0"></img>

      <!-- Auto-generated menus -->
      <menu additionalDivs="textdiv1 textdiv2 textdiv3 menudiv_language"/>

      <img src="icons/icon_divider.gif" align="middle" border="0"></img>
      <A title="Search"    href="javascript://" onClick="menuOpenClose('textdiv1', 'searchImg')"><IMG id="searchImg" src="images/search.gif"  width="16" height="16" align="middle" border="0"/></A>
      <A title="Filter"    href="javascript://" onClick="menuOpenClose('textdiv2', 'filterImg')"><IMG id="filterImg" src="images/filter.gif"  width="16" height="16" align="middle" border="0"/></A>
      <A title="Email"     href="javascript://" onClick="menuOpenClose('textdiv3', 'emailImg')"><IMG id="emailImg" src="images/email.gif"  width="16" height="16" align="middle" border="0"/></A>
      <A title="Languages"  href="javascript://" onClick="menuOpenClose('menudiv_language', 'menuicon_language')"><IMG id="menuicon_language" src="images/globus.gif" align="middle" border="0"/></A>
      <img src="icons/icon_divider.gif" align="middle" border="0"></img>
      
      <span class="xs"><div id="language" class="popMenu"><language/></div></span><print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/>
      <pdaToPc image="images/pda.gif"/><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <form action="editList.html" name="siteResourceList" method="POST">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <input type="hidden" name="action" value="createResources" />
      <div align="right"><measurement/></div>
      <input type="submit" name="submit"/>
      <input type="hidden" name="create" value="1"/>
    </form>
    </td></tr>
    </table>
</td></tr></table>
<br />

<div>
  <div id="textdiv2" class="popMenu">
<table bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0">
<tr><td>
<div style="border-style:solid; border-width: 1px; border-color:#666666 #666666 #666666 #666666">
<div style="border-style:solid; border-width: 1px; border-color:#F9F8F7 #F9F8F7 #F9F8F7 #F9F8F7">
<table border="0" cellpadding="0" cellspacing="0">
<tr>
  <td unselectable="on" bgcolor="#003070" class="cswmItem" style="padding-left:3" colspan="2">
    <b><font color="FFFFFF">Filter</font></b>
  </td>
  <td unselectable="on" bgcolor="#003070" style="padding-right:3; padding-top:3; padding-bottom:3">
    <A title="Close" onclick="menuOpenClose('textdiv2')" 
       href="javascript://"><IMG alt="Click here to close" 
       src="images/button_popup_close.gif" 
       border="0" style="display:block"></IMG>
    </A>
  </td>
</tr>
<tr>  
  <td bgcolor="#DBD8D1" width="15" class="cswmItem"></td>
  <td bgcolor="#FFFFFF">
      <table width="100%" cellspacing="0" cellpadding="5" border="0">
        <tbody>
          <tr>
            <td>
<table border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td><include name="searchText.jsp" /></td>
</tr>
<tr><td>    
    <form name="rightPanelPropertySheet" method="POST" action="FormRedirect">
      <table border="1" cellpadding="3" cellspacing="0">
      <tr><td align="middle" class="title">
        <input type="submit" name="submit"  class="button1" value="Filter"></input>
        <input type="submit" name="clear"  class="button1" value="Clear"></input>
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
        <input type="submit" name="submit" class="button1" value="Filter"></input>
        <input type="submit" name="clear"  class="button1" value="Clear"></input>
        <input type="hidden" name="action" value="searchLocal"></input>
      </td></tr></table>   
    </form>
</td></tr></table>
</td></tr></table>
</td><td bgcolor="#FFFFFF"></td></tr>
</table>
</div></div>
</td></tr>
  </table>
</div>

</div>
<table border="0" cellspacing="0" cellpadding="0">
  <tr><td><pieChart/></td></tr>
</table>
</pda>
<br/>


<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
</html>

