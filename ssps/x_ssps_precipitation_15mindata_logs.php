<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;



// DB table to use
$table = 'Precipitation_15MinData_Logs';
$joinQuery = "FROM `{$table}` ";

// Table's primary key
$primaryKey = 'Idx';

// Array of database columns which should be read and sent back to DataTables.
// The `db` parameter represents the column name in the database, while the `dt`
// parameter represents the DataTables column identifier. In this case simple
// indexes + the primary key column for the id
$columns = array(
    array('db' => '`Idx`', 'dt' => 'DT_RowId', 'field' => 'Idx', 'formatter' => function( $d, $row ) {
            // Technically a DOM id cannot start with an integer, so we prefix
            // a string. This can also be useful if you have multiple tables
            // to ensure that the id is unique with a different prefix
            return 'row_'.$d;
		}
    ),
    array( 'db' => '`User`', 'dt' => 'User', 'field' => 'User', 'as' => 'User', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`FileName`', 'dt' => 'FileName', 'field' => 'FileName', 'as' => 'FileName', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`NumOfLines`', 'dt' => 'NumOfLines', 'field' => 'NumOfLines', 'as' => 'NumOfLines', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`Date`', 'dt' => 'Date', 'field' => 'Date', 'as' => 'Date', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`UploadFinishedDate`', 'dt' => 'FinDate', 'field' => 'FinDate', 'as' => 'FinDate', 'formatter' => function( $d, $row ) {
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
