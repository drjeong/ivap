<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

$AnalyzeIdx = '';
if(isset($_GET['idx'])) $AnalyzeIdx = $_GET['idx'];
if ($AnalyzeIdx == '')
{
    echo('{"draw":0,"recordsTotal":0,"recordsFiltered":0,"data":[]}');
    exit;
}

// DB table to use
$table = 'hourlyprecipitation_analysis';
$joinQuery = "FROM `{$table}` AS `PANALYZ` INNER JOIN `hourlyprecipitation_analysis_data` AS `PDATA` ON (`PANALYZ`.`Idx`=`PDATA`.`Analysis`)";

// Table's primary key
$primaryKey = '`PANALYZ`.`Idx`';

// Array of database columns which should be read and sent back to DataTables.
// The `db` parameter represents the column name in the database, while the `dt`
// parameter represents the DataTables column identifier. In this case simple
// indexes + the primary key column for the id
$columns = array(
    array( 'db' => '`PDATA`.`FromDateTime`', 'dt' => 'FromDateTime', 'field' => 'FromDateTime', 'as' => 'FromDateTime', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
    array( 'db' => '`PDATA`.`ToDateTime`', 'dt' => 'ToDateTime', 'field' => 'ToDateTime', 'as' => 'ToDateTime', 'formatter' => function( $d, $row ) {
            return $d;
		}
    ),
	array( 'db' => '`PDATA`.`HPCP`', 'dt' => 'HPCP', 'field' => 'HPCP', 'as' => 'HPCP', 'formatter' => function( $d, $row ) {
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
$extraWhere = "`PANALYZ`.`Idx`='$AnalyzeIdx'";
$groupBy = '';

require_once('../php_include/dbconnection.php');
echo json_encode(
    SSP::joinquery( $_GET, getSqlConnAttributes(), $table, $primaryKey, $columns, $joinQuery, $extraWhere, $groupBy, false)
);
