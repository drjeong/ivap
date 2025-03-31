<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

$From = '';
$To = '';
$State = '';
$$Station_Idx = '';

if(isset($_GET['from'])) $From = $_GET['from'];
if(isset($_GET['to'])) $To = $_GET['to'];
if(isset($_GET['state'])) $State = strtolower($_GET['state']);
if(isset($_GET['station'])) $$Station_Idx = $_GET['station'];

if ($From=='' || $To=='' || $State=='' || $$Station_Idx=='')
{
    echo('{"draw":0,"recordsTotal":0,"recordsFiltered":0,"data":[]}');
    exit;
}

// DB table to use
$table = 'Precipitation_Data'; 
$joinQuery = "FROM `{$table}` AS `PDATA` INNER JOIN `precipitation_hourlydata_stations` AS `PSTA` ON (`PDATA`.`Station`=`PSTA`.`COOP`) ";

// Table's primary key
$primaryKey = 'Idx';

// Array of database columns which should be read and sent back to DataTables.
// The `db` parameter represents the column name in the database, while the `dt`
// parameter represents the DataTables column identifier. In this case simple
// indexes + the primary key column for the id
$columns = array(
    array('db' => '`PDATA`.`Idx`', 'dt' => 'DT_RowId', 'field' => 'Idx', 'formatter' => function( $d, $row ) {
            // Technically a DOM id cannot start with an integer, so we prefix
            // a string. This can also be useful if you have multiple tables
            // to ensure that the id is unique with a different prefix
            return 'row_'.$d;
		}
    ),
    array( 'db' => '`PDATA`.`Station`', 'dt' => 'Station', 'field' => 'Station', 'as' => 'Station', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`PSTA`.`Name`', 'dt' => 'Name', 'field' => 'Name', 'as' => 'Name', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`PSTA`.`State`', 'dt' => 'State', 'field' => 'State', 'as' => 'State', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`PSTA`.`Country`', 'dt' => 'Country', 'field' => 'Country', 'as' => 'Country', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`PDATA`.`Date`', 'dt' => 'Date', 'field' => 'Date', 'as' => 'Date', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
	array( 'db' => '`PDATA`.`QPCP`', 'dt' => 'QPCP', 'field' => 'QPCP', 'as' => 'QPCP', 'formatter' => function( $d, $row ) {
			if ($d == null) $d = 'NULL';
            return $d;
		}
    ),
	array( 'db' => '`PDATA`.`QGAG`', 'dt' => 'QGAG', 'field' => 'QGAG', 'as' => 'QGAG', 'formatter' => function( $d, $row ) {
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
$extraWhere = "`PSTA`.`State`='$State' AND `PSTA`.`COOP`='$$Station_Idx' AND `PDATA`.`Date`>='$From' AND `PDATA`.`Date`<='$To' ";
$groupBy = '';

require_once('../php_include/dbconnection.php');
echo json_encode(
    SSP::joinquery( $_GET, getSqlConnAttributes(), $table, $primaryKey, $columns, $joinQuery, $extraWhere, $groupBy, false)
);

