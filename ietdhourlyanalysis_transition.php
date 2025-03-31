<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

$idx= '';
if(isset($_GET['idx'])) $idx = $_GET['idx'];

if($idx == '') exit;

$From = '';
$To = '';
$IETD = '';
$State = '';
$Station_coop = '';
$longitude = '';
$latitude = '';
$elevation = '';
$avdatato = '';
$avdatafrom = '';

include_once('./php_include/dbconnection_class.php');
$dbConnection = new Dbconnection;

$Query = "SELECT * FROM `hourlyprecipitation_analysis` AS `ANALYZ` INNER JOIN `precipitation_hourlydata_stations` AS `STATION` ON (`ANALYZ`.`Station`=`STATION`.`COOP`) WHERE `ANALYZ`.`Idx`=$idx; ";
//echo $Query;

$dbConnection->sendQuery($Query);
if($row  = $dbConnection->fetchAssoc())
{
	$From = $row["FromDateTime"];
	$To = $row["ToDateTime"];
	$IETD = $row["IETD"] / 60;
	$State = $row["State"];
	$Station_coop = $row["Station"];
}

unset($dbConnection);


?>
<script type="text/javascript">
	var form= document.createElement('form');
	form.method = "POST";
	form.action = "ietdhourlyanalysis.php";

	var element = null;

	element = document.createElement('input');
	element.name = 'from';
	element.value = '<?php echo($From)?>';
	form.appendChild(element); 

	element = document.createElement('input');
	element.name = 'to';
	element.value = '<?php echo($To)?>';
	form.appendChild(element); 

	element = document.createElement('input');
	element.name = 'state';
	element.value = '<?php echo($State)?>';
	form.appendChild(element); 

	element = document.createElement('input');
	element.name = 'station';
	element.value = '<?php echo($Station_coop)?>';
	form.appendChild(element); 

	element = document.createElement('input');
	element.name = 'ietd';
	element.value = '<?php echo($IETD)?>';
	form.appendChild(element); 

	form.submit();
</script>

