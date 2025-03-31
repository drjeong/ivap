<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

include_once('./php_include/dbconnection_class.php');
$dbConnection = new Dbconnection;

$FromDateTime = '';
$ToDateTime = '';
$State = '';
$Station_coop = '';

if(isset($_GET['from'])) $FromDateTime = $_GET['from'];
if(isset($_GET['to'])) $ToDateTime = $_GET['to'];
if(isset($_GET['state'])) $State = strtolower($_GET['state']);
if(isset($_GET['station'])) $Station_coop = $_GET['station'];

$Query = "SELECT `PDATA`.`Station`, `PSTA`.`Name`, `PSTA`.`State`, `PSTA`.`Country`, `PDATA`.`Date` - INTERVAL 1 HOUR AS `DataFrom`, `PDATA`.`Date` AS `DataTo`, `PDATA`.`HPCP`  FROM `Precipitation_HourlyData` AS `PDATA` INNER JOIN `precipitation_hourlydata_stations` AS `PSTA` ON (`PDATA`.`Station`=`PSTA`.`COOP`) WHERE `PSTA`.`State`='$State' AND `PSTA`.`COOP`='$Station_coop' AND `PDATA`.`Date`>='$FromDateTime' AND `PDATA`.`Date`<='$ToDateTime' AND `PDATA`.`HPCP`>=0 AND `PDATA`.`HPCP` IS NOT NULL";

$dbConnection->sendQuery($Query);
if ($dbConnection->Fnum_rows() > 0)
{
	$date = new DateTime();
	$filename = 'hourlyprecipitation_'. $date->getTimestamp() . '.csv';

	// output headers so that the file is downloaded rather than displayed
	header('Content-Type: text/csv; charset=utf-8');
	header('Content-Disposition: attachment; filename='.$filename);

	// create a file pointer connected to the output stream
	$output = fopen('php://output', 'w');

	// output the column headings
	fputcsv($output, array('Station', 'Station Name', 'State', 'Country', 'DataFrom', 'DataTo', 'HPCP'));

	// fetch the data
	while($row  = $dbConnection->fetchAssoc())
	{
		fputcsv($output, $row);
	}
}

unset($dbConnection);
//export2csv_hourlydata.php?state=AL&station=010008&ietd=2&from=2010-09-01+00%3A09%3A00&to=2016-09-01+00%3A09%3A00