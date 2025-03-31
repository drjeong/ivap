<?php
// ssps/ssps_ietdanalysis_st_sum.php?state=AK&station=34013&ietd=3&from=2013-02-01&to=2023-01-01

if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;

$IETD = '';
$FromDate = '';
$ToDate = '';
$Station_Idx = '';
$State = '';
if(isset($_GET['ietd'])) $IETD = $_GET['ietd'];
if(isset($_GET['from'])) $FromDate = $_GET['from'];
if(isset($_GET['to'])) $ToDate = $_GET['to'];
if(isset($_GET['station'])) $Station_Idx = $_GET['station'];
if(isset($_GET['state'])) $State = strtolower($_GET['state']);

if ($State == '' || $Station_Idx == '' || $IETD == '' || $FromDate == '' || $ToDate == '' )
{
    echo('{"draw":0,"recordsTotal":0,"recordsFiltered":0,"data":[]}');
    exit;
}

$table = "hourlyprecipitation_$State";
$Query = "FROM `{$table}`";

// Table's primary key
$primaryKey = 'Idx';

// Array of database columns which should be read and sent back to DataTables.
// The `db` parameter represents the column name in the database, while the `dt`
// parameter represents the DataTables column identifier. In this case simple
// indexes + the primary key column for the id
$columns = array(
    array( 'db' => "DATE_ADD('1800-01-01 00:00:00', Interval FLOOR(TIMESTAMPDIFF(HOUR, '1800-01-01 00:00:00', `Date`) / $IETD) * $IETD HOUR)", 'dt' => 'FromDateTime', 'field' => 'FromDateTime', 'as' => 'FromDateTime', 'formatter' => function( $d, $row ) {
        return $d;
    }),
    array( 'db' => "DATE_ADD( DATE_ADD('1800-01-01 00:00:00', Interval FLOOR(TIMESTAMPDIFF(HOUR, '1800-01-01 00:00:00', `Date`) / $IETD) * $IETD HOUR), INTERVAL $IETD HOUR)", 'dt' => 'ToDateTime', 'field' => 'ToDateTime', 'as' => 'ToDateTime', 'formatter' => function( $d, $row ) {
        return $d;
    }),
    array( 'db' => 'ROUND(SUM(`HPCP`), 2)', 'dt' => 'HPCP', 'field' => 'HPCP', 'as' => 'HPCP', 'formatter' => function( $d, $row ) {
        if ($d == null) $d = 'NULL';
        return $d;
    }),
    array( 'db' => 'COUNT(*)', 'dt' => 'CNT', 'field' => 'CNT', 'as' => 'CNT', 'formatter' => function( $d, $row ) {
        return $d;
    })
);

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * If you just want to use the basic configuration for DataTables with PHP
 * server-side, there is no need to edit below this line.
 */
require( 'ssp.join.class.php' );
$extraWhere = "`Station`='$Station_Idx' AND `HPCP` > 0 AND DATE(`Date`)>='$FromDate' AND DATE(`Date`)<='$ToDate'";
$groupBy = "`FromDateTime`";

require_once('../php_include/dbconnection.php');
echo json_encode(
    SSP::joinquery( $_GET, getSqlConnAttributes(), $table, $primaryKey, $columns, $Query, $extraWhere, $groupBy, false)
);
