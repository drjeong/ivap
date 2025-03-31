<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if(!isset($_SESSION['IETD_USERIDX'])) exit;




// DB table to use
$table = 'INTEGRATED_SURFACE_DATA'; 
$joinQuery = "FROM `{$table}` AS `ISD` INNER JOIN `Stations` AS `STA` ON (`ISD`.`StationIDX`=`STA`.`Idx`) LEFT JOIN `MW1` ON (`ISD`.`Idx`=`MW1`.`ISD`)";


// Table's primary key
$primaryKey = 'Idx';

// Array of database columns which should be read and sent back to DataTables.
// The `db` parameter represents the column name in the database, while the `dt`
// parameter represents the DataTables column identifier. In this case simple
// indexes + the primary key column for the id
$columns = array(
    array('db' => '`ISD`.`Idx`', 'dt' => 'DT_RowId', 'field' => 'Idx', 'formatter' => function( $d, $row ) {
            // Technically a DOM id cannot start with an integer, so we prefix
            // a string. This can also be useful if you have multiple tables
            // to ensure that the id is unique with a different prefix
            return 'row_'.$d;
		}
    ),
    array( 'db' => '`STA`.`CATALOG_identifier`', 'dt' => 'STATION_CATALOG_identifier', 'field' => 'STATION_CATALOG_identifier', 'as' => 'STATION_CATALOG_identifier', 'formatter' => function( $d, $row ) {
			$string = $d;
			if ($row[6] != '') $string = $d.'('.$row[6].')';
            return '<div align="center">'.$string.'</div>';
		}
    ),
    array( 'db' => 'DATE_FORMAT(`ISD`.`date`,\'%Y-%m-%d\')', 'dt' => 'date', 'field' => 'date', 'as' => 'date', 'formatter' => function( $d, $row ) {
            return '<div align="center">'.$d.'</div>';
		}
    ),
    array( 'db' => 'AVG(`ISD`.`air_temperature`)', 'dt' => 'air_temperature', 'field' => 'air_temperature', 'as' => 'air_temperature', 'formatter' => function( $d, $row ) {
            return '<div align="center">'.$d.'</div>';
		}
    ),
    array( 'db' => 'AVG(`ISD`.`speed_rate`)', 'dt' => 'speed_rate', 'field' => 'speed_rate', 'as' => 'speed_rate', 'formatter' => function( $d, $row ) {
            return '<div align="center">'.$d.'</div>';
		}
    ),
	array( 'db' => '`MW1`.`Field1`', 'dt' => 'atmospheric_condition_code', 'field' => 'atmospheric_condition_code', 'as' => 'atmospheric_condition_code', 'formatter' => function( $d, $row ) {
            return '<div align="center">'.$d.'</div>';
		}
    ),
	array( 'db' => '`STA`.`CallLetter`', 'dt' => 'CallLetter', 'field' => 'CallLetter', 'as' => 'CallLetter'),
);

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * If you just want to use the basic configuration for DataTables with PHP
 * server-side, there is no need to edit below this line.
 */
require( 'ssp.join.class.php' );
$condition = "";
$groupby = "DAY(`ISD`.`date`), `STA`.`CATALOG_identifier`";

echo json_encode(
	SSP::joinquery( $_GET, getSqlConnAttributes(), $table, $primaryKey, $columns, $joinQuery, $condition, $groupby)
);
