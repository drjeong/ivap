<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

ini_set('display_errors', 1);
error_reporting(E_ALL);

// DB table to use
$table = 'newweatherstations';
$joinQuery = "FROM `{$table}` AS `STNS` INNER JOIN `hourlyprecipitation_summary` AS `SMRY` ON (`STNS`.`IDX` = `SMRY`.`Station`) ";

// Table's primary key
$primaryKey = '`STNS`.`Idx`';

// Array of database columns which should be read and sent back to DataTables.
// The `db` parameter represents the column name in the database, while the `dt`
// parameter represents the DataTables column identifier. In this case simple
// indexes + the primary key column for the id
$columns = array(
    array('db' => '`STNS`.`Idx`', 'dt' => 'DT_RowId', 'field' => 'Idx', 'formatter' => function( $d, $row ) {
            // Technically a DOM id cannot start with an integer, so we prefix
            // a string. This can also be useful if you have multiple tables
            // to ensure that the id is unique with a different prefix
            return 'row_'.$d;
		}
    ),
    array( 'db' => '`STNS`.`COOP_ID`', 'dt' => 'COOP_ID', 'field' => 'COOP_ID', 'as' => 'COOP_ID'),
    array( 'db' => '`STNS`.`NCDC_ID`', 'dt' => 'NCDC_ID', 'field' => 'NCDC_ID', 'as' => 'NCDC_ID'),
    array( 'db' => '`STNS`.`WBAN_ID`', 'dt' => 'WBAN_ID', 'field' => 'WBAN_ID', 'as' => 'WBAN_ID'),
    array( 'db' => '`STNS`.`NAME`', 'dt' => 'NAME', 'field' => 'NAME', 'as' => 'NAME'),
    array( 'db' => '`STNS`.`ST`', 'dt' => 'ST', 'field' => 'ST', 'as' => 'ST'),
    array( 'db' => '`STNS`.`COUNTRY_CODE`', 'dt' => 'COUNTRY_CODE', 'field' => 'COUNTRY_CODE', 'as' => 'COUNTRY_CODE'),
    array( 'db' => '`STNS`.`BEG_DT`', 'dt' => 'BEG_DT', 'field' => 'BEG_DT', 'as' => 'BEG_DT'),
    array( 'db' => '`STNS`.`END_DT`', 'dt' => 'END_DT', 'field' => 'END_DT', 'as' => 'END_DT'),
    array( 'db' => '`SMRY`.`BEG_DT`', 'dt' => 'ABEG_DT', 'field' => 'ABEG_DT', 'as' => 'ABEG_DT'),
    array( 'db' => '`SMRY`.`END_DT`', 'dt' => 'AEND_DT', 'field' => 'AEND_DT', 'as' => 'AEND_DT')
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
