<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

$State = '';
if(isset($_GET['state'])) $State = strtoupper($_GET['state']);

if ($State == '') exit;

include_once ('./php_include/dbconnection_class.php');
$dbConnection = new Dbconnection;

$Query="SELECT `STNS`.`IDX` AS 'IDX', 
    `STNS`.`NCDC_ID`, `STNS`.`COOP_ID`, `STNS`.`GHCND_ID`, `STNS`.`FAA_ID`, `STNS`.`Name`, `STNS`.`LAT`, `STNS`.`LON`, ".
    "DATE(`SUMMRY`.`BEG_DT`) AS `BEG_DT`, DATE(`SUMMRY`.`END_DT`) AS `END_DT`, `SUMMRY`.`NumofRecords` AS `Records` ".
    "FROM `newweatherstations` AS `STNS` INNER JOIN `hourlyprecipitation_summary` AS `SUMMRY` ".
    "ON (`STNS`.`IDX`=`SUMMRY`.`Station`) ".
    "WHERE `ST`=? ORDER BY `ST`, `NAME`";
//echo $Query;

$result = $dbConnection->prepareExecute($Query, [$State]);
$obj = [];
if ($result && is_array($result)) {
    foreach ($result as $row) {
        $obj[] = $row;  // Add each row to the result array
    }
}
unset($dbConnection);

print_r(json_encode($obj));
