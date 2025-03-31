<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

// DB table to use
$table = 'precipitation_hourlydata_analysis';
$joinQuery = "FROM `{$table}` AS `PANALYZ` INNER JOIN `precipitation_hourlydata_stations` AS `PSTA` ON (`PANALYZ`.`Station`=`PSTA`.`COOP`)";

// Table's primary key
$primaryKey = '`PANALYZ`.`Idx`';

// Array of database columns which should be read and sent back to DataTables.
// The `db` parameter represents the column name in the database, while the `dt`
// parameter represents the DataTables column identifier. In this case simple
// indexes + the primary key column for the id
$columns = array(
    array('db' => '`PANALYZ`.`Idx`', 'dt' => 'DT_RowId', 'field' => 'Idx', 'formatter' => function( $d, $row ) {
            // Technically a DOM id cannot start with an integer, so we prefix
            // a string. This can also be useful if you have multiple tables
            // to ensure that the id is unique with a different prefix
            return 'row_'.$d;
		}
    ),
    array( 'db' => '`PANALYZ`.`Station`', 'dt' => 'Station', 'field' => 'Station', 'as' => 'Station', 'formatter' => function( $d, $row ) {
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
    array( 'db' => '`PANALYZ`.`FromDateTime`', 'dt' => 'FromDateTime', 'field' => 'FromDateTime', 'as' => 'FromDateTime', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`PANALYZ`.`ToDateTime`', 'dt' => 'ToDateTime', 'field' => 'ToDateTime', 'as' => 'ToDateTime', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`PANALYZ`.`User`', 'dt' => 'User', 'field' => 'User', 'as' => 'User', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
	array( 'db' => '`PANALYZ`.`IETD`', 'dt' => 'IETD', 'field' => 'IETD', 'as' => 'IETD', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`PANALYZ`.`Date`', 'dt' => 'Date', 'field' => 'Date', 'as' => 'Date', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
);

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * If you just want to use the basic configuration for DataTables with PHP
 * server-side, there is no need to edit below this line.
 */
require( 'ssp.join.class.php' );
$extraWhere = '';
$groupBy = '';

require_once('../php_include/dbconnection.php');
echo json_encode(
    SSP::joinquery( $_GET, getSqlConnAttributes(), $table, $primaryKey, $columns, $joinQuery, $extraWhere, $groupBy, false)
);
