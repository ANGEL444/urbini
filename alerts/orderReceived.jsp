<div  style="border: 1px solid #cccccc; background-color: #fefefe; width:800px; margin:20px;">
<table width="100%" align="center" border="0" cellspacing="0" cellpadding="0">
  <tr style="padding: 9px; background-color: #ef6f16;">
    <td colspan="4" style="padding: 12px"><logo srcLarge="images/logo10.png"/></td>
  </tr>
<tr>
	<td width="2%" height="80"></td>
	<td width="90%" valign="center" height="80">
		<text text="Dear"/> <property name="to.firstName" href="y" noIcon="y"/> <property name="to.lastName" href="y" noIcon="y"/>,
		<!--text text="Dear"/> <property name="to" href="y" noIcon="y"/ -->
		<br/><br/>
		<text text="We hope you have a pleasant purchasing experience with:" />  </td>
	<td align="right" valign="center" height="80">
		<!--a href="#"><IMG src="icons/logo-large.png" border="0" height="32" align="right" /></a-->	</td>
    <td width="2%" height="80"></td>
</tr>
<tr>
  <td></td>
  <td colspan="2" valign="top">
    <where value="forum.getType() == 'http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy'">
      <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.featured" />
    </where>  
    <property name="resourceDescription" href="y" noIcon="y"/>
  </td>
  <td align="right" valign="top"></td>
</tr>
<tr>
  <td></td>
  <td colspan="3">
    <br/><br/>
    <text text="You can check the status of your transaction in 'Purchasing history'" /> <onYourProfile />
    <br/><br/>
		<text text="Customer Service"/>
    <br/><br/>
    <unsubscribeFromEmails />
    </td>
</tr>
</table>  
</div>