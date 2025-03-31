<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

$FromDate = '';
$ToDate = '';
$State = '';
$Station_idx = '';

if(isset($_GET['from'])) $FromDate = $_GET['from'];
if(isset($_GET['to'])) $ToDate = $_GET['to'];
if(isset($_GET['state'])) $State = strtolower($_GET['state']);
if(isset($_GET['station'])) $Station_idx = $_GET['station'];
if(isset($_GET['idx'])) $AnalyzeIdx = $_GET['idx'];

$AnalyzeIdx = (isset($_SESSION['azidx'])) ? $_SESSION['azidx'] : '';

if ($FromDate=='' || $ToDate=='' || $State=='' || $Station_idx=='' || $AnalyzeIdx=='')
{
    echo('{"draw":0,"recordsTotal":0,"recordsFiltered":0,"data":[]}');
    exit;
}

// DB table to use
$table = "hourlyprecipitation_".strtolower($State);
$joinQuery = "FROM `{$table}` AS `DATA` INNER JOIN `newweatherstations` AS `STN` ON (`DATA`.`Station`=`STN`.`IDX`) ";

// Table's primary key
$primaryKey = '`STN`.`IDX`';

// Array of database columns which should be read and sent back to DataTables.
// The `db` parameter represents the column name in the database, while the `dt`
// parameter represents the DataTables column identifier. In this case simple
// indexes + the primary key column for the id
$columns = array(
    array('db' => '`DATA`.`Idx`', 'dt' => 'DT_RowId', 'field' => 'Idx', 'formatter' => function( $d, $row ) {
            // Technically a DOM id cannot start with an integer, so we prefix
            // a string. This can also be useful if you have multiple tables
            // to ensure that the id is unique with a different prefix
            return 'row_'.$d;
		}
    ),
    array( 'db' => '`DATA`.`Station`', 'dt' => 'Station', 'field' => 'Station', 'as' => 'Station', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`STN`.`Name`', 'dt' => 'Name', 'field' => 'Name', 'as' => 'Name', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`STN`.`ST`', 'dt' => 'State', 'field' => 'State', 'as' => 'State', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`STN`.`Country`', 'dt' => 'Country', 'field' => 'Country', 'as' => 'Country', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`DATA`.`Date` - INTERVAL 1 HOUR', 'dt' => 'FromDateTime', 'field' => 'FromDateTime', 'as' => 'FromDateTime', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`DATA`.`Date`', 'dt' => 'ToDateTime', 'field' => 'ToDateTime', 'as' => 'ToDateTime', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
	array( 'db' => '`DATA`.`HPCP`', 'dt' => 'HPCP', 'field' => 'HPCP', 'as' => 'HPCP', 'formatter' => function( $d, $row ) {
			if ($d == null) $d = 'NULL';
            return $d;
		}
    )
);

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * If you just want to use the basic configuration for DataTables with PHP
 * server-side, there is no need to edit below this line.
 */
require( 'ssp.join.class.php' );
$extraWhere = "`STN`.`ST`='$State' AND `STN`.`IDX`='$Station_idx' AND DATE(`DATA`.`Date`)>='$FromDate' AND DATE(`DATA`.`Date`)<='$ToDate' AND `DATA`.`HPCP`>=0 AND `DATA`.`HPCP` IS NOT NULL";
//$extraWhere = "`DATA`.`Idx`='$AnalyzeIdx'";
$groupBy = '';

require_once('../php_include/dbconnection.php');
echo json_encode(
    SSP::joinquery( $_GET, getSqlConnAttributes(), $table, $primaryKey, $columns, $joinQuery, $extraWhere, $groupBy, false)
);
