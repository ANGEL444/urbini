<html>

<body onload="document.loginform.j_username.focus();">
<include name="hashScript.html"/>

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" align="middle">

<br />
<form name="loginform" method="post" action="j_security_check"  onsubmit="return hash(this, 'j_security_check')">
<table cellpadding="0" border="0" cellspacing="0" width="356">
  <tr>
    <td class="xl" colspan="2"><text text="Your session has expired. Please enter userid and password:"/><br/></td>
  </tr>
  <tr>
    <td align="right"><text text="User ID:"/><img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="text" class="xxs" name="j_username" size="10" /></td>
  </tr>
  <tr>
    <td align="right"><text text="Password:"/><img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="password" class="xxs" name="j_password" size="10" />  </td>
  </tr>

  <!--tr>
    <td></td>
    <td><userLogin html="new-user.html" title="registerMe" /></td>
  </tr-->
  <tr>
    <td></td>
    <td><br/><input type="submit" name="s" value="Log on" />  </td>
  </tr>
  <!--tr>
    <td colspan="2">
    <font size="-1"> If you do not remember your Password, click &quot;Give me a new Password&quot; and we will send it to the email address you
                     specified when you registered.</font>

    </td>
  </tr-->
</table>
  <returnUri />
  <challenge />
</form>
</td></tr></table>

</body>
</html>
