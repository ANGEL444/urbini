<html>
<include name="include/commonHeader.html" />

<!--body text="#000000" bgcolor="#FFFFFF" link="#0000FF" vlink="#FF0000" alink="#000088"-->


<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" width="20%">
    <include name="include/commonLeft.html" />
  </td>
  <td valign="top" align="middle">

<br />
<form method="post" action="j_security_check">
<table cellpadding="0" border="0" cellspacing="0" width="%1">
  <tr>
    <td class="xl" colspan="2">Your session has expired. Please enter userid and password: <br/></td>
  </tr>
  <tr>
    <td align="right">Fog ID:</td>
    <td><input type="text" name="j_username" size="15" /></td>
  </tr>
  <tr>
    <td align="right">Password:</td>
    <td><input type="password" name="j_password" size="15" />  </td>
  </tr>

  <tr>
    <td></td>
    <td><userLogin html="new-user.html" title="I am not a member, register me please" /></td>
  </tr>
  <tr>
    <td></td>
    <td><input type="submit" name="s" value="Log in" />  </td>
  </tr>
  <!--tr>
    <td colspan="2">
    <font size="-1"> If you do not remember your Password, click &quot;Give me a new Password&quot; and we will send it to the email address you
                     specified when you registered.</font>

    </td>
  </tr-->
</table>
<returnUri />
</form>
</td></tr></table>

<include name="include/commonFooter.html" />
</body>
</html>
