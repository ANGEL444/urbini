<div>
<table id="resourceList" width="100%" border="0" cellspacing="0" cellpadding="0">
	<tr noInner="y" class="ftsLine"><td colspan="3">
	  <table class="ftsq" width="100%">
	  <tr>
	    <td><include name="searchText.jsp"/></td><td align="right"><pagingResources /></td>
	  </tr>
	  </table>
	  </td>
	</tr>
<tr  valign="top">
  <td valign="top" align="middle" width="110%">
		<form name="categoryTextSearch">
			  <searchHistory/>
			  <categoryTextSearch />
			  <resourcesSearch resourcesUri = "text/search/resources" />
			  <filesSearch     filesUri     = "text/search/files" />
		</form>
    <taskTreeControl/>
    <parallelResourceList />
    <div align="right"><measurement/></div>
    <createResources/><br/>
  </td>
<hideBlock>
  <td valign="top" align="left" bgcolor="eeeeee">
    <include name="commonFilter.jsp" />
    <!--menu toolbar="filterParallel" type="onpage" title="false"/-->
  </td>
</hideBlock>
</tr>
</table>
<br />
</div>

