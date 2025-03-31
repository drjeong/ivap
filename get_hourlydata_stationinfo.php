<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

$Station_IDX = '';
if(isset($_GET['station'])) $Station_IDX = $_GET['station'];

if ($Station_IDX == '') exit;

include_once ('./php_include/dbconnection_class.php');
$dbConnection = new Dbconnection;

$sql="SELECT Date(`SUMRY`.`BEG_DT`) AS `DataFrom`, Date(`SUMRY`.`END_DT`) AS `DataTo`, `STATION`.`Name`, `STATION`.`EL_GR_FT` AS `Elevation`, `STATION`.`LAT` AS `Latitude`, `STATION`.`LON` AS `Longitude`  FROM `newweatherstations` AS `STATION` INNER JOIN `hourlyprecipitation_summary` AS `SUMRY` ON (`SUMRY`.`Station`=`STATION`.`IDX`) WHERE `IDX` =$Station_IDX";
//echo $sql;

$dbConnection->sendQuery($sql);

$obj = array();
while($row = $dbConnection->fetchAssoc()) $obj[] = $row;
unset($dbConnection);

print_r(json_encode($obj));
