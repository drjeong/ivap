<?php 
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

include_once ('./php_include/dbconnection_class.php');
$dbConnection = new Dbconnection;

$query ="SELECT `Idx`, DISTINCT(`State`) FROM `STATIONS`;";
//echo $query;
$result = $dbConnection->sendQuery($query);
while($row  = $dbConnection->fetchAssoc())
{
	echo ("<option value=\"".$row["Idx"]."\">".$row["Name"]."</option>");
}

unset($dbConnection);