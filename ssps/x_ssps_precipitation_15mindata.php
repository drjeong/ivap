<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;


// DB table to use
$table = 'Precipitation_15MinData_Summary';
$joinQuery = "FROM `{$table}` AS `PSUMMARY` INNER JOIN `Precipitation_15MinData_Stations` AS `PSTA` ON (`PSUMMARY`.`Station`=`PSTA`.`COOP`) ";


// Table's primary key
$primaryKey = 'Station';

// Array of database columns which should be read and sent back to DataTables.
// The `db` parameter represents the column name in the database, while the `dt`
// parameter represents the DataTables column identifier. In this case simple
// indexes + the primary key column for the id
$columns = array(
    array('db' => '`PSUMMARY`.`Station`', 'dt' => 'DT_RowId', 'field' => 'Station', 'formatter' => function( $d, $row ) {
        // Technically a DOM id cannot start with an integer, so we prefix
        // a string. This can also be useful if you have multiple tables
        // to ensure that the id is unique with a different prefix
        return 'row_'.$d;
    }
    ),
    array( 'db' => '`PSUMMARY`.`Station`', 'dt' => 'Station', 'field' => 'Station', 'as' => 'Station', 'formatter' => function( $d, $row ) {
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
    array( 'db' => '`PSUMMARY`.`DataFrom`', 'dt' => 'DataFrom', 'field' => 'DataFrom', 'as' => 'DataFrom', 'formatter' => function( $d, $row ) {
        return $d;
    }
    ),
    array( 'db' => '`PSUMMARY`.`DataTo`', 'dt' => 'DataTo', 'field' => 'DataTo', 'as' => 'DataTo', 'formatter' => function( $d, $row ) {
        return $d;
    }
    ),
    array( 'db' => '`PSUMMARY`.`NumofRecords`', 'dt' => 'NumofRecords', 'field' => 'NumofRecords', 'as' => 'NumofRecords', 'formatter' => function( $d, $row ) {
        return $d;
    }
    ),
    array( 'db' => '`PSUMMARY`.`Date`', 'dt' => 'Date', 'field' => 'Date', 'as' => 'Date', 'formatter' => function( $d, $row ) {
        return $d;
    }
    )
);

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * If you just want to use the basic configuration for DataTables with PHP
 * server-side, there is no need to edit below this line.
 */
require( 'ssp.join.class.php' );
$groupBy = '';
$extraWhere = '';

require_once('../php_include/dbconnection.php');
echo json_encode(
    SSP::joinquery( $_GET, getSqlConnAttributes(), $table, $primaryKey, $columns, $joinQuery, $extraWhere, $groupBy, false)
);
