<table border="0" cellspacing="0" cellpadding="0">
  <tr valign="top">
    <td><include name="searchText.jsp" /></td>
  </tr>
  <tr>
    <td>    
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
            <input type="hidden" name="action" value="searchParallel"></input>
          </td></tr>
        </table>   
      </form>
    </td>
  </tr>
</table>