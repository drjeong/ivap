<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

include_once('../php_include/dbconnection_class.php');
$dbConnection = new Dbconnection;

$Query = "SELECT `MA`.`Idx`, `MA`.`IETD`, `MA`.`User`, `MA`.`FromDateTime`, `MA`.`ToDateTime`, `ST`.`Name`, `MA`.`Date`  FROM `Precipitation_HourlyData_MstsAnalysis` AS `MA` INNER JOIN `Precipitation_HourlyData_MstsStations` AS `MS` ON (`MA`.`Idx`=`MS`.`Analysis`) INNER JOIN `precipitation_hourlydata_stations` AS `ST` ON (`MS`.`Station`=`ST`.`COOP`) ";

//echo ($Query);

$data_array = array();
$result = $dbConnection->sendQuery($Query);
if($dbConnection->Fnum_rows() > 0)//if it finds any row
{
	$ArrayCnt = 0;
	$PrevItem = 0;
	while($row  = $dbConnection->fetchAssoc())
	{
		if ($PrevItem == $row["Idx"]){//  multiple stations
			$Tmp = $data_array[$ArrayCnt-1]['Stations'];
			$Tmp .= " | ".$row['Name'];
			$data_array[$ArrayCnt-1]['Stations'] = $Tmp;
			continue; 
		}

		$row_array['Idx'] = $row["Idx"];
		$row_array['IETD'] = $row["IETD"];
		$row_array['User'] = $row["User"];
		$row_array['FromDateTime'] = $row["FromDateTime"];
		$row_array['ToDateTime'] = $row["ToDateTime"];
		$row_array['Stations'] = $row["Name"];
		$row_array['Date'] = $row["Date"];

		array_push($data_array,$row_array);
		unset($row_array);

		$PrevItem = $row["Idx"];
		$ArrayCnt++;
	}
}
$json_data = array(
                "data" => $data_array
            );
echo json_encode($json_data);


//$Query = "FROM `Precipitation_HourlyData_MstsAnalysis` AS `MA` INNER JOIN `Precipitation_HourlyData_MstsStations` AS `MS` ON (`MA`.`Idx`=`MS`.`Analysis`) INNER JOIN `precipitation_hourlydata_stations` AS `ST` ON (`MS`.`Station`=`ST`.`COOP`) ";
//
////echo $joinQuery;
//
//// Table's primary key
//$primaryKey = 'Idx';
//
//// Array of database columns which should be read and sent back to DataTables.
//// The `db` parameter represents the column name in the database, while the `dt`
//// parameter represents the DataTables column identifier. In this case simple
//// indexes + the primary key column for the id
//$columns = array(
//    array('db' => '`MA`.`Idx`', 'dt' => 'DT_RowId', 'field' => 'Idx', 'formatter' => function( $d, $row ) {
//            // Technically a DOM id cannot start with an integer, so we prefix
//            // a string. This can also be useful if you have multiple tables
//            // to ensure that the id is unique with a different prefix
//            return 'row_'.$d;
//		}
//    ),
//    array( 'db' => '`MS`.`Station`', 'dt' => 'Station', 'field' => 'Station', 'as' => 'Station', 'formatter' => function( $d, $row ) {
//            return $d;
//		}
//    ),
//    array( 'db' => '`ST`.`Name`', 'dt' => 'Name', 'field' => 'Name', 'as' => 'Name', 'formatter' => function( $d, $row ) {
//            return $d;
//		}
//    ),
//    array( 'db' => '`ST`.`State`', 'dt' => 'State', 'field' => 'State', 'as' => 'State', 'formatter' => function( $d, $row ) {
//            return $d;
//		}
//    ),
//    array( 'db' => '`ST`.`Country`', 'dt' => 'Country', 'field' => 'Country', 'as' => 'Country', 'formatter' => function( $d, $row ) {
//            return $d;
//		}
//    ),
//    array( 'db' => '`MA`.`FromDateTime`', 'dt' => 'FromDateTime', 'field' => 'FromDateTime', 'as' => 'FromDateTime', 'formatter' => function( $d, $row ) {
//            return $d;
//		}
//    ),
//    array( 'db' => '`MA`.`ToDateTime`', 'dt' => 'ToDateTime', 'field' => 'ToDateTime', 'as' => 'ToDateTime', 'formatter' => function( $d, $row ) {
//            return $d;
//		}
//    ),
//    array( 'db' => '`MA`.`UserID`', 'dt' => 'UserID', 'field' => 'UserID', 'as' => 'UserID', 'formatter' => function( $d, $row ) {
//            return $d;
//		}
//    ),
//	array( 'db' => '`MA`.`IETD`', 'dt' => 'IETD', 'field' => 'IETD', 'as' => 'IETD', 'formatter' => function( $d, $row ) {
//            return $d;
//		}
//    ),
//    array( 'db' => '`MA`.`Date`', 'dt' => 'Date', 'field' => 'Date', 'as' => 'Date', 'formatter' => function( $d, $row ) {
//            return $d;
//		}
//    ),
//);
//
///* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// * If you just want to use the basic configuration for DataTables with PHP
// * server-side, there is no need to edit below this line.
// */
//require( 'ssp.join.class.php' );
//$condition = '';
////$condition = "`PSTA`.`State`='$State' AND `PANALYZ`.`Station`='$Station_coop' AND DATE_FORMAT(`PANALYZ`.`FromDateTime`, '%Y-%m-%d %H:%i:%s')='$FromDateTime' AND DATE_FORMAT(`PANALYZ`.`ToDateTime`, '%Y-%m-%d %H:%i:%s')='$ToDateTime' AND `UserID`='".$_SESSION['IETD_USERNAME']."' ";
////echo ($condition);
//
//echo json_encode(
//	SSP::joinquery( $_GET, getSqlConnAttributes(), $table, $primaryKey, $columns, $joinQuery, $condition)
//);
