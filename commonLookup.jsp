<div>
    <div id="textdiv1" class="popMenu" pda="T">
<table bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0">
<tr><td>
<div style="border-style:solid; border-width: 1px; border-color:#666666 #666666 #666666 #666666">
<div style="border-style:solid; border-width: 1px; border-color:#F9F8F7 #F9F8F7 #F9F8F7 #F9F8F7">
<table border="0" cellpadding="0" cellspacing="0">
<tr>
  <td unselectable="on" bgcolor="#003070" class="cswmItem" style="padding-left:3" colspan="2">
    <b><font color="FFFFFF">Search</font></b>
  </td>
  <td unselectable="on" bgcolor="#003070" style="padding-right:3; padding-top:3; padding-bottom:3">
    <A title="Close" onclick="menuOpenClose('textdiv1')" 
       href="javascript://"><IMG alt="Click here to close" 
       src="images/button_popup_close.gif" 
       border="0" style="display:block"></IMG>
    </A>
  </td>
</tr>
<tr>
  <td bgcolor="#DBD8D1" width="15" class="cswmItem"></td>
  <td bgcolor="#FFFFFF">
      <table width="100%" cellspacing="2" cellpadding="5" border="0">
        <tbody>
          <tr>
            <td>
              <form name="reel" action="localSearchResults.html">
              <text text="Reel #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/paper/products/Reel/number" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <!--input type="hidden" name="action" value="searchParallel" /-->
                <input type="hidden" name="action" value="searchLocal" />
                <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/model/top/FulfillmentItem" />
                <input type="hidden" name="interface" value="http://www.hudsonfog.com/voc/paper/products/ReelFormat"/>
                <input type="hidden" name="interface" value="http://www.hudsonfog.com/voc/paper/products/Reel"/>
              </form>
              <form name="reel" action="remoteSearchResults.html">
              <text text="Reel # (for tracking)" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/paper/products/Reel/number" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" />
                <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/model/top/FulfillmentItem" />
                <input type="hidden" name="interface" value="http://www.hudsonfog.com/voc/paper/products/ReelFormat"/>
                <input type="hidden" name="interface" value="http://www.hudsonfog.com/voc/paper/products/Reel"/>
              </form>
              <form name="container" action="remoteSearchResults.html">
              <text text="Container #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/model/delivery/ContainerOnRailwayPlatform" />
              </form>
              <form name="vessel" action="remoteSearchResults.html">
              <text text="Vessel #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/VesselTransport" />
              </form>
              <form name="truck" action="remoteSearchResults.html">
              <text text="Truck #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/Trucks" />
              </form>
              <form name="BlockTrain" action="remoteSearchResults.html">
              <text text="Block train #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/TrainTransport" />
              </form>
              <form name="BL" action="remoteSearchResults.html">
              <text text="BL #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/views/delivery/BillOfLading2/number" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/BillOfLading2" />
              </form>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
    <td bgcolor="#FFFFFF"></td>
  </tr>
</table>
</div></div>
</td></tr>
  </table>
</div>

      <table width="100%" cellspacing="2" cellpadding="5" border="0" nonPda="T">
        <tbody>
          <tr>
            <td><font color="darkblue"><b><text text="Search"/></b></font></td>
          </tr>
          <tr>
            <td>
              <form name="reel" action="localSearchResults.html">
              <text text="Reel #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/paper/products/Reel/number" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <!--input type="hidden" name="action" value="searchParallel" /-->
                <input type="hidden" name="action" value="searchLocal" />
                <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/model/top/FulfillmentItem" />
                <input type="hidden" name="interface" value="http://www.hudsonfog.com/voc/paper/products/ReelFormat"/>
                <input type="hidden" name="interface" value="http://www.hudsonfog.com/voc/paper/products/Reel"/>
              </form>
              <form name="reel" action="remoteSearchResults.html">
              <text text="Reel # (for tracking)" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/paper/products/Reel/number" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" />
                <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/model/top/FulfillmentItem" />
                <input type="hidden" name="interface" value="http://www.hudsonfog.com/voc/paper/products/ReelFormat"/>
                <input type="hidden" name="interface" value="http://www.hudsonfog.com/voc/paper/products/Reel"/>
              </form>
              <form name="container" action="remoteSearchResults.html">
              <text text="Container #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/model/delivery/ContainerOnRailwayPlatform" />
              </form>
              <form name="vessel" action="remoteSearchResults.html">
              <text text="Vessel #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/VesselTransport" />
              </form>
              <form name="truck" action="remoteSearchResults.html">
              <text text="Truck #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/Trucks" />
              </form>
              <form name="BlockTrain" action="remoteSearchResults.html">
              <text text="Block train #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/TrainTransport" />
              </form>
              <form name="BL" action="remoteSearchResults.html">
              <text text="BL #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/views/delivery/BillOfLading2/number" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/BillOfLading2" />
              </form>
            </td>
          </tr>
        </tbody>
      </table>
</div>
