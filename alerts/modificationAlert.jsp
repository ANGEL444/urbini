<div style="border: 2px solid #f55200; background-color: #fefefe;">
<br/>
<table width="100%" border="0">
  <tr style="padding: 9px; background-color: #ef6f16;">
    <td colspan="3" style="padding: 12px"><logo srcLarge="images/logo10.png"/></td>
  </tr>
<tr>
  <td width="2%"></td>
  <td>
		<text text="Dear"/> <property name="to" href="y" noIcon="y"/>
		<br/><br/>
		<text text="The" /> <property name="forum" type="y"/> <property name="forum" href="y"/> <text text="was modified." />
		<br/>
		<where value="modification != null">
		  <text text="Changes made by " /> <property name="modification.modifiedBy" href="y" /> <text text=" are below:" />
		</where>
  </td>
	<td align="right" valign="top">
		<a href="#"><IMG src="icons/logo-large.png" border="0" height="32" align="right" /></a>
	</td>
</tr>
<tr>
  <td></td>
  <td colspan="2">
		<propertySheet name="modification"/>
    <where value="modification == null">
    <br/>
		  <property name="description" noIcon="y"/>
    <br/>
		</where>
		<newComment/>
		<text text="Customer Service"/>
		<br/>
		<!--siteOwner/-->
		<br/>
		<b><text text="Powered by"/></b> <a href="http://lablz.com" target="_blank">Lablz</a>
	</td>
</tr>
</table>
</div>