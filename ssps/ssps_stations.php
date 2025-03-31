<?php
//if (session_status() === PHP_SESSION_NONE) { session_start(); }
//if(!isset($_SESSION['IETD_USERIDX'])) exit;

// DB table to use
$table = 'newweatherstations';
$joinQuery = "FROM `{$table}`";

// Table's primary key
$primaryKey = 'Idx';

// Array of database columns which should be read and sent back to DataTables.
// The `db` parameter represents the column name in the database, while the `dt`
// parameter represents the DataTables column identifier. In this case simple
// indexes + the primary key column for the id
$columns = array(
    array('db' => 'Idx', 'dt' => 'DT_RowId', 'field' => 'Idx', 'formatter' => function( $d, $row ) {
            // Technically a DOM id cannot start with an integer, so we prefix
            // a string. This can also be useful if you have multiple tables
            // to ensure that the id is unique with a different prefix
            return 'row_'.$d;
		}
    ),
    array( 'db' => 'COOP_ID', 'dt' => 'COOP_ID', 'field' => 'COOP_ID', 'as' => 'COOP_ID'),
//    array( 'db' => 'GHCND_ID', 'dt' => 'GHCND_ID', 'field' => 'GHCND_ID', 'as' => 'GHCND_ID'),
    array( 'db' => 'NCDC_ID', 'dt' => 'NCDC_ID', 'field' => 'NCDC_ID', 'as' => 'NCDC_ID'),
//    array( 'db' => 'NWSLI_ID', 'dt' => 'NWSLI_ID', 'field' => 'NWSLI_ID', 'as' => 'NWSLI_ID'),
//    array( 'db' => 'FAA_ID', 'dt' => 'FAA_ID', 'field' => 'FAA_ID', 'as' => 'FAA_ID'),
    array( 'db' => 'WBAN_ID', 'dt' => 'WBAN_ID', 'field' => 'WBAN_ID', 'as' => 'WBAN_ID'),
//    array( 'db' => 'WMO_ID', 'dt' => 'WMO_ID', 'field' => 'WMO_ID', 'as' => 'WMO_ID'),
//    array( 'db' => 'ICAO_ID', 'dt' => 'ICAO_ID', 'field' => 'ICAO_ID', 'as' => 'ICAO_ID'),
//    array( 'db' => 'TRANSMITTAL_ID', 'dt' => 'TRANSMITTAL_ID', 'field' => 'TRANSMITTAL_ID', 'as' => 'TRANSMITTAL_ID'),
    array( 'db' => 'NAME', 'dt' => 'NAME', 'field' => 'NAME', 'as' => 'NAME'),
    array( 'db' => 'ST', 'dt' => 'ST', 'field' => 'ST', 'as' => 'ST'),
//    array( 'db' => 'COUNTY', 'dt' => 'COUNTY', 'field' => 'COUNTY', 'as' => 'COUNTY'),
//    array( 'db' => 'COUNTRY_CODE', 'dt' => 'COUNTRY_CODE', 'field' => 'COUNTRY_CODE', 'as' => 'COUNTRY_CODE'),
    array( 'db' => 'ELEV', 'dt' => 'ELEV', 'field' => 'ELEV', 'as' => 'ELEV'),
    array( 'db' => 'LAT', 'dt' => 'LAT', 'field' => 'LAT', 'as' => 'LAT'),
    array( 'db' => 'LON', 'dt' => 'LON', 'field' => 'LON', 'as' => 'LON'),
    array( 'db' => 'BEG_DT', 'dt' => 'BEG_DT', 'field' => 'BEG_DT', 'as' => 'BEG_DT'),
    array( 'db' => 'END_DT', 'dt' => 'END_DT', 'field' => 'END_DT', 'as' => 'END_DT')
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
