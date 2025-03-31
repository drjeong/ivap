<?php
include_once ('./php_include/dbconnection_class.php');
$dbConnection = new Dbconnection;

function parseToXML($htmlStr)
{
$xmlStr=str_replace('<','&lt;',$htmlStr);
$xmlStr=str_replace('>','&gt;',$xmlStr);
$xmlStr=str_replace('"','&quot;',$xmlStr);
$xmlStr=str_replace("'",'&#39;',$xmlStr);
$xmlStr=str_replace("&",'&amp;',$xmlStr);
return $xmlStr;
}

header("Content-type: text/xml");

// Start XML file, echo parent node
echo '<markers>';

$sql="SELECT * FROM `precipitation_hourlydata_stations` AS `PSTN` INNER JOIN `precipitation_hourlydata_summary` AS `PSMRY` ON (`PSTN`.`COOP`=`PSMRY`.`Station`) ORDER BY `State`, `Name`";
$dbConnection->sendQuery($sql);
while($row = $dbConnection->fetchAssoc())
{
	// Add to XML document node
	echo '<marker ';
	echo 'coop="' . parseToXML($row['COOP']) . '" ';
	echo 'name="' . parseToXML($row['Name']) . '" ';
	echo 'state="' . parseToXML($row['State']) . '" ';
	echo 'lat="' . $row['Latitude'] . '" ';
	echo 'lng="' . $row['Longitude'] . '" ';
	echo 'elevation="' . $row['Elevation'] . '" ';
	echo 'records="' . $row['NumofRecords'] . '" ';
	echo 'datafrom="' . parseToXML($row['DataFrom']) . '" ';
	echo 'datato="' . parseToXML($row['DataTo']) . '" ';
	echo '/>';
}

// End XML file
echo '</markers>';

?>