<html>
  <head>
    <getResource />
  </head>
  <body>
<div style=" margin:-8px; padding:20px; height:100%; font-family:'lucida grande', tahoma, verdana, arial; " >

<table border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td>
<table border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td height="30"  bgcolor="#FF9900"><div align="left"><span style=" padding-left:20px; color:#FFFFFF"><strong><logo/></strong></span></div></td>
  </tr>
  
  <tr>
    <td>
    <table cellpadding="0" cellspacing="0" style="border: 1px solid #cccccc">
  <tr>
    <td>
    <table width="600px" border="0" align="left" cellpadding="5" cellspacing="0" bgcolor="#ffffff">
      <where value="to != null" itype="http://www.hudsonfog.com/voc/model/workflow/Alert">
      <tr valign="center">
        <td width="30"></td>
        <td height="50">
          <where value="to.firstName != null">
            <text text="Hello"/> <property name="to.firstName" href="y" noIcon="y"/>,
          </where>
          <where value="to.firstName == null">
            <text text="Hello"/> <property name="to.email" href="y" noIcon="y"/>,
          </where>
        </td>
        <td width="30"></td>
      </tr>
      </where>
      <tr valign="center">
        <td width="30"></td>
        <td height="50">
          <file/>
        </td>
        <td width="30"></td>
      </tr>  
      <tr valign="center">
        <td></td>
        <td height="50"><br /><font color="#E12E05" size="-1"><promptToSetCityScape /></font></td>
        <td></td>
      </tr>
      <!-- tr valign="center">
        <td></td>
        <td height="50"><hostSignature /></td>
        <td></td>
      </tr -->
      <tr valign="bottom">
        <td></td>
        <td height="10"><hr/></td>
        <td width="30"></td>
      </tr>
      <tr valign="bottom">
        <td></td>
        <td height="30"><font color="#888888" size="-1"><unsubscribeFromEmails /></font></td>
        <td width="30"></td>
      </tr>
      
      <tr valign="bottom">
        <td></td>
        <td height="30" align="right">
          <where value="alertType != null" itype="http://www.hudsonfog.com/voc/model/workflow/Alert">
            <font color="#e1e1e1" size="-6"><property name="alertType" href="y"/></font>
          </where>
        </td>
        <td></td>
      </tr>

  </table>
  
    </td>
  </tr>
</table>

    </td>
  </tr>
</table>

    </td>
  </tr>
</table>

</div>

</body>
</html>
