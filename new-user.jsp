<HTML>
<include name="include/commonHeader" />
<include name="registerScript.html" />

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" width="20%">
    <include name="include/commonLeft" />
  </td>
  <td valign="top" align="middle">
<br />

<form name="loginform" action="j_security_check" method="POST"><table border="0" cellpadding="0" cellspacing="0" width="256" cols="2">
  <tr>
    <td align="RIGHT">User ID:<img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Text" name="j_username" size="10" maxlength="50"/></td>
  </tr>
  <tr><td align="RIGHT">  
    Password:<img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Password" name="j_password"  size="10" maxlength="50"/></td>
  </tr>
  <tr><td align="RIGHT">  
    Reenter Password:<img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Password" name="j_password_reenter"  size="10" maxlength="50"/></td>
  </tr>
  <tr>
    <td align="CENTER" colspan="2">
      <br />
      <input type="Submit" value="logOn"/>
    </td>
  </tr>
</table>
  <returnUri />
</form>

</td></tr></table>
<include name="include/commonFooter" />
</BODY>

</HTML>