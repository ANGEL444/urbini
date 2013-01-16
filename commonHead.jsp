<container>
  <base href="serverName"/> <!-- needed to show images located under host/images-->
  <link href="icons/icon.ico"        type="image/x-icon" rel="shortcut icon" />
  <link href="styles/common.css"     type="text/css" rel="stylesheet" title="common"/>
  <link href="styles/properties.css" type="text/css" rel="stylesheet" />
  <link href="styles/iphone.css"     type="text/css" rel="stylesheet" /><!-- media="only screen and (max-device-width:480px)"  /-->
  <!--link href='styles/jplayer/blue.monday/jplayer.blue.monday.css' rel='stylesheet' type='text/css' /-->
  <getResource/>
  <link href=""  rel="image_src" />
	<feed/>
  <meta name="keywords" content=""></meta>
  <meta name="description" content=""></meta>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></meta>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0"></meta>
  <meta name="apple-mobile-web-app-capable" content="yes"></meta>
  <meta name="apple-mobile-web-app-status-bar-style" content="black"></meta>
  <meta name="google-site-verification" content="YJrn1vi9ouT5vFSUmhYmCIuVCdVhXkp8NBOVNplcfOs"></meta>
  <meta name="openGraph" content=""></meta>
  <include name="analytics-tracker.jsp" />
  <siteTitle />
  <!-- Facebook bug, they attach stuff even if redirect_uri is explicitly provided -->
  <script type="text/javascript">
    <![CDATA[
    if (window.location.hash == '#_=_') {
      console.log("hash stripped");
      window.location.hash = '';
    }
    ]]>
  </script>
 </container>